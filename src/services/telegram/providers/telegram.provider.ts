export interface TelegramMessageOptions {
  chatId: string;
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  replyMarkup?: Record<string, unknown>;
}

export interface TelegramUser {
  id: number;
  username?: string;
  firstName: string;
}

export interface TelegramUpdate {
  update_id: number;
  [key: string]: unknown;
}

export interface TelegramProvider {
  getMe(): Promise<TelegramUser>;
  getUpdates(offset: number, limit: number): Promise<TelegramUpdate[]>;
  sendMessage(options: TelegramMessageOptions): Promise<void>;
  setWebhook(url: string, secretToken: string): Promise<void>;
}
