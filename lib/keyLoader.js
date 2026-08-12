// keyLoader.js – resolve the Supabase service-role key for server-side code.
//
// Order: the repo's own .env file first, then process.env.
//
// The file wins on purpose. This used to readFileSync the absolute path
// C:/Users/Administrator/hermes-web/.env precisely because a stale
// SUPABASE_SERVICE_ROLE_KEY in the scraper VM's system environment was shadowing
// the real one — so checking process.env first would quietly reintroduce that
// bug on the one machine that runs the imports. On that VM the repo lives at
// C:\Users\Administrator\hermes-web, so the path below resolves to exactly the
// file the old code hardcoded.
//
// The absolute path itself was the problem: it threw ENOENT on every other host,
// taking /api/leads and /api/otp/* down with it. process.env is the fallback for
// hosts that inject secrets without a file.
const fs = require('fs');
const path = require('path');

const VAR = 'SUPABASE_SERVICE_ROLE_KEY';
let cached = null;

// Order matters: strip CR and surrounding whitespace *before* the quotes, or a
// value written as "eyJ..."\r keeps its closing quote.
function clean(value) {
  return (value ?? '')
    .replace(/\r/g, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

function fromEnvFile() {
  // lib/ -> repo root
  const root = path.join(__dirname, '..');
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = fs.readFileSync(path.join(root, file), 'utf8');
      const line = raw
        .split(/\r?\n/)
        .find((l) => l && !l.startsWith('#') && l.startsWith(`${VAR}=`));
      if (line) {
        const found = clean(line.slice(VAR.length + 1));
        if (found) return found;
      }
    } catch {
      // file absent or unreadable — try the next one
    }
  }
  return '';
}

function loadKey() {
  if (cached) return cached;

  const key = fromEnvFile() || clean(process.env[VAR]);

  if (!key) {
    throw new Error(
      `${VAR} is not set. Add it to hermes-web/.env (or the host's environment). ` +
        `Get it from https://supabase.com/dashboard/project/_/settings/api-keys`,
    );
  }
  if (!key.startsWith('eyJ')) {
    throw new Error(`${VAR} does not look like a JWT (expected it to start with "eyJ").`);
  }

  cached = key;
  return cached;
}

module.exports = { loadKey };
