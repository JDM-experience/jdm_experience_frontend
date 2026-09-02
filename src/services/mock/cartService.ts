import { delay } from './helpers';
import { ApiError } from '@/types/api';
import type { AddToCartInput, CartSummary, UpdateCartItemInput } from '@/types/cart';
import { isValidDateString, isValidTimeString } from '@/utils/bookingUtils';
// The cart itself is still a sessionStorage mock, but every line now points at a real Tour
// (from the live GET /tours API) rather than the legacy mock `products` table — so lines are
// re-validated against the real backend instead of the mock db.
import { getTourById } from '@/services/tourService';

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
  const lines = loadRawCart();

  const resolved = await Promise.all(
    lines.map(async (line, index) => {
      const tour = await getTourById(line.productId);
      if (!tour) return null;
      // Tour price is flat per booking, not per seat — quantity does not multiply the price.
      const subtotal = tour.price;
      const seatCapacity: 1 | 4 = tour.seats >= 4 ? 4 : 1;
      return {
        index,
        productId: tour.id,
        name: tour.name,
        image: tour.images[0]?.imageUrl ?? '',
        date: line.date,
        time: line.time,
        quantity: line.quantity,
        basePrice: tour.price,
        discount: 0,
        price: tour.price,
        subtotal,
        stock: 1,
        seatCapacity,
      };
    }),
  );
  const items = resolved.filter((item): item is NonNullable<typeof item> => item !== null);

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, total };
}

export async function getCartCount(): Promise<number> {
  return loadRawCart().length;
}

export async function addToCart(input: AddToCartInput): Promise<void> {
  await delay();
  assertValidBookingDetails(input.date, input.time, input.quantity);

  const tour = await getTourById(input.productId);
  if (!tour) throw new ApiError('Tour not found.', 404);
  if (tour.status !== 'AVAILABLE') throw new ApiError('This tour is not currently available for booking.', 409);

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

  const tour = await getTourById(existing.productId);
  if (!tour) throw new ApiError('Tour not found.', 404);
  if (tour.status !== 'AVAILABLE') throw new ApiError('This tour is not currently available for booking.', 409);

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
