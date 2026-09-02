// Calls the real Node.js backend directly, same convention as adminUserService — tours are
// being migrated off services/mock/productService onto the live API.
import { httpClient } from './httpClient';
import { ApiError } from '@/types/api';
import type { CreateTourImageInput, CreateTourInput, Tour, TourGuide, TourImage, TourStatus, UpdateTourInput } from '@/types/tour';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function listTours(filters: { status?: TourStatus } = {}): Promise<Tour[]> {
  const query = filters.status ? `?status=${filters.status}` : '';
  const res = await httpClient.get<ApiEnvelope<Tour[]>>(`/tours${query}`);
  return res.data;
}

export async function getTourById(id: number): Promise<Tour | null> {
  try {
    const res = await httpClient.get<ApiEnvelope<Tour>>(`/tours/${id}`);
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** For the Tour Guide assignment selector on the admin Create/Edit Tour forms (staff-only). */
export async function listTourGuides(): Promise<TourGuide[]> {
  const res = await httpClient.get<ApiEnvelope<TourGuide[]>>('/tours/guides');
  return res.data;
}

export async function createTour(input: CreateTourInput): Promise<Tour> {
  const res = await httpClient.post<ApiEnvelope<Tour>>('/tours', input);
  return res.data;
}

export async function updateTour(id: number, input: UpdateTourInput): Promise<Tour> {
  const res = await httpClient.put<ApiEnvelope<Tour>>(`/tours/${id}`, input);
  return res.data;
}

export async function deleteTour(id: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/tours/${id}`);
}

/** Staff-only: moves a PENDING tour to AVAILABLE. */
export async function confirmTour(id: number): Promise<Tour> {
  const res = await httpClient.post<ApiEnvelope<Tour>>(`/tours/${id}/confirm`, undefined);
  return res.data;
}

export async function addTourImage(tourId: number, input: CreateTourImageInput): Promise<TourImage> {
  const res = await httpClient.post<ApiEnvelope<TourImage>>(`/tours/${tourId}/images`, input);
  return res.data;
}

export async function removeTourImage(tourId: number, imageId: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/tours/${tourId}/images/${imageId}`);
}

/** Future dates (YYYY-MM-DD) that already have a CONFIRMED booking — not bookable by anyone else.
 *  A date not in this list is open, subject to the tour's own status and the JST same-day cutoff. */
export async function getBookedDates(tourId: number): Promise<string[]> {
  const res = await httpClient.get<ApiEnvelope<string[]>>(`/tours/${tourId}/booked-dates`);
  return res.data;
}
