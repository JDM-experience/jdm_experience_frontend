import { getDb, saveDb } from './db';
import { delay } from './helpers';
import { getCart, clearCart } from './cartService';
import { ApiError } from '@/types/api';
import type { CreateOrderInput, Order, OrderStatus } from '@/types/order';
import { PROMO_CODE, PROMO_DISCOUNT_RATE } from '@/constants';
// Cart lines now point at real Tours (see cartService.ts) — re-validate against the live
// backend instead of the mock db.
import { getTourById } from '@/services/tourService';

/** Ported from checkout.php's POST handler: re-validate every cart line before booking it. */
export async function createOrder(userId: number | null, input: CreateOrderInput): Promise<Order> {
  await delay(600);
  const db = getDb();
  const cart = await getCart();

  if (cart.items.length === 0) {
    throw new ApiError('Your reservation list is empty.', 400);
  }

  for (const item of cart.items) {
    const tour = await getTourById(item.productId);
    if (!tour) {
      throw new ApiError('One of the selected tours was not found.', 404);
    }
    if (tour.status !== 'ACTIVE') {
      throw new ApiError(`${tour.name} is not currently available for booking.`, 409);
    }
  }

  if (input.paymentMethod === 'GCash' && !input.paymentProofFileName) {
    throw new ApiError('Please upload your GCash payment proof before confirming the reservation.', 400);
  }
  if (
    input.paymentMethod === 'Credit/Debit Card' &&
    (!input.cardName || !input.cardNumber || !input.cardExpiry || !input.cardCvv)
  ) {
    throw new ApiError('Please add your card details before confirming the reservation.', 400);
  }

  let total = cart.total;
  if (input.promoCode && input.promoCode.trim().toUpperCase() === PROMO_CODE) {
    total -= total * PROMO_DISCOUNT_RATE;
  }

  const order: Order = {
    id: db.nextIds.order,
    userId,
    customerName: input.customerName,
    email: input.email,
    address: input.address,
    paymentMethod: input.paymentMethod,
    totalAmount: total,
    orderDate: new Date().toISOString(),
    status: 'Pending',
    paymentProofName: input.paymentMethod === 'GCash' ? input.paymentProofFileName : null,
    cardName: input.paymentMethod === 'Credit/Debit Card' ? (input.cardName ?? null) : null,
    cardNumberLast4:
      input.paymentMethod === 'Credit/Debit Card' && input.cardNumber
        ? input.cardNumber.replace(/\D/g, '').slice(-4)
        : null,
    items: cart.items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      productImage: item.image,
      date: item.date,
      time: item.time,
      quantity: item.quantity,
      price: item.price,
      guideId: db.products.find((p) => p.id === item.productId)?.guideId ?? null,
    })),
  };

  db.orders.unshift(order);
  db.nextIds.order += 1;
  saveDb();
  await clearCart();

  return order;
}

export async function getOrdersByUser(userId: number): Promise<Order[]> {
  await delay();
  return getDb()
    .orders.filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
}

export async function getOrderById(id: number): Promise<Order | null> {
  await delay();
  return getDb().orders.find((o) => o.id === id) ?? null;
}

export async function getAllOrders(): Promise<Order[]> {
  await delay();
  return [...getDb().orders].sort(
    (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
  );
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  await delay();
  const db = getDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) throw new ApiError('Reservation not found.', 404);
  order.status = status;
  saveDb();
  return order;
}

export async function deleteOrder(id: number): Promise<void> {
  await delay();
  const db = getDb();
  const index = db.orders.findIndex((o) => o.id === id);
  if (index === -1) throw new ApiError('Reservation not found.', 404);
  db.orders.splice(index, 1);
  saveDb();
}
