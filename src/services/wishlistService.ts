// Calls the real Node.js backend directly, same convention as reviewService/bookingService.
import { httpClient } from './httpClient';
import type { ApiEnvelope } from '@/types/api';
import type { WishlistItem } from '@/types/wishlist';

/** The caller's own wishlist, each item including its full Tour. */
export async function getMyWishlist(): Promise<WishlistItem[]> {
  const res = await httpClient.get<ApiEnvelope<WishlistItem[]>>('/wishlist');
  return res.data;
}

/** userId is always taken from the auth token server-side, never sent from here. */
export async function addToWishlist(tourId: number): Promise<WishlistItem> {
  const res = await httpClient.post<ApiEnvelope<WishlistItem>>('/wishlist', { tourId });
  return res.data;
}

export async function removeFromWishlist(tourId: number): Promise<void> {
  await httpClient.delete<ApiEnvelope<null>>(`/wishlist/${tourId}`);
}
