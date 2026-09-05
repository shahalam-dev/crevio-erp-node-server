import { Prisma } from '@prisma/client';

import { BaseRepository } from './base.repository';

/**
 * Entity shape required for models that support soft delete.
 */
export type SoftDeleteEntity = {
  deletedAt: Date | null;
};

/**
 * Minimal Prisma model delegate needed for soft-delete operations.
 * Uses `any` for args so the generic base can accept any Prisma model
 * while concrete repositories retain full type safety in their own methods.
 */
export type PrismaSoftDeleteModel<T> = {
  findUnique: (args: any) => Promise<T | null>;
  findMany: (args?: any) => Promise<T[]>;
  update: (args: any) => Promise<T>;
};

/**
 * Abstract repository base for Prisma models that implement soft delete
 * via a `deletedAt` column. Automatically filters out deleted rows on
 * reads and converts `delete` into a soft-delete update.
 *
 * Convention: any model with `deletedAt DateTime?` should extend this class.
 */
export abstract class SoftDeleteRepository<T extends SoftDeleteEntity> extends BaseRepository<T> {
  constructor(protected model: PrismaSoftDeleteModel<T>) {
    super();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async findAll(): Promise<T[]> {
    return this.model.findMany({
      where: { deletedAt: null },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.model.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      return await this.model.update({
        where: { id, deletedAt: null },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}
