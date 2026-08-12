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
    // `next start` never calls process.send('ready'), so wait_ready must stay
    // off -- with it on, pm2 kills the healthy process at listen_timeout.
    wait_ready: false,
    max_restarts: 50,
    restart_delay: 5000,
    exp_backoff_restart_delay: 2000,
    kill_timeout: 25000,
    min_uptime: '30s',
  }]
}
