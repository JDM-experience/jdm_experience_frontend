/**
 * Mirrors the Node.js backend's Tour shape (see jdm_experience_backend/src/validators/tour.validator.ts).
 * Tour-level operational state only — NOT per-date bookability, which is TourAvailability below.
 * A new tour always starts PENDING and only reaches AVAILABLE via POST /tours/:id/confirm; staff
 * can then move it manually between AVAILABLE/UNAVAILABLE/UNDER_MAINTENANCE.
 */
export type TourStatus = 'PENDING' | 'AVAILABLE' | 'UNAVAILABLE' | 'UNDER_MAINTENANCE';

export interface TourGuide {
  id: number;
  userId: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
}

export interface TourImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface TourAvailability {
  id: number;
  startDatetime: string;
  spotsRemaining: number;
}

export interface Tour {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  status: TourStatus;
  seats: number;
  guide: TourGuide | null;
  images: TourImage[];
  availability: TourAvailability[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTourInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency?: string;
  // No status here — every new tour starts PENDING server-side; use confirmTour()/updateTour()
  // afterward to move it to AVAILABLE (or another status).
  seats?: number;
  guideId?: number | null;
  /** Images already uploaded via uploadService — attaches them in the same create request. Max 20. */
  images?: CreateTourImageInput[];
}

export interface UpdateTourInput {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  currency?: string;
  status?: TourStatus;
  seats?: number;
  guideId?: number | null;
}

export interface CreateTourImageInput {
  imageUrl: string;
  sortOrder?: number;
}

export interface CreateTourAvailabilityInput {
  /** ISO 8601 datetime with an explicit UTC offset, e.g. `2026-09-01T09:00:00+09:00`. */
  startDatetime: string;
  spotsRemaining: number;
}
