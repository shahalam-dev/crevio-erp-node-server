import { Router } from 'express';

import { TelegramController } from '../../controllers/telegram.controller';
import { authenticate } from '../../middleware/auth';
import { UserRepository } from '../../repositories/user.repository';
import { HttpTelegramProvider } from '../../services/telegram/providers/http-telegram.provider';
import { TelegramService } from '../../services/telegram/telegram.service';
import { TelegramLinkTokenService } from '../../services/telegram-link-token.service';
import { TelegramVerificationService } from '../../services/telegram-verification.service';

const router: ReturnType<typeof Router> = Router();

const userRepository = new UserRepository();
const telegramLinkTokenService = new TelegramLinkTokenService();
const telegramProvider = new HttpTelegramProvider();
const telegramService = new TelegramService(telegramProvider);
export const telegramVerificationService = new TelegramVerificationService(
  telegramLinkTokenService,
  telegramService,
  userRepository
);

export const telegramController = new TelegramController(
  telegramLinkTokenService,
  telegramVerificationService,
  userRepository
);

router.get('/link', authenticate, telegramController.getLink);

export default router;
