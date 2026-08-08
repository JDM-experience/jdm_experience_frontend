import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as cartService from '@/services/cartService';
import type { AddToCartInput, CartItem, UpdateCartItemInput } from '@/types/cart';

interface CartContextValue {
  items: CartItem[];
  total: number;
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (input: AddToCartInput) => Promise<void>;
  updateItem: (input: UpdateCartItemInput) => Promise<void>;
  removeItem: (index: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await cartService.getCart();
      setItems(summary.items);
      setTotal(summary.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (input: AddToCartInput) => {
      await cartService.addToCart(input);
      await refresh();
    },
    [refresh],
  );

  const updateItem = useCallback(
    async (input: UpdateCartItemInput) => {
      await cartService.updateCartItem(input);
      await refresh();
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (index: number) => {
      await cartService.removeCartItem(index);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, total, count: items.length, loading, refresh, addItem, updateItem, removeItem }),
    [items, total, loading, refresh, addItem, updateItem, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider.');
  return context;
}
