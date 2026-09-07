import type { Tour } from './tour';

export interface WishlistItem {
  id: number;
  tourId: number;
  createdAt: string;
  tour: Tour;
}
