// Sync WhatsApp templates into Supabase `whatsapp_templates`.
//
// Nextel's V2 API only exposes `send_template` (POST) — there is NO
// list-templates endpoint, so we cannot enumerate templates programmatically.
// This script upserts a curated list:
//   1. SEED            – templates the app actually sends (e.g. "auth")
//   2. scripts/templates.json – any extra templates you copy from the
//      Nextel dashboard (array of { template_id, name, language, category,
//      status, body, variables, raw })
//
// Run AFTER applying supabase/migrations/20260813000001_whatsapp_templates.sql:
//   node scripts/sync-nextel-templates.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Templates the app sends today.
const SEED = [
  {
    template_id: "auth",
    name: "auth",
    language: "en",
    category: "AUTHENTICATION",
    status: "approved",
    body: "Your verification code is {{1}}.",
    variables: 1,
    raw: { type: "buttonTemplate", templateLanguage: "en" },
  },
];

let extra = [];
const jsonPath = path.resolve(__dirname, "templates.json");
if (fs.existsSync(jsonPath)) {
  try {
    extra = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (e) {
    console.warn("templates.json parse error:", e.message);
  }
}

const templates = [...SEED, ...extra];

(async () => {
  let synced = 0;
  for (const t of templates) {
    const row = {
      template_id: t.template_id,
      name: t.name ?? t.template_id,
      language: t.language ?? "en",
      category: t.category ?? null,
      status: t.status ?? null,
      body: t.body ?? null,
      variables: t.variables ?? 0,
      raw: t.raw ?? {},
      last_synced_at: new Date().toISOString(),
    };
    const res = await fetch(`${url}/rest/v1/whatsapp_templates?on_conflict=template_id,language`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(row),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`FAIL ${row.template_id}:`, res.status, text.slice(0, 200));
    } else {
      synced++;
      console.log(`OK   ${row.template_id} (${row.language})`);
    }
  }
  console.log(`\nSynced ${synced}/${templates.length} template(s) into whatsapp_templates.`);
})();
