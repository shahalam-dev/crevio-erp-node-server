import type { TelegramMessageOptions, TelegramProvider } from './providers/telegram.provider';

export class TelegramService {
  constructor(private provider: TelegramProvider) {}

  async getMe(): Promise<{ id: number; username?: string; firstName: string }> {
    return this.provider.getMe();
  }

  async sendMessage(options: TelegramMessageOptions): Promise<void> {
    await this.provider.sendMessage(options);
  }

  async setWebhook(url: string, secretToken: string): Promise<void> {
    await this.provider.setWebhook(url, secretToken);
  }
}
