import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { UserRepository } from '../../src/repositories/user.repository';
import { UserService } from '../../src/services/user.service';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as UserRepository;

    userService = new UserService(userRepository);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
      };

      const createdAt = new Date();
      const updatedAt = new Date();

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue({
        id: 'user-1',
        email: userData.email,
        password: 'hashed-password',
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: 'USER',
        avatarUrl: null,
        createdAt,
        updatedAt,
        deletedAt: null,
      });

      const user = await userService.create(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user).not.toHaveProperty('password');
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        id: 'user-1',
        email: userData.email,
        password: 'hashed-password',
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await expect(userService.create(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const user = {
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

      vi.mocked(userRepository.findById).mockResolvedValue(user);

      const result = await userService.findById('user-1');

      expect(result.id).toBe(user.id);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(userService.findById('user-1')).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      vi.mocked(userRepository.delete).mockResolvedValue(true);

      await expect(userService.delete('user-1')).resolves.toBeUndefined();
      expect(userRepository.delete).toHaveBeenCalledWith('user-1');
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.delete).mockResolvedValue(false);

      await expect(userService.delete('user-1')).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      vi.mocked(userRepository.update).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'Updated',
        lastName: 'User',
        phone: '+1234567890',
        role: 'USER',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await userService.update('user-1', { firstName: 'Updated' });

      expect(result.firstName).toBe('Updated');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found', async () => {
      vi.mocked(userRepository.update).mockResolvedValue(null);

      await expect(userService.update('user-1', { firstName: 'Updated' })).rejects.toThrow(
        'User not found'
      );
    });
  });
});
