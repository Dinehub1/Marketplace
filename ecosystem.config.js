const path = require('path');
const projectRoot = path.resolve(__dirname);

module.exports = {
  apps: [{
    name: 'hermes-web',
    script: path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
    args: 'start -p 8080',
    cwd: projectRoot,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1200M',
    node_args: ['--max-old-space-size=900'],
    env: {
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1'
    },
    // Stability: wait before restart, stop after 5 rapid crashes
    max_restarts: 5,
    restart_delay: 5000,
    exp_backoff_restart_delay: 2000,
    wait_ready: true,
    listen_timeout: 20000,
    kill_timeout: 25000,
    stop_exit_codes: [1],
    // don't crash loop forever
    // PM2 will stop restarting after max_restarts consecutive failures
    // within a 60s window
    min_uptime: '30s',
  }]
}
