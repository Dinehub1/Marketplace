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
    // --- Crash loop prevention ---
    // Wait 5s before first restart, then add 2s each time (up to 30s)
    max_restarts: 5,
    restart_delay: 5000,
    exp_backoff_restart_delay: 2000,
    // Give Next.js 20s to finish booting before calling it "ready"
    wait_ready: true,
    listen_timeout: 20000,
    // Graceful shutdown: wait 25s for cleanup before hard kill
    kill_timeout: 25000,
    // If it crashes 5 times in a row, stop and alert instead of looping forever
    stop_exit_codes: [1]
  }]
}
