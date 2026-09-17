import fs from "node:fs";
import path from "node:path";

/**
 * Resolve the Supabase service-role key for server-side code.
 *
 * Order: the app's own `.env` file first, then `process.env`.
 *
 * The file wins on purpose. This used to `readFileSync` the absolute path
 * `C:/Users/Administrator/hermes-web/.env` precisely because a stale
 * `SUPABASE_SERVICE_ROLE_KEY` in the scraper VM's system environment was shadowing the
 * real one — so checking `process.env` first would quietly reintroduce that bug on the
 * one machine that runs the imports.
 *
 * The absolute path itself was the problem: it threw ENOENT on every other host, taking
 * `/api/leads` and `/api/otp/*` down with it. The relative path below resolves to that
 * same file on the VM, and `process.env` is the fallback for hosts that inject secrets
 * without a file.
 *
 * This was a CommonJS `.js` module (`require`, `module.exports`) in an otherwise ESM
 * codebase; it is now TypeScript like the rest of `lib/`.
 */
const VAR = "SUPABASE_SERVICE_ROLE_KEY";
let cached: string | null = null;

/**
 * Strip CR and surrounding whitespace *before* the quotes, or a value written as
 * `"eyJ..."\r` keeps its closing quote.
 */
function clean(value: string | undefined | null): string {
  return (value ?? "")
    .replace(/\r/g, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function fromEnvFile(): string {
  // lib/ -> app root
  const root = path.join(__dirname, "..");
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = fs.readFileSync(path.join(root, file), "utf8");
      const line = raw
        .split(/\r?\n/)
        .find((l) => l && !l.startsWith("#") && l.startsWith(`${VAR}=`));
      if (line) {
        const found = clean(line.slice(VAR.length + 1));
        if (found) return found;
      }
    } catch {
      // file absent or unreadable — try the next one
    }
  }
  return "";
}

export function loadKey(): string {
  if (cached) return cached;

  const key = fromEnvFile() || clean(process.env[VAR]);

  if (!key) {
    throw new Error(
      `${VAR} is not set. Add it to apps/web/.env (or the host's environment). ` +
        `Get it from https://supabase.com/dashboard/project/_/settings/api-keys`,
    );
  }
  // Accept both the legacy JWT-format service key (eyJ…) and Supabase's current
  // sb_secret_… / sb_publishable_… format — both work as PostgREST auth headers.
  const looksValid = key.startsWith("eyJ") || /^sb_(secret|publishable)_/.test(key);
  if (!looksValid) {
    throw new Error(
      `${VAR} does not look like a Supabase key (expected "eyJ..." JWT or "sb_secret_..." format).`,
    );
  }

  cached = key;
  return cached;
}
