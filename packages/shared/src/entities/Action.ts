import { Entity } from './Entity';
import { ActionOrigin } from '../constants';

/**
 * Types of actions that can be performed in the system
 */
export enum ActionType {
	ADD_PRODUCT = 'ADD_PRODUCT',
	CHECK_PRODUCT = 'CHECK_PRODUCT',
	NOTIFY_PRICE = 'NOTIFY_PRICE',
}

/**
 * Base interface for all actions
 */
export interface Action extends Entity {
	user_id?: string; // Optional, only for ADD_PRODUCT actions
	value: string; // Generic value: URL for ADD_PRODUCT, Product ID for others
	type: ActionType;
	origin?: ActionOrigin; // Origin of the action (TELEGRAM, SITE) - optional for backward compatibility
	created_at: string;
	is_processed: number; // 0 = false, 1 = true
}

/**
 * Action for adding a new product to monitor
 */
export interface AddProductAction extends Action {
	type: ActionType.ADD_PRODUCT;
	user_id: string;
	value: string; // Product URL
	origin?: ActionOrigin; // Origin of the action (TELEGRAM, SITE)
}

/**
 * Action for checking a product's current price
 */
export interface CheckProductAction extends Action {
	type: ActionType.CHECK_PRODUCT;
	value: string; // Product ID
	origin?: ActionOrigin; // Origin of the action (TELEGRAM, SITE)
}

/**
 * Action for notifying users about a price drop
 */
export interface NotifyPriceAction extends Action {
	type: ActionType.NOTIFY_PRICE;
	value: string; // Product ID - prices will be fetched from Products table
	origin?: ActionOrigin; // Origin of the action (TELEGRAM, SITE)
}

/**
 * Union type of all possible actions
 */
export type ActionUnion = AddProductAction | CheckProductAction | NotifyPriceAction;

/**
 * Factory function to create an AddProductAction
 * @param userId User ID
 * @param productLink Product URL
 * @param origin Origin of the action (defaults to TELEGRAM for backward compatibility)
 */
export function createAddProductAction(
	userId: string,
	productLink: string,
	origin?: ActionOrigin
): AddProductAction {
	return {
		id: `add-${Date.now()}`,
		type: ActionType.ADD_PRODUCT,
		user_id: userId,
		value: productLink,
		origin,
		created_at: new Date().toISOString(),
		is_processed: 0
	};
}

/**
 * Factory function to create a CheckProductAction
 * @param productId Product ID
 * @param origin Origin of the action (defaults to undefined)
 */
export function createCheckProductAction(
	productId: string,
	origin?: ActionOrigin
): CheckProductAction {
	return {
		id: `check-${Date.now()}`,
		type: ActionType.CHECK_PRODUCT,
		value: productId,
		origin,
		created_at: new Date().toISOString(),
		is_processed: 0
	};
}

/**
 * Factory function to create a NotifyPriceAction
 * @param productId Product ID
 * @param origin Origin of the action (defaults to undefined)
 */
export function createNotifyPriceAction(
	productId: string,
	origin?: ActionOrigin
): NotifyPriceAction {
	return {
		id: `notify-${Date.now()}`,
		type: ActionType.NOTIFY_PRICE,
		value: productId,
		origin,
		created_at: new Date().toISOString(),
		is_processed: 0
	};
}