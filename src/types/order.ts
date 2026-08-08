export type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';

export type PaymentMethod = 'Cash on Delivery' | 'GCash' | 'Credit/Debit Card';

export interface OrderItem {
  productId: number;
  productName: string;
  productImage: string;
  date: string;
  time: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number | null;
  customerName: string;
  email: string;
  address: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  orderDate: string;
  status: OrderStatus;
  paymentProofName?: string | null;
  cardName?: string | null;
  /** Only the last 4 digits are ever retained, never the full PAN. */
  cardNumberLast4?: string | null;
  items: OrderItem[];
}

export interface CreateOrderInput {
  customerName: string;
  email: string;
  address: string;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  paymentProofFileName?: string | null;
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}
