/**
 * Mirrors the Node.js backend's Tour shape (see jdm_experience_backend/src/validators/tour.validator.ts).
 * Tour-level operational state only — NOT per-date bookability. A date's booked/free state is
 * derived entirely from Bookings (see tourService.getBookedDates) — there's no separate
 * availability/slot list on the tour itself. A new tour always starts PENDING and only reaches
 * AVAILABLE via POST /tours/:id/confirm; staff can then move it manually between
 * AVAILABLE/UNAVAILABLE/UNDER_MAINTENANCE.
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

export interface Tour {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  status: TourStatus;
  /** Cap on `participants` for a single booking — not a capacity pool shared across bookings; a
   *  tour-date is exclusive to one CONFIRMED booking regardless of how many seats it used. */
  seats: number;
  guide: TourGuide | null;
  images: TourImage[];
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
