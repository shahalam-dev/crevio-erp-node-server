import type { Request, Response, NextFunction } from 'express';

import { env } from '../config/env.js';
import { CustomError } from '../exceptions/CustomError.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { UserRepository } from '../repositories/user.repository.js';
import type { TelegramLinkTokenService } from '../services/telegram-link-token.service.js';
import type { TelegramVerificationService } from '../services/telegram-verification.service.js';
import { sendSuccess } from '../utils/response.js';

import { BaseController } from './base.controller.js';

const TELEGRAM_DEEP_LINK_BASE = 'https://t.me';

export class TelegramController extends BaseController {
  constructor(
    private telegramLinkTokenService: TelegramLinkTokenService,
    private telegramVerificationService: TelegramVerificationService,
    private userRepository: UserRepository
  ) {
    super();
  }

  getLink = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('Unauthorized', 401);
      }

      if (!env.TELEGRAM_BOT_USERNAME) {
        throw new CustomError('Telegram bot username is not configured', 500);
      }

      const user = await this.userRepository.findById(req.user.id);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      const token = await this.telegramLinkTokenService.create({
        userId: user.id,
        phone: user.phone,
      });

      const link = `${TELEGRAM_DEEP_LINK_BASE}/${env.TELEGRAM_BOT_USERNAME}?start=${token}`;

      sendSuccess(req, res, { link });
    } catch (error) {
      next(error);
    }
  };

  webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const secretToken = req.headers['x-telegram-bot-api-secret-token'];

      if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
        throw new CustomError('Unauthorized', 401);
      }

      await this.telegramVerificationService.handleUpdate(req.body);

      sendSuccess(req, res, undefined, { statusCode: 200 });
    } catch (error) {
      next(error);
    }
  };
}
