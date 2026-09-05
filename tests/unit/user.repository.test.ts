import { Prisma } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { prisma } from '../../src/config/database';
import { UserRepository } from '../../src/repositories/user.repository';

vi.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const baseUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed-password',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  role: 'USER' as const,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('UserRepository - soft delete', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should filter out deleted users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userRepository.findById('user-1');

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1', deletedAt: null },
      });
    });
  });

  describe('findAll', () => {
    it('should filter out deleted users', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([baseUser]);

      const result = await userRepository.findAll();

      expect(result).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });
  });

  describe('findByEmail', () => {
    it('should filter out deleted users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
    });
  });

  describe('delete', () => {
    it('should perform soft delete by setting deletedAt', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...baseUser,
        deletedAt: new Date(),
      });

      const result = await userRepository.delete('user-1');

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { deletedAt: expect.any(Date) as Date },
      });
    });

    it('should return false when user is not found', async () => {
      vi.mocked(prisma.user.update).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record to update not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })
      );

      const result = await userRepository.delete('user-1');

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('should update non-deleted users', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue(baseUser);

      const result = await userRepository.update('user-1', { firstName: 'Updated' });

      expect(result).toEqual(baseUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1', deletedAt: null },
        data: { firstName: 'Updated' },
      });
    });

    it('should return null when user is deleted or not found', async () => {
      vi.mocked(prisma.user.update).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record to update not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })
      );

      const result = await userRepository.update('user-1', { firstName: 'Updated' });

      expect(result).toBeNull();
    });
  });
});
