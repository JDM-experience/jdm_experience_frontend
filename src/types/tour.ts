// Mirrors the real backend's toPublicTour() shape (jdm_experience_backend_real's
// src/services/tour.service.ts) field-for-field. Distinct from the legacy `Product` type
// (src/types/product.ts), which the mock-based Cart/Checkout flow still uses.

export type TourStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface TourGuideInfo {
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
  guide: TourGuideInfo | null;
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
}

export type UpdateTourInput = Partial<CreateTourInput>;
