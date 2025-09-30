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
      expect(action.product_link).toBe(productLink);
      expect(action.is_processed).toBe(false);
      expect(action.id).toMatch(/^add-\d+$/);
      expect(action.created_at).toBeDefined();
    });
  });

  describe('CheckProductAction', () => {
    it('should create an action to check a product', () => {
      const productId = 'B08PP8QHFQ';
      
      const action = createCheckProductAction(productId);

      expect(action.type).toBe(ActionType.CHECK_PRODUCT);
      expect(action.product_id).toBe(productId);
      expect(action.is_processed).toBe(false);
      expect(action.id).toMatch(/^check-\d+$/);
      expect(action.created_at).toBeDefined();
    });
  });

  describe('NotifyPriceAction', () => {
    it('should create an action to notify price change', () => {
      const productId = 'B08PP8QHFQ';
      const oldPrice = 99.99;
      const newPrice = 89.99;
      
      const action = createNotifyPriceAction(productId, oldPrice, newPrice);

      expect(action.type).toBe(ActionType.NOTIFY_PRICE);
      expect(action.product_id).toBe(productId);
      expect(action.old_price).toBe(oldPrice);
      expect(action.new_price).toBe(newPrice);
      expect(action.is_processed).toBe(false);
      expect(action.id).toMatch(/^notify-\d+$/);
      expect(action.created_at).toBeDefined();
    });
  });
});