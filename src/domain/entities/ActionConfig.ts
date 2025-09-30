import { Entity } from './Entity';
import { ActionType } from './Action';

/**
 * Configuration for action scheduling
 */
export interface ActionConfig extends Entity {
  action_type: ActionType;
  interval_minutes: number;
  enabled: boolean;
}

/**
 * Factory function to create an ActionConfig
 */
export function createActionConfig(
  actionType: ActionType,
  intervalMinutes: number,
  enabled: boolean = true
): ActionConfig {
  return {
    id: actionType,
    action_type: actionType,
    interval_minutes: intervalMinutes,
    enabled
  };
}