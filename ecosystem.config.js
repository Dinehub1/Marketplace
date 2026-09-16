const path = require('path');

// The Next app moved to apps/web when this became a workspace. pm2 must run
// `next start` from that directory — running it from the repo root finds no
// .next build and exits, which pm2 then restarts in a loop.
const repoRoot = path.resolve(__dirname);
const webRoot = path.join(repoRoot, 'apps', 'web');

module.exports = {
  apps: [{
    name: 'hermes-web',
    // npm hoists `next` to the workspace root; resolve it from there, not from
    // apps/web/node_modules, which may legitimately not exist.
    script: path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
    args: 'start -p 8080',
    cwd: webRoot,
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
  }, {
    // The product engine: the local half of every product that touches a file
    // (rembg, Pillow). It must outlive this shell — a worker started inside a
    // background job dies with the job, and the site then serves empty 200s that
    // look like a rendering bug.
    //
    // Bring just this one up without cycling the web app:
    //   pm2 start ecosystem.config.js --only dropby-worker
    name: 'dropby-worker',
    // System Python on purpose: rembg/Pillow are installed there, not in the
    // agent kernel's interpreter. This mirrors the way the live process was
    // started (`pm2 start <python.exe> --interpreter none -- worker.py ...`), so
    // a config-driven start is recognised as the same app instead of spawning a
    // duplicate named dropby-worker-1.
    script: process.env.PYTHON311 ?? 'C:/Program Files/Python311/python.exe',
    interpreter: 'none',
    args: `${path.join(repoRoot, 'services', 'tools', 'worker.py')} --port 8099`,
    cwd: repoRoot,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    // rembg keeps u2net (~350 MB) resident so the first job is not a 23 s model
    // load, so the ceiling is the model, not a leak.
    max_memory_restart: '1500M',
    max_restarts: 20,
    restart_delay: 5000,
    min_uptime: '30s',
  }]
}
