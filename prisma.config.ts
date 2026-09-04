import dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// const envFile =
//   process.env.NODE_ENV === 'production'
//     ? '.env.production'
//     : process.env.NODE_ENV === 'test'
//       ? '.env.test'
//       : '.env.development';

const envFile = '.env';

dotenv.config({ path: envFile });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
