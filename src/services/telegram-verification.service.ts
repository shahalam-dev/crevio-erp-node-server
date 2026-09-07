import { parsePhoneNumber } from 'libphonenumber-js';

import { env } from '../config/env';
import { redis } from '../config/redis';
import { CustomError } from '../exceptions/CustomError';
import type { UserRepository } from '../repositories/user.repository';
import { normalizePhone } from '../utils/phone.util';
import {
  telegramUpdateSchema,
  type TelegramMessage,
  type TelegramUpdate,
} from '../validators/telegram.validator';

import type { TelegramService } from './telegram/telegram.service';
import type { TelegramLinkTokenService } from './telegram-link-token.service';

interface TelegramSessionPayload {
  userId: string;
  phone: string;
}

export class TelegramVerificationService {
  private readonly sessionPrefix = 'telegram:link-session';
  private readonly sessionTtlSeconds: number;

  constructor(
    private linkTokenService: TelegramLinkTokenService,
    private telegramService: TelegramService,
    private userRepository: UserRepository
  ) {
    this.sessionTtlSeconds = env.TELEGRAM_LINK_TOKEN_TTL_SECONDS;
  }

  async handleUpdate(update: TelegramUpdate | unknown): Promise<void> {
    const parsed = telegramUpdateSchema.safeParse(update);
    if (!parsed.success) {
      console.warn('Invalid Telegram update received', parsed.error);
      return;
    }

    const message = parsed.data.message;
    if (!message) {
      return;
    }

    const chatId = String(message.chat.id);

    if (message.text?.startsWith('/start')) {
      await this.handleStart(message, chatId);
      return;
    }

    if (message.contact) {
      await this.handleContact(message, chatId);
    }
  }

  private async handleStart(message: TelegramMessage, chatId: string): Promise<void> {
    const token = message.text?.split(' ')[1]?.trim();

    if (!token) {
      await this.sendMessage(chatId, 'Please open the verification link from the Crevio app.');
      return;
    }

    const payload = await this.linkTokenService.get(token);
    if (!payload) {
      await this.sendMessage(
        chatId,
        'This verification link has expired or is invalid. Please request a new one.'
      );
      return;
    }

    await redis.setex(
      `${this.sessionPrefix}:${chatId}`,
      this.sessionTtlSeconds,
      JSON.stringify(payload)
    );

    await this.sendMessage(
      chatId,
      'Welcome! Please share your phone number to verify your Telegram account.',
      {
        replyMarkup: {
          keyboard: [[{ text: 'Share my phone number', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  }

  private async handleContact(message: TelegramMessage, chatId: string): Promise<void> {
    const fromId = message.from?.id;
    const contact = message.contact;

    if (!fromId || !contact) {
      return;
    }

    if (contact.user_id !== fromId) {
      await this.sendMessage(chatId, 'Please share your own phone number.');
      return;
    }

    const sessionKey = `${this.sessionPrefix}:${chatId}`;
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      await this.sendMessage(chatId, 'Please start the verification from the Crevio app.');
      return;
    }

    await redis.del(sessionKey);

    let session: TelegramSessionPayload;
    try {
      session = JSON.parse(sessionData) as TelegramSessionPayload;
    } catch {
      await this.sendMessage(chatId, 'Something went wrong. Please try again.');
      return;
    }

    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      await this.sendMessage(chatId, 'User not found. Please contact support.');
      return;
    }

    if (user.telegramVerifyAt) {
      await this.sendMessage(chatId, 'Your Telegram account is already verified.');
      return;
    }

    const userCountryCode = parsePhoneNumber(user.phone)?.country;

    let contactPhone: string;
    try {
      const cleanedPhone = contact.phone_number.replace(/[\s()-]/g, '');
      contactPhone = cleanedPhone.startsWith('+')
        ? normalizePhone(cleanedPhone)
        : normalizePhone(cleanedPhone, userCountryCode);
    } catch {
      console.warn('Failed to normalize Telegram contact phone:', contact.phone_number);
      await this.sendMessage(chatId, 'The shared phone number is invalid.');
      return;
    }

    if (user.phone !== contactPhone) {
      await this.sendMessage(
        chatId,
        'The phone number does not match our records. Please make sure you are using the same phone number as your Crevio account.'
      );
      return;
    }

    await this.userRepository.update(user.id, {
      telegramChatId: chatId,
      telegramVerifyAt: new Date(),
    });

    await this.sendMessage(
      chatId,
      'Your Telegram account has been verified successfully. You can now close this chat.'
    );
  }

  private async sendMessage(
    chatId: string,
    text: string,
    extra?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.telegramService.sendMessage({ chatId, text, ...extra });
    } catch (error) {
      if (error instanceof CustomError) {
        console.error('Failed to send Telegram message:', error.message);
      } else {
        console.error('Failed to send Telegram message:', error);
      }
    }
  }
}
