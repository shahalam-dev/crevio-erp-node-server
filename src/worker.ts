import './jobs/email.worker';

console.log('🚀 Worker process is running. Press Ctrl+C to stop.');

// Keep the process alive
setInterval(
  () => {
    // Heartbeat to prevent the event loop from exiting
  },
  1000 * 60 * 60
);

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down worker...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', error => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
