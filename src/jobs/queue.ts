import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import { env } from '../config/env';

export const EMAIL_QUEUE_NAME = 'email-queue';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string | undefined;
  from?: string | undefined;
}

export const redisConnection = new IORedis(env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60, // 7 days
      count: 5000,
    },
  },
});
