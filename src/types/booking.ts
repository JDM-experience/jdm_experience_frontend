// Mirrors the real backend's toPublicBooking() shape (jdm_experience_backend_real's
// src/services/booking.service.ts) field-for-field. Distinct from the legacy `Order` type
// (src/types/order.ts), which the mock-based Cart/Checkout flow still uses.

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type BookingPaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Booking {
  id: number;
  userId: number;
  tourId: number;
  availabilityId: number | null;
  bookingDate: string;
  participants: number;
  status: BookingStatus;
  totalPrice: number;
  depositPaid: number | null;
  paymentStatus: BookingPaymentStatus;
  tourNameSnapshot: string;
  unitPriceSnapshot: number;
  currency: string;
  specialRequests: string | null;
  createdAt: string;
}

export interface CreateBookingInput {
  tourId: number;
  bookingDate: string;
  participants: number;
  specialRequests?: string;
}
