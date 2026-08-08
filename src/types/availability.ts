import type { AvailabilityStatus } from './product';

export interface AvailabilityResult {
  status: AvailabilityStatus;
  bookable: boolean;
  message: string;
}
