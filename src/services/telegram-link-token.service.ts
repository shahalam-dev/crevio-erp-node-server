import crypto from 'crypto';

import { env } from '../config/env';
import { redis } from '../config/redis';

export interface TelegramLinkTokenPayload {
  userId: string;
  phone: string;
}

export class TelegramLinkTokenService {
  private readonly keyPrefix = 'telegram:link';
  private readonly ttlSeconds: number;

  constructor(ttlSeconds: number = env.TELEGRAM_LINK_TOKEN_TTL_SECONDS) {
    this.ttlSeconds = ttlSeconds;
  }

  async create(payload: TelegramLinkTokenPayload): Promise<string> {
    const token = crypto.randomBytes(16).toString('hex');
    await redis.setex(`${this.keyPrefix}:${token}`, this.ttlSeconds, JSON.stringify(payload));
    return token;
  }

  async get(token: string): Promise<TelegramLinkTokenPayload | null> {
    const data = await redis.get(`${this.keyPrefix}:${token}`);
    if (!data) {
      return null;
    }

    await redis.del(`${this.keyPrefix}:${token}`);
    return JSON.parse(data) as TelegramLinkTokenPayload;
  }
}
