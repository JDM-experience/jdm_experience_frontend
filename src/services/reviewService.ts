// Calls the real Node.js backend directly, same convention as bookingService/tourService.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { CreateReviewInput, Review, TourReviews, UpdateReviewInput } from '@/types/review';

/** Public -- includes the average rating and total count alongside the review list. */
export async function getTourReviews(tourId: number): Promise<TourReviews> {
  const res = await httpClient.get<ApiEnvelope<TourReviews>>(`/tours/${tourId}/reviews`);
  return res.data;
}

/** Backend re-verifies the caller has a COMPLETED booking for this tour -- this call is rejected
 *  with 403 otherwise, regardless of what the UI decided to show. */
export async function createReview(tourId: number, input: CreateReviewInput): Promise<Review> {
  const res = await httpClient.post<ApiEnvelope<Review>>(`/tours/${tourId}/reviews`, input);
  return res.data;
}

/** Owner or staff only -- enforced server-side. */
export async function updateReview(id: number, input: UpdateReviewInput): Promise<Review> {
  const res = await httpClient.put<ApiEnvelope<Review>>(`/reviews/${id}`, input);
  return res.data;
}

export async function deleteReview(id: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/reviews/${id}`);
}
