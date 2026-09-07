import { env } from '../../../config/env';
import { CustomError } from '../../../exceptions/CustomError';

import type {
  TelegramMessageOptions,
  TelegramProvider,
  TelegramUpdate,
  TelegramUser,
} from './telegram.provider';

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export class HttpTelegramProvider implements TelegramProvider {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = env.TELEGRAM_BOT_TOKEN
      ? `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`
      : '';
  }

  async getMe(): Promise<TelegramUser> {
    const response = await this.request<{ id: number; username?: string; first_name: string }>(
      'getMe'
    );

    return {
      id: response.id,
      firstName: response.first_name,
      ...(response.username !== undefined && { username: response.username }),
    };
  }

  async getUpdates(offset: number, limit: number): Promise<TelegramUpdate[]> {
    return this.request<TelegramUpdate[]>('getUpdates', {
      offset,
      limit,
    });
  }

  async sendMessage(options: TelegramMessageOptions): Promise<void> {
    const body: Record<string, unknown> = {
      chat_id: options.chatId,
      text: options.text,
    };

    if (options.parseMode) {
      body.parse_mode = options.parseMode;
    }

    if (options.replyMarkup) {
      body.reply_markup = options.replyMarkup;
    }

    await this.request('sendMessage', body);
  }

  async setWebhook(url: string, secretToken: string): Promise<void> {
    await this.request('setWebhook', {
      url,
      secret_token: secretToken,
      allowed_updates: ['message'],
    });
  }

  private async request<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    if (!this.baseUrl) {
      throw new CustomError('TELEGRAM_BOT_TOKEN is not configured', 500);
    }

    const url = `${this.baseUrl}/${method}`;

    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    const data = (await response.json()) as TelegramApiResponse<T>;

    if (!data.ok) {
      throw new CustomError(`Telegram API error: ${data.description ?? method}`, 500);
    }

    if (data.result === undefined) {
      throw new CustomError(`Telegram API returned no result for ${method}`, 500);
    }

    return data.result;
  }
}
