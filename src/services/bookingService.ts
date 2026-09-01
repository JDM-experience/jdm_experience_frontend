// Calls the real Node.js backend directly — see adminUserService.ts for why this bypasses
// the mock facade convention. Distinct from orderService.ts (the legacy mock-based Cart/
// Checkout flow): a real booking is created directly, one tour at a time, matching the real
// backend's model -- there is no cart step here.
import { httpClient } from './httpClient';
import type { Booking, CreateBookingInput } from '@/types/booking';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const res = await httpClient.post<ApiEnvelope<Booking>>('/bookings', input);
  return res.data;
}

export async function getMyBookings(): Promise<Booking[]> {
  const res = await httpClient.get<ApiEnvelope<Booking[]>>('/bookings/my-bookings');
  return res.data;
}

export async function getBookingById(id: number): Promise<Booking> {
  const res = await httpClient.get<ApiEnvelope<Booking>>(`/bookings/${id}`);
  return res.data;
}
