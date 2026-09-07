import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { addToWishlist, getMyWishlist, removeFromWishlist } from '@/services/wishlistService';
import { getErrorMessage } from '@/utils/errors';
import type { WishlistItem } from '@/types/wishlist';

interface WishlistContextValue {
  items: WishlistItem[];
  wishlistedTourIds: Set<number>;
  /** True while this specific tour's add/remove call is in flight -- lets a card disable/spin its
   *  own heart button without affecting any other card. */
  isPending: (tourId: number) => boolean;
  /** Unauthenticated callers should redirect to login instead of calling this (see TourCard) --
   *  this function assumes the caller is already authenticated. */
  toggle: (tourId: number) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/**
 * A context (not a per-card fetch) because the same tour can appear on Home, Tours, and Tour
 * Details simultaneously -- toggling the heart on one card must be reflected everywhere at once,
 * and every card independently calling GET /wishlist would be wasteful. Fetches once when the
 * customer authenticates, clears on logout. Mounted inside AuthProvider (needs useAuth) -- see
 * App.tsx.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [pendingTourIds, setPendingTourIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    getMyWishlist()
      .then(setItems)
      .catch(() => undefined); // Non-fatal -- worst case the heart icons don't show saved state yet.
  }, [isAuthenticated, isInitializing]);

  const wishlistedTourIds = useMemo(() => new Set(items.map((item) => item.tourId)), [items]);

  const isPending = useCallback((tourId: number) => pendingTourIds.has(tourId), [pendingTourIds]);

  const toggle = useCallback(
    async (tourId: number) => {
      setPendingTourIds((prev) => new Set(prev).add(tourId));
      try {
        if (wishlistedTourIds.has(tourId)) {
          await removeFromWishlist(tourId);
          setItems((prev) => prev.filter((item) => item.tourId !== tourId));
        } else {
          const created = await addToWishlist(tourId);
          setItems((prev) => [created, ...prev]);
        }
      } catch (error) {
        message.error(getErrorMessage(error, 'Unable to update your wishlist. Please try again.'));
      } finally {
        setPendingTourIds((prev) => {
          const next = new Set(prev);
          next.delete(tourId);
          return next;
        });
      }
    },
    [wishlistedTourIds],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ items, wishlistedTourIds, isPending, toggle }),
    [items, wishlistedTourIds, isPending, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider.');
  return context;
}
