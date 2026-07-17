// keyLoader.js – load Supabase Service Role key directly from .env
// Bypasses process.env to avoid Windows env var shadowing or stray \r characters.
const fs = require('fs');
const path = require('path');

function loadKey() {
  const envPath = path.resolve('C:/Users/Administrator/hermes-web/.env');
  const raw = fs.readFileSync(envPath, { encoding: 'utf8' });
  // Split on CRLF or LF, ignore empty lines and comments
  const lines = raw.split(/\r?\n/).filter(l => l && !l.startsWith('#'));
  const kv = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='));
  if (!kv) throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in .env');
  let key = kv.split('=')[1] ?? '';
  // Strip surrounding quotes if present and any trailing \r
  key = key.replace(/^"|"$/g, '').replace(/\r$/, '').trim();
  if (!key.startsWith('eyJhbG')) {
    console.warn('Loaded key does not start with expected prefix');
  }
  if (key.length !== 219) {
    console.warn(`Loaded key length ${key.length} differs from expected 219`);
  }
  // Log length and last 5 chars (no full key)
  console.log(JSON.stringify({ length: key.length, suffix: key.slice(-5) }));
  return key;
}

module.exports = { loadKey };
