import { Entity } from './Entity';

/**
 * Represents the relationship between a product and a user who monitors it
 */
export interface ProductUser extends Entity {
    product_id: string;
    user_id: string;
    desired_price?: number; // Optional: if set, notification is sent only when price <= desired_price
    created_at: string;
    updated_at: string;
}

/**
 * Factory function to create a new ProductUser relationship
 */
export function createProductUser(params: {
    product_id: string;
    user_id: string;
    desired_price?: number;
}): ProductUser {
    const now = new Date().toISOString();
    return {
        id: `${params.product_id}#${params.user_id}`, // Composite key for DynamoDB
        product_id: params.product_id,
        user_id: params.user_id,
        desired_price: params.desired_price,
        created_at: now,
        updated_at: now
    };
}

/**
 * Updates the desired price for a ProductUser relationship
 */
export function updateDesiredPrice(productUser: ProductUser, newDesiredPrice: number): ProductUser {
    return {
        ...productUser,
        desired_price: newDesiredPrice,
        updated_at: new Date().toISOString()
    };
}

/**
 * Checks if a price notification should be sent based on desired price
 */
export function shouldNotifyForPrice(productUser: ProductUser, currentPrice: number): boolean {
    // If no desired_price is set, use global notification logic (always notify for price drop)
    if (productUser.desired_price === undefined || productUser.desired_price === null) {
        return true;
    }
    
    // If desired_price is set, only notify if current price is <= desired price
    return currentPrice <= productUser.desired_price;
}