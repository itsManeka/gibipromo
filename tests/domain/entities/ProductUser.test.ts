import { createProductUser, updateDesiredPrice, shouldNotifyForPrice } from '../../../src/domain/entities/ProductUser';

describe('ProductUser Entity', () => {
    describe('createProductUser', () => {
        it('should create a ProductUser with composite ID', () => {
            const productUser = createProductUser({
                product_id: 'B08XXX123',
                user_id: '123456789'
            });

            expect(productUser.id).toBe('B08XXX123#123456789');
            expect(productUser.product_id).toBe('B08XXX123');
            expect(productUser.user_id).toBe('123456789');
            expect(productUser.desired_price).toBeUndefined();
            expect(productUser.created_at).toBeDefined();
            expect(productUser.updated_at).toBeDefined();
        });

        it('should create a ProductUser with desired_price', () => {
            const productUser = createProductUser({
                product_id: 'B08XXX123',
                user_id: '123456789',
                desired_price: 99.90
            });

            expect(productUser.desired_price).toBe(99.90);
        });
    });

    describe('updateDesiredPrice', () => {
        it('should update the desired price and updated_at timestamp', () => {
            const originalProductUser = createProductUser({
                product_id: 'B08XXX123',
                user_id: '123456789'
            });

            // Avança o tempo para garantir que o timestamp seja diferente
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2025-01-01T10:00:01Z'));
            
            const updatedProductUser = updateDesiredPrice(originalProductUser, 89.90);

            expect(updatedProductUser.desired_price).toBe(89.90);
            expect(updatedProductUser.updated_at).not.toBe(originalProductUser.updated_at);
            expect(updatedProductUser.product_id).toBe(originalProductUser.product_id);
            expect(updatedProductUser.user_id).toBe(originalProductUser.user_id);
            
            jest.useRealTimers();
        });
    });

    describe('shouldNotifyForPrice', () => {
        it('should return true when desired_price is undefined (global logic)', () => {
            const productUser = createProductUser({
                product_id: 'B08XXX123',
                user_id: '123456789'
            });

            expect(shouldNotifyForPrice(productUser, 100)).toBe(true);
            expect(shouldNotifyForPrice(productUser, 50)).toBe(true);
        });

        it('should return true when current price is less than desired_price', () => {
            const productUser = createProductUser({
                product_id: 'B08XXX123',
                user_id: '123456789',
                desired_price: 100
            });

            expect(shouldNotifyForPrice(productUser, 99.99)).toBe(true);
            expect(shouldNotifyForPrice(productUser, 50)).toBe(true);
        });

        it('should return true when current price equals desired_price', () => {
            const productUser = createProductUser({
                product_id: 'B08XXX123',
                user_id: '123456789',
                desired_price: 100
            });

            expect(shouldNotifyForPrice(productUser, 100)).toBe(true);
        });

        it('should return false when current price is greater than desired_price', () => {
            const productUser = createProductUser({
                product_id: 'B08XXX123',
                user_id: '123456789',
                desired_price: 100
            });

            expect(shouldNotifyForPrice(productUser, 100.01)).toBe(false);
            expect(shouldNotifyForPrice(productUser, 150)).toBe(false);
        });
    });
});