import { env } from '../../config/env';

import { TelegramPollingService } from './polling.service';
import { HttpTelegramProvider } from './providers/http-telegram.provider';
import { TelegramService } from './telegram.service';

let pollingService: TelegramPollingService | null = null;

export function startTelegramBot(onUpdate: (update: unknown) => Promise<void>): void {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured. Skipping Telegram bot startup.');
    return;
  }

  const provider = new HttpTelegramProvider();
  const telegramService = new TelegramService(provider);

  void telegramService
    .getMe()
    .then(me => {
      console.log(`🤖 Telegram bot connected: @${me.username ?? me.id}`);
    })
    .catch(error => {
      console.error('❌ Failed to connect to Telegram bot:', error);
    });

  if (env.TELEGRAM_USE_POLLING) {
    pollingService = new TelegramPollingService(provider, onUpdate);
    pollingService.start();
    console.log('🔄 Telegram bot polling started');
    return;
  }

  if (!env.PUBLIC_API_URL || !env.TELEGRAM_WEBHOOK_SECRET) {
    console.warn(
      '⚠️ Telegram webhook not configured (PUBLIC_API_URL or TELEGRAM_WEBHOOK_SECRET missing).'
    );
    return;
  }

  const webhookUrl = `${env.PUBLIC_API_URL}/webhooks/telegram`;

  void telegramService
    .setWebhook(webhookUrl, env.TELEGRAM_WEBHOOK_SECRET)
    .then(() => {
      console.log(`🔗 Telegram webhook set: ${webhookUrl}`);
    })
    .catch(error => {
      console.error('❌ Failed to set Telegram webhook:', error);
    });
}

export function stopTelegramBot(): void {
  if (pollingService) {
    pollingService.stop();
    pollingService = null;
    console.log('🛑 Telegram bot polling stopped');
  }
}
