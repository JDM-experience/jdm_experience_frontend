import dayjs from 'dayjs';
import type { AvailabilityStatus } from '@/types/product';
import type { AvailabilityResult } from '@/types/availability';
import type { Tour } from '@/types/tour';
import { BOOKING_CUTOFF_HOUR_JST, PROMO_CODE, PROMO_DISCOUNT_RATE } from '@/constants';

/** A Tour has no manual stock flag — availability instead comes directly from its tour-level
 *  `status`. There's no per-date slot list to check: once AVAILABLE, a customer can request any
 *  date that isn't already CONFIRMED-booked (see tourService.getBookedDates). */
export function tourAvailabilityStatus(tour: Pick<Tour, 'status'>): AvailabilityStatus {
  if (tour.status === 'UNDER_MAINTENANCE') return 'Under Maintenance';
  if (tour.status !== 'AVAILABLE') return 'Unavailable'; // PENDING or UNAVAILABLE
  return 'Available';
}

/**
 * Ported from car_helpers.php. `stock` is not an inventory count — it is a
 * manual admin override: 0 = Under Maintenance, 2 = Unavailable, anything
 * else = Available.
 */
export function manualStatusFromStock(stock: number): AvailabilityStatus {
  if (stock === 0) return 'Under Maintenance';
  if (stock === 2) return 'Unavailable';
  return 'Available';
}

/** Ported from car_helpers.php::car_effective_price(). */
export function effectivePrice(price: number, discount: number): number {
  return discount > 0 ? price - (price * discount) / 100 : price;
}

/** Ported from checkout.php's promo-code handling: knocks PROMO_DISCOUNT_RATE off `total` when
 *  `code` matches PROMO_CODE (case/whitespace-insensitive), otherwise returns `total` unchanged. */
export function applyPromoCode(total: number, code: string | null | undefined): number {
  if (code?.trim().toUpperCase() !== PROMO_CODE) return total;
  return total - total * PROMO_DISCOUNT_RATE;
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() && parsed.year() === y && parsed.month() + 1 === m && parsed.date() === d;
}

export function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getJSTNowParts(): { date: string; hourMinute: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  // Intl can report hour '24' for midnight in some environments.
  const hour = (Number(map.hour) % 24).toString().padStart(2, '0');
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hourMinute: `${hour}:${map.minute}`,
  };
}

/**
 * Ported from car_helpers.php::car_today_closed_for_date(). Same-day
 * reservations close after 5:00 PM Japan Standard Time; future dates are
 * always open.
 */
export function isBookingClosedForDate(date: string): boolean {
  if (!isValidDateString(date)) return true;
  const { date: todayJST, hourMinute } = getJSTNowParts();
  if (date !== todayJST) return false;
  return hourMinute > `${String(BOOKING_CUTOFF_HOUR_JST).padStart(2, '0')}:00`;
}

/**
 * Ported from car_helpers.php::car_availability_for_date(). The caller is
 * responsible for determining `alreadyBookedForDate` (mirrors the SQL check
 * against order_items in car_has_booking_for_date) so this function stays a
 * pure, easily testable rule.
 */
export function getAvailabilityForDate(
  stock: number,
  date: string,
  alreadyBookedForDate: boolean,
): AvailabilityResult {
  const manual = manualStatusFromStock(stock);

  if (manual === 'Under Maintenance') {
    return { status: 'Under Maintenance', bookable: false, message: 'This tour is currently under maintenance.' };
  }
  if (manual === 'Unavailable') {
    return { status: 'Unavailable', bookable: false, message: 'This tour is currently unavailable.' };
  }
  if (!date) {
    return { status: 'Available', bookable: false, message: 'Choose a tour date to check availability.' };
  }
  if (!isValidDateString(date)) {
    return { status: 'Unavailable', bookable: false, message: 'Please choose a valid tour date.' };
  }
  if (isBookingClosedForDate(date)) {
    return { status: 'Unavailable', bookable: false, message: 'Booking for today has closed. Please choose another date.' };
  }
  if (alreadyBookedForDate) {
    return { status: 'Unavailable', bookable: false, message: 'The selected date is unavailable for this tour.' };
  }
  return { status: 'Available', bookable: true, message: 'This tour is available for the selected date.' };
}

/** Ported from cart_helpers.php::format_tour_date(). */
export function formatTourDate(date: string): string {
  const parsed = dayjs(date, 'YYYY-MM-DD');
  return parsed.isValid() ? parsed.format('MMMM D, YYYY') : date;
}

/** Ported from cart_helpers.php::format_tour_time(). */
export function formatTourTime(time: string): string {
  const parsed = dayjs(`2000-01-01T${time}`);
  return parsed.isValid() ? parsed.format('h:mm A') : time;
}

// No per-booking time-of-day is stored (customers only ever pick a date), so "the scheduled
// booking time" for the paid-cancellation 24-hour cutoff is always this fixed JST slot -- mirrors
// DEFAULT_BOOKING_TIME_JST in the backend's src/lib/dateTime.ts exactly. UX-only: the backend
// re-enforces this regardless of what this function returns.
const DEFAULT_BOOKING_TIME_JST = '09:00';

/** True once more than 24 hours remain before `bookingDate` (a `YYYY-MM-DD` string) starts, JST.
 *  Exactly 24 hours counts as NOT eligible (strict `>`), matching the backend's enforcement. */
export function isMoreThan24HoursBeforeBooking(bookingDate: string): boolean {
  const dateOnly = bookingDate.slice(0, 10);
  const start = new Date(`${dateOnly}T${DEFAULT_BOOKING_TIME_JST}:00+09:00`);
  return start.getTime() - Date.now() > 24 * 60 * 60 * 1000;
}

/**
 * Admin Limited-Time Offer form helpers: the admin picks a start/end date+time meaning "JST wall
 * clock", never the browser's own local timezone (see the Limited-Time Offer spec's timezone
 * rule) -- a fixed "+09:00" offset is always correct since JST has no DST, same technique as the
 * backend's src/lib/dateTime.ts.
 */
export function jstDateTimeToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+09:00`).toISOString();
}

/** Inverse of jstDateTimeToIso -- used to pre-fill the admin form's date/time pickers from a
 *  server-returned UTC ISO instant (e.g. tour.limitedOffer.startAt). */
export function isoToJstDateTime(iso: string): { date: string; time: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(iso));
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  const hour = (Number(map.hour) % 24).toString().padStart(2, '0');
  return { date: `${map.year}-${map.month}-${map.day}`, time: `${hour}:${map.minute}` };
}
