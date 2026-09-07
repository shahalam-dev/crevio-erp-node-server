import IORedis from 'ioredis';

import { env } from './env';

export const redis = new IORedis(env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
