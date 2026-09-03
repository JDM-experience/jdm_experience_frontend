// Calls the real Node.js backend directly, same convention as adminUserService — tours are
// being migrated off services/mock/productService onto the live API.
import { httpClient } from './httpClient';
import { ApiError } from '@/types/api';
import type {
  CreateTourImageInput,
  CreateTourInput,
  SortOrder,
  Tour,
  TourContact,
  TourGuide,
  TourImage,
  TourSortBy,
  TourStatus,
  UpdateTourContactInput,
  UpdateTourInput,
} from '@/types/tour';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ListToursFilters {
  status?: TourStatus;
  /** Matches tours whose name or description contains this (case-insensitive) — performed by the
   *  database, not filtered client-side. */
  search?: string;
  sortBy?: TourSortBy;
  sortOrder?: SortOrder;
}

export async function listTours(filters: ListToursFilters = {}): Promise<Tour[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  const query = params.toString();
  const res = await httpClient.get<ApiEnvelope<Tour[]>>(`/tours${query ? `?${query}` : ''}`);
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

/** Staff (SUPER_ADMIN/ADMIN) or the tour's own guide only -- backend enforces ownership. Fields
 *  are null until ever set. */
export async function getTourContact(tourId: number): Promise<TourContact> {
  const res = await httpClient.get<ApiEnvelope<TourContact>>(`/tours/${tourId}/contact`);
  return res.data;
}

export async function updateTourContact(tourId: number, input: UpdateTourContactInput): Promise<TourContact> {
  const res = await httpClient.put<ApiEnvelope<TourContact>>(`/tours/${tourId}/contact`, input);
  return res.data;
}

/** Future dates (YYYY-MM-DD) that already have a CONFIRMED booking — not bookable by anyone else.
 *  A date not in this list is open, subject to the tour's own status and the JST same-day cutoff. */
export async function getBookedDates(tourId: number): Promise<string[]> {
  const res = await httpClient.get<ApiEnvelope<string[]>>(`/tours/${tourId}/booked-dates`);
  return res.data;
}
