import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables based on NODE_ENV
// const envFile =
//   process.env.NODE_ENV === 'production'
//     ? '.env.production'
//     : process.env.NODE_ENV === 'test'
//       ? '.env.test'
//       : '.env.development';

const envFile = '.env';

dotenv.config({ path: envFile });

// Define environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('localhost'),
  DATABASE_URL: z.url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.url().optional(),
  API_KEY: z.string().optional(),
});

// Validate and export environment
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.message);
  throw new Error('Invalid environment configuration');
}

export const env = parsedEnv.data;
