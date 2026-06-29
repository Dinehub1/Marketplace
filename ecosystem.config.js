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
    max_memory_restart: '1024M',
    node_args: ['--max-old-space-size=768'],
    env: {
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1'
    },
    max_restarts: 10,
    restart_delay: 3000
  }]
};
