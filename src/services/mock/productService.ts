import { getDb, saveDb } from './db';
import { delay, isProductBookedOnDate } from './helpers';
import { ApiError } from '@/types/api';
import type { CreateProductInput, Product, ProductFilters, UpdateProductInput } from '@/types/product';
import type { AvailabilityResult } from '@/types/availability';
import { getAvailabilityForDate } from '@/utils/bookingUtils';

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  await delay();
  let results = [...getDb().products];

  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(
      (p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term),
    );
  }

  if (filters.category) {
    results = results.filter((p) => p.category === filters.category);
  }

  switch (filters.sort) {
    case 'za':
      results.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'low':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'high':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'az':
    default:
      results.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return results;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  await delay();
  return [...getDb().products].sort((a, b) => b.id - a.id);
}

export async function getProductById(id: number): Promise<Product | null> {
  await delay();
  return getDb().products.find((p) => p.id === id) ?? null;
}

export async function getCategories(): Promise<string[]> {
  await delay(150);
  const categories = new Set(getDb().products.map((p) => p.category).filter(Boolean));
  return [...categories].sort((a, b) => a.localeCompare(b));
}

export interface SearchSuggestion {
  id: number;
  name: string;
  price: number;
  image: string;
}

export async function searchSuggestions(term: string): Promise<SearchSuggestion[]> {
  await delay(200);
  const trimmed = term.trim().toLowerCase();
  if (!trimmed) return [];
  return getDb()
    .products.filter((p) => p.name.toLowerCase().includes(trimmed))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 20)
    .map((p) => ({ id: p.id, name: p.name, price: p.price, image: p.image1 }));
}

export async function checkAvailability(productId: number, date: string): Promise<AvailabilityResult> {
  await delay(250);
  const product = getDb().products.find((p) => p.id === productId);
  if (!product) {
    return { status: 'Unavailable', bookable: false, message: 'Tour not found.' };
  }
  return getAvailabilityForDate(product.stock, date, isProductBookedOnDate(productId, date));
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  await delay();
  const db = getDb();
  const product: Product = { ...input, id: db.nextIds.product };
  db.products.unshift(product);
  db.nextIds.product += 1;
  saveDb();
  return product;
}

export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  await delay();
  const db = getDb();
  const index = db.products.findIndex((p) => p.id === input.id);
  if (index === -1) throw new ApiError('Tour not found.', 404);
  db.products[index] = { ...db.products[index], ...input };
  saveDb();
  return db.products[index];
}

export async function deleteProduct(id: number): Promise<void> {
  await delay();
  const db = getDb();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) throw new ApiError('Tour not found.', 404);
  db.products.splice(index, 1);
  saveDb();
}
