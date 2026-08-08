/**
 * A normalized reservation line, equivalent to what
 * cart_helpers.php::normalize_cart_items() produces from the PHP session cart.
 */
export interface CartItem {
  index: number;
  productId: number;
  name: string;
  image: string;
  date: string;
  time: string;
  quantity: number;
  basePrice: number;
  discount: number;
  /** Price after discount is applied */
  price: number;
  subtotal: number;
  stock: number;
}

export interface AddToCartInput {
  productId: number;
  productName: string;
  price: number;
  productImage: string;
  date: string;
  time: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  index: number;
  date: string;
  time: string;
  quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  total: number;
}
