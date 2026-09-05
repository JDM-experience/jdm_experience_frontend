import type { TourStatus } from '@/types/tour';

export interface TourFormValues {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  seats: number;
  guideId?: number;
  /** Edit form only (staff-only field) — a new tour always starts PENDING server-side. */
  status?: TourStatus;
}
