/**
 * Mirrors the Node.js backend's Tour shape (see jdm_experience_backend/src/validators/tour.validator.ts).
 * Tour-level operational state only — NOT per-date bookability. A date's booked/free state is
 * derived entirely from Bookings (see tourService.getBookedDates) — there's no separate
 * availability/slot list on the tour itself. A new tour always starts PENDING and only reaches
 * AVAILABLE via POST /tours/:id/confirm; staff can then move it manually between
 * AVAILABLE/UNAVAILABLE/UNDER_MAINTENANCE.
 */
export type TourStatus = 'PENDING' | 'AVAILABLE' | 'UNAVAILABLE' | 'UNDER_MAINTENANCE';

/** Mirrors the backend's GET /tours whitelist (tourListQuerySchema) — the only fields the API
 *  will actually sort by. */
export type TourSortBy = 'name' | 'price' | 'seats' | 'createdAt' | 'status';
export type SortOrder = 'asc' | 'desc';

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
  /** Focal point as a percentage (0-100) of image width/height — feed directly into CSS
   *  `object-position: {focalX}% {focalY}%` wherever this image renders with `object-fit: cover`. */
  focalX: number;
  focalY: number;
}

/** Server-authoritative Limited-Time Offer state — `isActive` is re-derived by the backend on
 *  every response from `enabled`/`startAt`/`endAt` against the current instant; never computed
 *  or cached client-side to decide whether a discounted price may still be booked. The discounted
 *  price itself is never sent as a field — compute it from `Tour.price` + `discount` (see
 *  utils/bookingUtils.ts's `effectivePrice`), same as the existing PriceDisplay component does. */
export interface LimitedOffer {
  enabled: boolean;
  discount: number | null;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
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
  limitedOffer: LimitedOffer;
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
  limitedOfferEnabled?: boolean;
  /** Percentage, > 0 and <= 100. Required by the backend when `limitedOfferEnabled` is true. */
  limitedOfferDiscount?: number;
  /** ISO datetime string (with explicit UTC/JST offset — never a bare local time). */
  limitedOfferStart?: string;
  limitedOfferEnd?: string;
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
  limitedOfferEnabled?: boolean;
  limitedOfferDiscount?: number;
  limitedOfferStart?: string;
  limitedOfferEnd?: string;
}

export interface CreateTourImageInput {
  imageUrl: string;
  sortOrder?: number;
  focalX?: number;
  focalY?: number;
}

export interface UpdateTourImageInput {
  focalX?: number;
  focalY?: number;
}

/** Customer-facing contact info shown once a booking on this tour is CONFIRMED (in the
 *  confirmation email) — deliberately separate from the guide's own account email/phone.
 *  Fields are null until ever set. Editable by the tour's own owner or staff. */
export interface TourContact {
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

export interface UpdateTourContactInput {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
