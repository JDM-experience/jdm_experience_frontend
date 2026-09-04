import { ALLOWED_IMAGE_TYPES } from '@/services/uploadService';
import type { TourStatus } from '@/types/tour';

/** Manual transitions only — a tour reaches AVAILABLE for the first time solely via "Confirm"
 *  (PENDING is not selectable here, it's the automatic starting state). */
export const MANUAL_STATUS_OPTIONS: { value: TourStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
];

export const STATUS_LABEL: Record<TourStatus, string> = {
  PENDING: 'Pending',
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable',
  UNDER_MAINTENANCE: 'Under Maintenance',
};

export const STATUS_COLOR: Record<TourStatus, string> = {
  PENDING: 'gold',
  AVAILABLE: 'green',
  UNAVAILABLE: 'red',
  UNDER_MAINTENANCE: 'orange',
};

export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');
