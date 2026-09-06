// Mirrors the real backend's toPublicCancellationRequest() shape field-for-field
// (jdm_experience_backend_real's src/services/cancellationRequest.service.ts). Distinct from the
// existing PENDING+UNPAID self-cancel flow (see cancelBooking in bookingService.ts) -- this is
// the request/approval/refund workflow for an already-paid, confirmed booking.

export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'REFUND_PROCESSING' | 'REFUNDED' | 'REJECTED';

export interface CancellationRequest {
  id: number;
  bookingId: number;
  customerId: number;
  reason: string;
  refundMethodId: number | null;
  refundMethodName: string;
  refundDestination: string;
  refundAmount: number;
  status: CancellationRequestStatus;
  rejectionReason: string | null;
  refundProofUrl: string | null;
  refundProofFileName: string | null;
  refundProofFileType: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface CreateCancellationRequestInput {
  bookingId: number;
  reason: string;
  refundMethodId: number;
  refundDestination: string;
}

export interface RefundProofInput {
  fileUrl: string;
  fileName: string;
  fileType: string;
}
