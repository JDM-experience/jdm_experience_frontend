// Calls the real Node.js backend directly, same convention as adminUserService — tours are
// being migrated off services/mock/productService onto the live API.
import { httpClient } from './httpClient';
import { ApiError } from '@/types/api';
import type {
  CreateTourAvailabilityInput,
  CreateTourImageInput,
  CreateTourInput,
  Tour,
  TourAvailability,
  TourGuide,
  TourImage,
  TourStatus,
  UpdateTourInput,
} from '@/types/tour';

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

export async function archiveTour(id: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/tours/${id}`);
}

export async function addTourImage(tourId: number, input: CreateTourImageInput): Promise<TourImage> {
  const res = await httpClient.post<ApiEnvelope<TourImage>>(`/tours/${tourId}/images`, input);
  return res.data;
}

export async function removeTourImage(tourId: number, imageId: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/tours/${tourId}/images/${imageId}`);
}

export async function addTourAvailability(tourId: number, input: CreateTourAvailabilityInput): Promise<TourAvailability> {
  const res = await httpClient.post<ApiEnvelope<TourAvailability>>(`/tours/${tourId}/availability`, input);
  return res.data;
}

export async function removeTourAvailability(tourId: number, availabilityId: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/tours/${tourId}/availability/${availabilityId}`);
}
