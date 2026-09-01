import dayjs from 'dayjs';
import { BOOKING_CUTOFF_HOUR_JST } from '@/constants';

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() && parsed.year() === y && parsed.month() + 1 === m && parsed.date() === d;
}

export function getJSTNowParts(): { date: string; hourMinute: string } {
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
 * always open. Deliberately uses Intl's `Asia/Tokyo` timezone rather than
 * `new Date().getHours()`, which would use the user's/server's local
 * timezone instead of JST.
 */
export function isBookingClosedForDate(date: string): boolean {
  if (!isValidDateString(date)) return true;
  const { date: todayJST, hourMinute } = getJSTNowParts();
  if (date !== todayJST) return false;
  return hourMinute > `${String(BOOKING_CUTOFF_HOUR_JST).padStart(2, '0')}:00`;
}

/** Reusable JST-based booking-allowed check for a given YYYY-MM-DD date. */
export function isBookingAllowed(date: string): boolean {
  return isValidDateString(date) && !isBookingClosedForDate(date);
}
