/**
 * Generic repository interface for all entities
 */
export interface Repository<T> {
	create(entity: T): Promise<T>;
	findById(id: string): Promise<T | null>;
	update(entity: T): Promise<T>;
	delete(id: string): Promise<void>;
}