import { Repository } from './Repository';
import { User } from '../../domain/entities/User';

/**
 * Repository interface for User entities
 */
export interface UserRepository extends Repository<User> {
  findByUsername(username: string): Promise<User | null>;
  setActive(id: string, active: boolean): Promise<User>;
}