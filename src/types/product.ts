export type AvailabilityStatus = 'Available' | 'Unavailable' | 'Under Maintenance';

/**
 * The PHP backend stores tours in a `products` table left over from the
 * site's previous life as a clothing shop. `stock` is repurposed as a
 * 3-state manual availability flag (0 = Under Maintenance, 1 = Available,
 * 2 = Unavailable) rather than an inventory count.
 */
export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  image1: string;
  image2: string;
  image3: string;
  /** Optional tour location, used for the weather-forecast integration. */
  latitude?: number;
  longitude?: number;
  /** Admin-set seat capacity. Caps how many seats a customer can select; price is per-tour, not per-seat. */
  seatCapacity: 1 | 4;
  /** The Tour Guide who owns this tour (their real backend user id), or `null` if unassigned
   *  (staff-managed). A guide can only edit/delete tours where this matches their own id. */
  guideId: number | null;
}

export type CreateProductInput = Omit<Product, 'id'>;

export type UpdateProductInput = Partial<Omit<Product, 'id'>> & { id: number };

export type ProductSort = 'az' | 'za' | 'low' | 'high';

export interface ProductFilters {
  search?: string;
  category?: string;
  sort?: ProductSort;
}
