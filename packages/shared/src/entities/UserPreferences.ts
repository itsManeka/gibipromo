import { Entity } from './Entity';

/**
 * Represents user preferences and settings
 */
export interface UserPreferences extends Entity {
	user_id: string; // References User.id
	monitor_preorders: boolean; // Whether to monitor pre-orders
	monitor_coupons: boolean; // Whether to monitor coupons
}

/**
 * Factory function to create new UserPreferences with default values
 */
export function createUserPreferences(params: {
	id: string;
	user_id: string;
	monitor_preorders?: boolean;
	monitor_coupons?: boolean;
}): UserPreferences {
	return {
		id: params.id,
		user_id: params.user_id,
		monitor_preorders: params.monitor_preorders ?? true,
		monitor_coupons: params.monitor_coupons ?? true
	};
}