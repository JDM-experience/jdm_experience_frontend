import dayjs from 'dayjs';
import type { AvailabilityStatus } from '@/types/product';
import type { AvailabilityResult } from '@/types/availability';
import { isBookingAllowed, isBookingClosedForDate, isValidDateString } from './dateTime';

export { isBookingAllowed, isBookingClosedForDate, isValidDateString };

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

export function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
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
