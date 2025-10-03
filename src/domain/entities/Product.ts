import { Entity } from './Entity';

/**
 * Represents an Amazon product in the system
 */
export interface Product extends Entity {
  offer_id: string;
  title: string;
  full_price: number;
  price: number;
  old_price?: number;
  lowest_price: number;
  users: string[];
  in_stock: boolean;
  url: string;
  image: string;
  preorder: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Factory function to create a new Product
 */
export function createProduct(params: Omit<Product, 'lowest_price' | 'users' | 'created_at' | 'updated_at'>): Product {
  const now = new Date().toISOString();
  return {
    ...params,
    lowest_price: params.price,
    users: [],
    created_at: now,
    updated_at: now
  };
}

/**
 * Updates a product's price and returns whether a notification should be sent
 */
export function updateProductPrice(product: Product, newPrice: number): boolean {
  const shouldNotify = newPrice < product.price;
  
  // Store old price before updating
  product.old_price = product.price;
  product.price = newPrice;
  product.lowest_price = Math.min(product.lowest_price, newPrice);
  product.updated_at = new Date().toISOString();
  
  return shouldNotify;
}