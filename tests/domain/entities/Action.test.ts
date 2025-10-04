import { 
    ActionType,
    createAddProductAction,
    createCheckProductAction,
    createNotifyPriceAction 
} from '../../../src/domain/entities/Action';

describe('Action Entities', () => {
    describe('AddProductAction', () => {
        it('should create an action to add a product', () => {
            const userId = '123456789';
            const productLink = 'https://amazon.com.br/dp/B08PP8QHFQ';
      
            const action = createAddProductAction(userId, productLink);

            expect(action.type).toBe(ActionType.ADD_PRODUCT);
            expect(action.user_id).toBe(userId);
            expect(action.value).toBe(productLink);
            expect(action.is_processed).toBe(0);
            expect(action.id).toMatch(/^add-\d+$/);
            expect(action.created_at).toBeDefined();
        });
    });

    describe('CheckProductAction', () => {
        it('should create an action to check a product', () => {
            const productId = 'B08PP8QHFQ';
      
            const action = createCheckProductAction(productId);

            expect(action.type).toBe(ActionType.CHECK_PRODUCT);
            expect(action.value).toBe(productId);
            expect(action.is_processed).toBe(0);
            expect(action.id).toMatch(/^check-\d+$/);
            expect(action.created_at).toBeDefined();
        });
    });

    describe('NotifyPriceAction', () => {
        it('should create an action to notify price change', () => {
            const productId = 'B08PP8QHFQ';
      
            const action = createNotifyPriceAction(productId);

            expect(action.type).toBe(ActionType.NOTIFY_PRICE);
            expect(action.value).toBe(productId);
            expect(action.is_processed).toBe(0);
            expect(action.id).toMatch(/^notify-\d+$/);
            expect(action.created_at).toBeDefined();
        });
    });
});