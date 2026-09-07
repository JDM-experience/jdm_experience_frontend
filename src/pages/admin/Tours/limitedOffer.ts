import dayjs from 'dayjs';
import { isoToJstDateTime, jstDateTimeToIso } from '@/utils/bookingUtils';
import type { LimitedOffer, Tour } from '@/types/tour';
import type { TourFormValues } from './types';

export type LimitedOfferStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED' | 'NONE';

/** Admin Tour list's "Offer" column status (see the Limited-Time Offer spec's section on it) --
 *  derived the same way the backend derives `isActive`, just with two extra display-only buckets
 *  (Scheduled/Expired) that split apart what the backend collapses into a single `isActive: false`. */
export function getLimitedOfferStatus(offer: LimitedOffer): LimitedOfferStatus {
  if (offer.isActive) return 'ACTIVE';
  if (!offer.enabled) return offer.discount !== null ? 'DISABLED' : 'NONE';
  if (offer.startAt && Date.now() < new Date(offer.startAt).getTime()) return 'SCHEDULED';
  if (offer.endAt && Date.now() >= new Date(offer.endAt).getTime()) return 'EXPIRED';
  return 'NONE';
}

/** Pre-fills the Create/Edit Tour form's Limited-Time Offer fields from a Tour's current
 *  server state -- start/end are converted from the stored UTC instant back to JST date+time
 *  wall-clock values, matching what the admin originally typed. */
export function limitedOfferFormValues(tour: Tour): Partial<TourFormValues> {
  const offer = tour.limitedOffer;
  const base = { limitedOfferEnabled: offer.enabled, limitedOfferDiscount: offer.discount ?? undefined };
  if (!offer.startAt || !offer.endAt) return base;
  const start = isoToJstDateTime(offer.startAt);
  const end = isoToJstDateTime(offer.endAt);
  return {
    ...base,
    limitedOfferStartDate: dayjs(start.date, 'YYYY-MM-DD'),
    limitedOfferStartTime: dayjs(start.time, 'HH:mm'),
    limitedOfferEndDate: dayjs(end.date, 'YYYY-MM-DD'),
    limitedOfferEndTime: dayjs(end.time, 'HH:mm'),
  };
}

interface LimitedOfferApiInput {
  limitedOfferEnabled: boolean;
  limitedOfferDiscount?: number;
  limitedOfferStart?: string;
  limitedOfferEnd?: string;
}

/** Converts the form's raw fields into the API payload shape, combining the separate date/time
 *  pickers into single JST ISO instants (see bookingUtils' jstDateTimeToIso). Returns `{ error }`
 *  instead of throwing so the caller can show it inline via antd's `message` the same way every
 *  other form validation failure in these modals is surfaced -- the backend re-validates all of
 *  this regardless, this is purely a faster round-trip for the admin. */
export function buildLimitedOfferInput(values: TourFormValues): LimitedOfferApiInput | { error: string } {
  if (!values.limitedOfferEnabled) {
    return { limitedOfferEnabled: false };
  }
  if (
    values.limitedOfferDiscount === undefined ||
    !values.limitedOfferStartDate ||
    !values.limitedOfferStartTime ||
    !values.limitedOfferEndDate ||
    !values.limitedOfferEndTime
  ) {
    return { error: 'Fill in the discount and start/end date & time to enable a Limited-Time Offer.' };
  }
  if (values.limitedOfferDiscount <= 0 || values.limitedOfferDiscount > 100) {
    return { error: 'Discount must be greater than 0% and no more than 100%.' };
  }
  const start = jstDateTimeToIso(values.limitedOfferStartDate.format('YYYY-MM-DD'), values.limitedOfferStartTime.format('HH:mm'));
  const end = jstDateTimeToIso(values.limitedOfferEndDate.format('YYYY-MM-DD'), values.limitedOfferEndTime.format('HH:mm'));
  if (new Date(start).getTime() >= new Date(end).getTime()) {
    return { error: 'The offer start must be before its end.' };
  }
  return { limitedOfferEnabled: true, limitedOfferDiscount: values.limitedOfferDiscount, limitedOfferStart: start, limitedOfferEnd: end };
}
