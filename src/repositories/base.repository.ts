export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * Base repository interface. Concrete repositories may extend
 * `SoftDeleteRepository` when their Prisma model has a `deletedAt` column.
 *
 * Soft-delete convention:
 * - `findById` / `findAll` should exclude rows where `deletedAt` is not null.
 * - `delete` should set `deletedAt` to the current timestamp.
 * - `update` should be blocked for soft-deleted rows.
 */
export abstract class BaseRepository<T> implements Repository<T> {
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
}
