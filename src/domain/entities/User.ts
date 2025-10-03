import { Entity } from './Entity';

/**
 * Represents a user in the system
 */
export interface User extends Entity {
  username: string;
  name: string;
  language: string;
  enabled: boolean;
}

/**
 * Factory function to create a new User
 */
export function createUser(params: Omit<User, 'enabled'>): User {
  return {
    ...params,
    enabled: false // Users start with monitoring disabled
  };
}