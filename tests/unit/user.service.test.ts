import { describe, it, expect, beforeEach } from 'vitest';

import { UserRepository } from '../../src/repositories/user.repository.js';
import { UserService } from '../../src/services/user.service.js';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    userService = new UserService(userRepository);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const user = await userService.create(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user).not.toHaveProperty('password');
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await userService.create(userData);

      await expect(userService.create(userData)).rejects.toThrow('User already exists');
    });
  });
});
