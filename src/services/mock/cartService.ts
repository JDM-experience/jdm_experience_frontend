import { getDb } from './db';
import { delay, isProductBookedOnDate } from './helpers';
import { ApiError } from '@/types/api';
import type { AddToCartInput, CartSummary, UpdateCartItemInput } from '@/types/cart';
import { effectivePrice, getAvailabilityForDate, isValidDateString, isValidTimeString } from '@/utils/bookingUtils';

/**
 * Raw reservation lines, equivalent to PHP's `$_SESSION['cart']`. Kept in
 * sessionStorage (not the shared mock "database") because a cart is
 * per-browser-session state, not persisted business data.
 */
interface RawCartLine {
  productId: number;
  date: string;
  time: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'jdm_mock_cart_v1';

function loadRawCart(): RawCartLine[] {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RawCartLine[]) : [];
  } catch {
    return [];
  }
}

function saveRawCart(lines: RawCartLine[]): void {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // sessionStorage may be unavailable — cart simply won't persist across reloads.
  }
}

function assertValidBookingDetails(date: string, time: string, quantity: number): void {
  if (!isValidDateString(date) || !isValidTimeString(time) || quantity < 1) {
    throw new ApiError('Invalid booking details.', 400);
  }
}

/** Ported from cart_helpers.php::normalize_cart_items(). */
export async function getCart(): Promise<CartSummary> {
  await delay(200);
  const db = getDb();
  const lines = loadRawCart();

  const items = lines
    .map((line, index) => {
      const product = db.products.find((p) => p.id === line.productId);
      if (!product) return null;
      const price = effectivePrice(product.price, product.discount);
      const subtotal = price * line.quantity;
      return {
        index,
        productId: product.id,
        name: product.name,
        image: product.image1,
        date: line.date,
        time: line.time,
        quantity: line.quantity,
        basePrice: product.price,
        discount: product.discount,
        price,
        subtotal,
        stock: product.stock,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, total };
}

export async function getCartCount(): Promise<number> {
  return loadRawCart().length;
}

export async function addToCart(input: AddToCartInput): Promise<void> {
  await delay();
  assertValidBookingDetails(input.date, input.time, input.quantity);

  const db = getDb();
  const product = db.products.find((p) => p.id === input.productId);
  if (!product) throw new ApiError('Tour not found.', 404);

  const availability = getAvailabilityForDate(
    product.stock,
    input.date,
    isProductBookedOnDate(product.id, input.date),
  );
  if (!availability.bookable) {
    throw new ApiError(availability.message, 409);
  }

  const lines = loadRawCart();
  const duplicate = lines.some(
    (line) => line.productId === input.productId && line.date === input.date && line.time === input.time,
  );
  if (duplicate) {
    throw new ApiError('This tour is already in your booking list for the selected date and time.', 409);
  }

  lines.push({ productId: input.productId, date: input.date, time: input.time, quantity: input.quantity });
  saveRawCart(lines);
}

export async function updateCartItem(input: UpdateCartItemInput): Promise<void> {
  await delay();
  assertValidBookingDetails(input.date, input.time, input.quantity);

  const lines = loadRawCart();
  const existing = lines[input.index];
  if (!existing) throw new ApiError('Invalid booking details.', 400);

  const db = getDb();
  const product = db.products.find((p) => p.id === existing.productId);
  if (!product) throw new ApiError('Tour not found.', 404);

  const availability = getAvailabilityForDate(
    product.stock,
    input.date,
    isProductBookedOnDate(product.id, input.date),
  );
  if (!availability.bookable) {
    throw new ApiError(availability.message, 409);
  }

  const duplicate = lines.some(
    (line, idx) =>
      idx !== input.index &&
      line.productId === existing.productId &&
      line.date === input.date &&
      line.time === input.time,
  );
  if (duplicate) {
    throw new ApiError('This tour is already in your reservations for that date and time.', 409);
  }

  lines[input.index] = { ...existing, date: input.date, time: input.time, quantity: input.quantity };
  saveRawCart(lines);
}

export async function removeCartItem(index: number): Promise<void> {
  await delay(200);
  const lines = loadRawCart();
  lines.splice(index, 1);
  saveRawCart(lines);
}

export async function clearCart(): Promise<void> {
  saveRawCart([]);
}
