module.exports = {
  apps: [{
    name: 'server-dashboard',
    script: 'server/index.cjs',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 4321,
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    max_restarts: 10,
    restart_delay: 5000,
    exp_backoff_restart_delay: 100,
  }]
}
