import { Entity } from './Entity';

/**
 * Represents a user in the system
 */
export interface User extends Entity {
  nome: string;
  sobrenome: string;
  username: string;
  idioma: string;
  ativo: boolean;
}

/**
 * Factory function to create a new User
 */
export function createUser(params: Omit<User, 'ativo'>): User {
  return {
    ...params,
    ativo: false // Users start with monitoring disabled
  };
}