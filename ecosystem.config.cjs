module.exports = {
  apps: [
    {
      name: 'express-app',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      kill_timeout: 5000,
      listen_timeout: 3000,
      watch: false,
      increment_var: 'PORT',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'email-worker',
      script: 'dist/worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/worker-err.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      max_memory_restart: '512M',
      kill_timeout: 5000,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
