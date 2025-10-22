import { Entity } from './Entity';

/**
 * Represents user preferences and settings
 */
export interface UserPreferences extends Entity {
	user_id: string; // References User.id
	monitor_preorders: boolean; // Whether to monitor pre-orders
	monitor_coupons: boolean; // Whether to monitor coupons
	created_at: string; // ISO 8601 timestamp
	updated_at: string; // ISO 8601 timestamp
}

/**
 * Factory function to create new UserPreferences with default values
 */
export function createUserPreferences(params: {
	id: string;
	user_id: string;
	monitor_preorders?: boolean;
	monitor_coupons?: boolean;
	created_at?: string;
	updated_at?: string;
}): UserPreferences {
	const now = new Date().toISOString();
	return {
		id: params.id,
		user_id: params.user_id,
		monitor_preorders: params.monitor_preorders ?? false,
		monitor_coupons: params.monitor_coupons ?? false,
		created_at: params.created_at ?? now,
		updated_at: params.updated_at ?? now
	};
}