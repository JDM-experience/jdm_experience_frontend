import type { Dayjs } from 'dayjs';
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
  /** Limited-Time Offer -- staff-only. Date/time kept as separate fields (matching the spec's
   *  admin UI) and combined into a single JST ISO instant on submit (see bookingUtils'
   *  jstDateTimeToIso) -- never a bare local-timezone value. */
  limitedOfferEnabled?: boolean;
  limitedOfferDiscount?: number;
  limitedOfferStartDate?: Dayjs;
  limitedOfferStartTime?: Dayjs;
  limitedOfferEndDate?: Dayjs;
  limitedOfferEndTime?: Dayjs;
}
