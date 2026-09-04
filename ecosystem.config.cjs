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
  ],
};
