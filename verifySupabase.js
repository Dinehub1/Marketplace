// Connectivity check: can we reach Supabase with the service-role key?
//   node verifySupabase.js
const { loadKey } = require('./lib/keyLoader');

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';

(async () => {
  if (!SUPABASE_URL) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in the environment.');
    process.exit(1);
  }
  let KEY;
  try {
    KEY = loadKey();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=id&limit=1`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    console.log('status', res.status);
    if (res.status !== 200) console.log('body', await res.text());
  } catch (e) {
    console.error('error', e);
    process.exit(1);
  }
})();
