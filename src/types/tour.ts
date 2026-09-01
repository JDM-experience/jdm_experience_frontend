/** Mirrors the Node.js backend's Tour shape (see jdm_experience_backend/src/validators/tour.validator.ts). */
export type TourStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

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
  capacity: number;
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
  status?: TourStatus;
  capacity?: number;
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
  capacity?: number;
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
