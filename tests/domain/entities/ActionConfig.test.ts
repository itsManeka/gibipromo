import { createActionConfig } from '../../../src/domain/entities/ActionConfig';
import { ActionType } from '../../../src/domain/entities/Action';

describe('ActionConfig Entity', () => {
    it('should create an action config with enabled by default', () => {
        const type = ActionType.ADD_PRODUCT;
        const interval = 5;
    
        const config = createActionConfig(type, interval);

        expect(config.action_type).toBe(type);
        expect(config.interval_minutes).toBe(interval);
        expect(config.enabled).toBe(true);
        expect(config.id).toBe(type);
    });

    it('should create a disabled action config', () => {
        const type = ActionType.CHECK_PRODUCT;
        const interval = 60;
        const enabled = false;
    
        const config = createActionConfig(type, interval, enabled);

        expect(config.action_type).toBe(type);
        expect(config.interval_minutes).toBe(interval);
        expect(config.enabled).toBe(false);
        expect(config.id).toBe(type);
    });

    it('should set id equal to action_type', () => {
        const type = ActionType.NOTIFY_PRICE;
        const interval = 1;
    
        const config = createActionConfig(type, interval);

        expect(config.id).toBe(config.action_type);
    });
});