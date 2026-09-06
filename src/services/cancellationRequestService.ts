// The paid-booking cancellation + refund workflow -- distinct from cancelBooking in
// bookingService.ts, which only ever applies to a still-PENDING+UNPAID booking.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { CancellationRequest, CancellationRequestStatus, CreateCancellationRequestInput, RefundProofInput } from '@/types/cancellationRequest';

/** Customer self-service -- backend re-verifies ownership, paid status, no existing request, and
 *  the 24-hour-before-booking cutoff regardless of what the form already showed. */
export async function requestCancellation(input: CreateCancellationRequestInput): Promise<CancellationRequest> {
  const res = await httpClient.post<ApiEnvelope<CancellationRequest>>('/cancellation-requests', input);
  return res.data;
}

/** The caller's own cancellation requests, keyed client-side by bookingId (same pattern as
 *  reviewsByTour in MyBookings) to know which bookings already have one. */
export async function getMyCancellationRequests(): Promise<CancellationRequest[]> {
  const res = await httpClient.get<ApiEnvelope<CancellationRequest[]>>('/cancellation-requests/mine');
  return res.data;
}

/** Staff (SUPER_ADMIN/ADMIN) only. */
export async function listCancellationRequests(status?: CancellationRequestStatus): Promise<CancellationRequest[]> {
  const query = status ? `?status=${status}` : '';
  const res = await httpClient.get<ApiEnvelope<CancellationRequest[]>>(`/cancellation-requests${query}`);
  return res.data;
}

export async function approveCancellationRequest(id: number): Promise<CancellationRequest> {
  const res = await httpClient.patch<ApiEnvelope<CancellationRequest>>(`/cancellation-requests/${id}/approve`, undefined);
  return res.data;
}

export async function rejectCancellationRequest(id: number, rejectionReason: string): Promise<CancellationRequest> {
  const res = await httpClient.patch<ApiEnvelope<CancellationRequest>>(`/cancellation-requests/${id}/reject`, { rejectionReason });
  return res.data;
}

export async function addRefundProof(id: number, input: RefundProofInput): Promise<CancellationRequest> {
  const res = await httpClient.post<ApiEnvelope<CancellationRequest>>(`/cancellation-requests/${id}/refund-proof`, input);
  return res.data;
}

export async function completeRefund(id: number): Promise<CancellationRequest> {
  const res = await httpClient.patch<ApiEnvelope<CancellationRequest>>(`/cancellation-requests/${id}/complete`, undefined);
  return res.data;
}
