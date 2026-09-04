import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
  console.log(`📦 Environment: ${env.NODE_ENV}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Closing server...`);
  server.close(() => {
    console.log('💤 Server closed successfully');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('⚠️ Force closing server after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default server;
