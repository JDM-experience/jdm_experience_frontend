// Calls the real Node.js backend directly — see adminUserService.ts for why this bypasses
// the mock facade convention. This is a distinct service from productService.ts (the legacy
// mock-based Cart/Checkout flow) rather than a replacement of it -- see docs/ARCHITECTURE.md
// for why the two coexist for now.
import { httpClient } from './httpClient';
import type { CreateTourInput, Tour, TourAvailability, TourImage, TourStatus, UpdateTourInput } from '@/types/tour';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getTours(status?: TourStatus): Promise<Tour[]> {
  const query = status ? `?status=${status}` : '';
  const res = await httpClient.get<ApiEnvelope<Tour[]>>(`/tours${query}`);
  return res.data;
}

export async function getMyTours(): Promise<Tour[]> {
  const res = await httpClient.get<ApiEnvelope<Tour[]>>('/tours/my-tours');
  return res.data;
}

export async function getTourById(id: number): Promise<Tour> {
  const res = await httpClient.get<ApiEnvelope<Tour>>(`/tours/${id}`);
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

export async function addTourImage(tourId: number, imageUrl: string, sortOrder = 0): Promise<TourImage> {
  const res = await httpClient.post<ApiEnvelope<TourImage>>(`/tours/${tourId}/images`, { imageUrl, sortOrder });
  return res.data;
}

export async function removeTourImage(tourId: number, imageId: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/tours/${tourId}/images/${imageId}`);
}

export async function addTourAvailability(
  tourId: number,
  startDatetime: string,
  spotsRemaining: number,
): Promise<TourAvailability> {
  const res = await httpClient.post<ApiEnvelope<TourAvailability>>(`/tours/${tourId}/availability`, {
    startDatetime,
    spotsRemaining,
  });
  return res.data;
}

export async function updateTourAvailability(
  tourId: number,
  availabilityId: number,
  input: { startDatetime?: string; spotsRemaining?: number },
): Promise<TourAvailability> {
  const res = await httpClient.put<ApiEnvelope<TourAvailability>>(
    `/tours/${tourId}/availability/${availabilityId}`,
    input,
  );
  return res.data;
}

export async function removeTourAvailability(tourId: number, availabilityId: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/tours/${tourId}/availability/${availabilityId}`);
}
