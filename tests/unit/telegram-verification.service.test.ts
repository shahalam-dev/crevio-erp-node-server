import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisStore = new Map<string, string>();

vi.mock('../../src/config/redis', () => ({
  redis: {
    get: vi.fn((key: string) => Promise.resolve(redisStore.get(key) ?? null)),
    setex: vi.fn((key: string, _seconds: number, value: string) => {
      redisStore.set(key, value);
      return Promise.resolve('OK');
    }),
    del: vi.fn((key: string) => {
      redisStore.delete(key);
      return Promise.resolve(1);
    }),
  },
}));

import { TelegramVerificationService } from '../../src/services/telegram-verification.service';

interface MockedDependencies {
  linkTokenService: { create: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };
  telegramService: { sendMessage: ReturnType<typeof vi.fn> };
  userRepository: { findById: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
}

const createService = (): { service: TelegramVerificationService; deps: MockedDependencies } => {
  const deps: MockedDependencies = {
    linkTokenService: { create: vi.fn(), get: vi.fn() },
    telegramService: { sendMessage: vi.fn() },
    userRepository: { findById: vi.fn(), update: vi.fn() },
  };

  const service = new TelegramVerificationService(
    deps.linkTokenService as unknown as Parameters<typeof TelegramVerificationService>[0],
    deps.telegramService as unknown as Parameters<typeof TelegramVerificationService>[1],
    deps.userRepository as unknown as Parameters<typeof TelegramVerificationService>[2]
  );

  return { service, deps };
};

const createUpdate = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  update_id: 1,
  message: {
    message_id: 1,
    from: { id: 111, is_bot: false, first_name: 'Test' },
    chat: { id: 111, type: 'private' },
    date: 1234567890,
    ...overrides,
  },
});

describe('TelegramVerificationService', () => {
  beforeEach(() => {
    redisStore.clear();
    vi.clearAllMocks();
  });

  describe('handleUpdate', () => {
    it('should ignore invalid updates', async () => {
      const { service, deps } = createService();

      await service.handleUpdate({ invalid: true });

      expect(deps.telegramService.sendMessage).not.toHaveBeenCalled();
    });

    it('should ask for phone when /start has no token', async () => {
      const { service, deps } = createService();

      await service.handleUpdate(createUpdate({ text: '/start' }));

      expect(deps.telegramService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '111',
          text: 'Please open the verification link from the Crevio app.',
        })
      );
    });

    it('should reject expired token', async () => {
      const { service, deps } = createService();
      deps.linkTokenService.get.mockResolvedValue(null);

      await service.handleUpdate(createUpdate({ text: '/start abc123' }));

      expect(deps.linkTokenService.get).toHaveBeenCalledWith('abc123');
      expect(deps.telegramService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '111',
          text: expect.stringContaining('expired'),
        })
      );
    });

    it('should store session and ask for contact on valid /start', async () => {
      const { service, deps } = createService();
      deps.linkTokenService.get.mockResolvedValue({
        userId: 'user-1',
        phone: '+12025550123',
      });

      await service.handleUpdate(createUpdate({ text: '/start validtoken' }));

      expect(redisStore.has('telegram:link-session:111')).toBe(true);
      expect(deps.telegramService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '111',
          text: 'Welcome! Please share your phone number to verify your Telegram account.',
          replyMarkup: expect.any(Object),
        })
      );
    });

    it('should reject contact that is not from the sender', async () => {
      const { service, deps } = createService();
      redisStore.set(
        'telegram:link-session:111',
        JSON.stringify({ userId: 'user-1', phone: '+12025550123' })
      );

      await service.handleUpdate(
        createUpdate({
          contact: {
            phone_number: '+12025550123',
            first_name: 'Test',
            user_id: 999,
          },
        })
      );

      expect(deps.userRepository.update).not.toHaveBeenCalled();
      expect(deps.telegramService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '111',
          text: 'Please share your own phone number.',
        })
      );
    });

    it('should verify user when phone matches', async () => {
      const { service, deps } = createService();
      redisStore.set(
        'telegram:link-session:111',
        JSON.stringify({ userId: 'user-1', phone: '+12025550123' })
      );

      deps.userRepository.findById.mockResolvedValue({
        id: 'user-1',
        phone: '+12025550123',
        telegramVerifyAt: null,
      });

      await service.handleUpdate(
        createUpdate({
          contact: {
            phone_number: '+12025550123',
            first_name: 'Test',
            user_id: 111,
          },
        })
      );

      expect(deps.userRepository.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          telegramChatId: '111',
          telegramVerifyAt: expect.any(Date),
        })
      );
      expect(deps.telegramService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '111',
          text: expect.stringContaining('verified successfully'),
        })
      );
    });

    it('should reject when phone does not match', async () => {
      const { service, deps } = createService();
      redisStore.set(
        'telegram:link-session:111',
        JSON.stringify({ userId: 'user-1', phone: '+12025550123' })
      );

      deps.userRepository.findById.mockResolvedValue({
        id: 'user-1',
        phone: '+12025550987',
        telegramVerifyAt: null,
      });

      await service.handleUpdate(
        createUpdate({
          contact: {
            phone_number: '+12025550123',
            first_name: 'Test',
            user_id: 111,
          },
        })
      );

      expect(deps.userRepository.update).not.toHaveBeenCalled();
      expect(deps.telegramService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '111',
          text: expect.stringContaining('does not match'),
        })
      );
    });

    it('should inform already verified users', async () => {
      const { service, deps } = createService();
      redisStore.set(
        'telegram:link-session:111',
        JSON.stringify({ userId: 'user-1', phone: '+12025550123' })
      );

      deps.userRepository.findById.mockResolvedValue({
        id: 'user-1',
        phone: '+12025550123',
        telegramVerifyAt: new Date(),
      });

      await service.handleUpdate(
        createUpdate({
          contact: {
            phone_number: '+12025550123',
            first_name: 'Test',
            user_id: 111,
          },
        })
      );

      expect(deps.userRepository.update).not.toHaveBeenCalled();
      expect(deps.telegramService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '111',
          text: 'Your Telegram account is already verified.',
        })
      );
    });
  });
});
