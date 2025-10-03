import { Entity } from './Entity';

/**
 * Types of actions that can be performed in the system
 */
export enum ActionType {
  ADD_PRODUCT = 'ADD_PRODUCT',
  CHECK_PRODUCT = 'CHECK_PRODUCT',
  NOTIFY_PRICE = 'NOTIFY_PRICE'
}

/**
 * Base interface for all actions
 */
export interface Action extends Entity {
  user_id?: string; // Optional, only for ADD_PRODUCT actions
  product_link?: string; // Optional, only for ADD_PRODUCT actions
  type: ActionType;
  created_at: string;
  is_processed: number; // 0 = false, 1 = true
}

/**
 * Action for adding a new product to monitor
 */
export interface AddProductAction extends Action {
  type: ActionType.ADD_PRODUCT;
  user_id: string;
  product_link: string;
}

/**
 * Action for checking a product's current price
 */
export interface CheckProductAction extends Action {
  type: ActionType.CHECK_PRODUCT;
  product_id: string;
}

/**
 * Action for notifying users about a price drop
 */
export interface NotifyPriceAction extends Action {
  type: ActionType.NOTIFY_PRICE;
  product_id: string;
  old_price: number;
  new_price: number;
}

/**
 * Union type of all possible actions
 */
export type ActionUnion = AddProductAction | CheckProductAction | NotifyPriceAction;

/**
 * Factory function to create an AddProductAction
 */
export function createAddProductAction(userId: string, productLink: string): AddProductAction {
  return {
    id: `add-${Date.now()}`,
    type: ActionType.ADD_PRODUCT,
    user_id: userId,
    product_link: productLink,
    created_at: new Date().toISOString(),
    is_processed: 0
  };
}

/**
 * Factory function to create a CheckProductAction
 */
export function createCheckProductAction(productId: string): CheckProductAction {
  return {
    id: `check-${Date.now()}`,
    type: ActionType.CHECK_PRODUCT,
    product_id: productId,
    created_at: new Date().toISOString(),
    is_processed: 0
  };
}

/**
 * Factory function to create a NotifyPriceAction
 */
export function createNotifyPriceAction(
  productId: string,
  oldPrice: number,
  newPrice: number
): NotifyPriceAction {
  return {
    id: `notify-${Date.now()}`,
    type: ActionType.NOTIFY_PRICE,
    product_id: productId,
    old_price: oldPrice,
    new_price: newPrice,
    created_at: new Date().toISOString(),
    is_processed: 0
  };
}