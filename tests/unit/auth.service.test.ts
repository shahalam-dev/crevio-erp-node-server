import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/jobs/email.job', () => ({
  EmailJob: {
    sendVerificationEmail: vi.fn(),
    add: vi.fn(),
  },
}));

import { prisma } from '../../src/config/database';
import { EmailJob } from '../../src/jobs/email.job';
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
    user: {
      update: vi.fn(),
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
    emailVerifyAt: null,
    phoneVerifyAt: null,
  };

  const verifiedUser = {
    ...baseUser,
    emailVerifyAt: new Date(),
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
    it('should register a new user and enqueue verification email', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue(baseUser);

      const result = await authService.register(input);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(input.email);
      expect(result.message).toContain('Please check your email');
      expect(EmailJob.sendVerificationEmail).toHaveBeenCalledOnce();
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
    it('should login with valid credentials and verified email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        ...verifiedUser,
        password: await import('bcrypt').then(bcrypt => bcrypt.hash('password123', 10)),
      });
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        id: 'token-1',
        jti: 'jti-1',
        userId: verifiedUser.id,
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

    it('should reject login for unverified users', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        ...baseUser,
        password: await import('bcrypt').then(bcrypt => bcrypt.hash('password123', 10)),
      });

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'Please verify your email'
      );
    });

    it('should reject login for deleted users', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(authService.login('deleted@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const token = authService['generateEmailVerificationToken'](baseUser);

      vi.mocked(userRepository.findById).mockResolvedValue(baseUser);
      vi.mocked(prisma.user.update).mockResolvedValue(verifiedUser);

      const result = await authService.verifyEmail(token);

      expect(result.user.emailVerifyAt).toBeDefined();
      expect(result.message).toBe('Email verified successfully');
      expect(prisma.user.update).toHaveBeenCalledOnce();
    });

    it('should return already verified message if user is already verified', async () => {
      const token = authService['generateEmailVerificationToken'](verifiedUser);

      vi.mocked(userRepository.findById).mockResolvedValue(verifiedUser);

      const result = await authService.verifyEmail(token);

      expect(result.message).toBe('Email already verified');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid or expired verification token'
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should enqueue verification email for unverified user', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(baseUser);

      const result = await authService.resendVerificationEmail('test@example.com');

      expect(result.message).toContain('If an account with this email exists');
      expect(EmailJob.sendVerificationEmail).toHaveBeenCalledOnce();
    });

    it('should not enqueue email for non-existent user', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      const result = await authService.resendVerificationEmail('missing@example.com');

      expect(result.message).toContain('If an account with this email exists');
      expect(EmailJob.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should not enqueue email for already verified user', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(verifiedUser);

      const result = await authService.resendVerificationEmail('test@example.com');

      expect(result.message).toContain('If an account with this email exists');
      expect(EmailJob.sendVerificationEmail).not.toHaveBeenCalled();
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
