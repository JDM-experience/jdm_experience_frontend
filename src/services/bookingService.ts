// Calls the real Node.js backend directly — see adminUserService.ts for why this bypasses
// the mock facade convention. Distinct from orderService.ts (the legacy mock-based Cart/
// Checkout flow): a real booking is created directly, one tour at a time, matching the real
// backend's model -- there is no cart step here.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { Booking, BookingStatus, CreateBookingInput, PaymentProof, SubmitPaymentProofInput } from '@/types/booking';

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

/** Staff (SUPER_ADMIN/ADMIN see all; TOUR_GUIDE sees only their own tours' bookings). */
export async function listAllBookings(): Promise<Booking[]> {
  const res = await httpClient.get<ApiEnvelope<Booking[]>>('/bookings');
  return res.data;
}

/** The booking's own customer, or staff -- backend verifies ownership either way. Does not
 *  confirm the booking; only records that proof was submitted (paymentStatus -> PENDING) and
 *  notifies staff/the tour owner. */
export async function submitPaymentProof(bookingId: number, input: SubmitPaymentProofInput): Promise<PaymentProof> {
  const res = await httpClient.post<ApiEnvelope<PaymentProof>>(`/bookings/${bookingId}/payment-proof`, input);
  return res.data;
}

export async function getPaymentProofs(bookingId: number): Promise<PaymentProof[]> {
  const res = await httpClient.get<ApiEnvelope<PaymentProof[]>>(`/bookings/${bookingId}/payment-proof`);
  return res.data;
}

/** Staff-only (SUPER_ADMIN/ADMIN/assigned TOUR_GUIDE) -- see updateBookingStatus in the backend
 *  for exactly what each status transition means (CONFIRMED sends the customer's confirmation
 *  email; CANCELLED + paymentStatus FAILED is how a rejected payment is recorded). */
export async function updateBookingStatus(id: number, status: BookingStatus): Promise<Booking> {
  const res = await httpClient.put<ApiEnvelope<Booking>>(`/bookings/${id}`, { status });
  return res.data;
}

export async function confirmBooking(id: number): Promise<Booking> {
  return updateBookingStatus(id, 'CONFIRMED');
}

/** "Reject Payment" -- reuses CANCELLED (no separate REJECTED status exists on the backend) plus
 *  paymentStatus FAILED so it's distinguishable in the data from a customer-initiated cancel. */
export async function rejectBookingPayment(id: number): Promise<Booking> {
  const res = await httpClient.put<ApiEnvelope<Booking>>(`/bookings/${id}`, { status: 'CANCELLED', paymentStatus: 'FAILED' });
  return res.data;
}
