import { Entity } from './Entity';

/**
 * Represents an Amazon product in the system
 */
export interface Product extends Entity {
  offerid: string;
  title: string;
  preco_cheio: number;
  preco: number;
  menor_preco: number;
  usuarios: string[];
  estoque: boolean;
  link: string;
  imagem: string;
  pre_venda: boolean;
}

/**
 * Factory function to create a new Product
 */
export function createProduct(params: Omit<Product, 'menor_preco' | 'usuarios'>): Product {
  return {
    ...params,
    menor_preco: params.preco,
    usuarios: []
  };
}

/**
 * Updates a product's price and returns whether a notification should be sent
 */
export function updateProductPrice(product: Product, newPrice: number): boolean {
  const shouldNotify = newPrice < product.preco;
  product.preco = newPrice;
  product.menor_preco = Math.min(product.menor_preco, newPrice);
  return shouldNotify;
}