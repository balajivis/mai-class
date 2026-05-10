module.exports = {
  apps: [
    {
      name: 'sdrauto-api',
      script: 'dist/server.js',
      cwd: '/opt/sdrauto',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--experimental-specifier-resolution=node',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '/opt/sdrauto/.env',
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/sdrauto/error.log',
      out_file: '/var/log/sdrauto/out.log',
      merge_logs: true,
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
}
