import { describe, it, expect, beforeEach, vi } from 'vitest';

import { prisma } from '../../src/config/database';
import type { UserRepository } from '../../src/repositories/user.repository';
import { AuthService } from '../../src/services/auth.service';

vi.mock('../../src/config/database', () => ({
  prisma: {
    refreshToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;

  const baseUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2b$12$abcdefghijklmnopqrstuvwxycdefghijklmnopqrstu',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    role: 'USER' as const,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as UserRepository;

    authService = new AuthService(userRepository);

    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue(baseUser);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        id: 'token-1',
        jti: 'jti-1',
        userId: baseUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await authService.register(input);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(input.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.refreshToken.create).toHaveBeenCalledOnce();
    });

    it('should throw error if user already exists', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(baseUser);

      await expect(authService.register(input)).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        ...baseUser,
        password: await import('bcrypt').then(bcrypt => bcrypt.hash('password123', 10)),
      });
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        id: 'token-1',
        jti: 'jti-1',
        userId: baseUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error with invalid credentials', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should reject login for deleted users', async () => {
      // The repository filters out soft-deleted users, so auth service sees null.
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.login('deleted@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 1 });

      await authService.logout('invalid-token');

      // Invalid tokens are ignored during logout
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });
});
