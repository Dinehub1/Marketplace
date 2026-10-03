#!/usr/bin/env node
/**
 * scripts/backfill-supabase-place-ids.mjs
 * 
 * Backfills missing `place_id`s in Supabase `businesses` table using the
 * newly synchronized master datasets.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..");

function loadEnvFile(relPath) {
  const fullPath = resolve(ROOT, relPath);
  if (!existsSync(fullPath)) return;
  try {
    const raw = readFileSync(fullPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match && process.env[match[1]] === undefined) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (err) {
    console.warn(`[Env] Failed to load ${relPath}: ${err.message}`);
  }
}

loadEnvFile(".env");
loadEnvFile("apps/web/.env");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const AUTH_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function normPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function normName(name) {
  if (!name) return "";
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function run() {
  console.log("Loading Place ID index from synced master CSV...");
  const csvContent = readFileSync(resolve(ROOT, "combined_indore_master.csv"), "utf8");
  const [header, ...rows] = parseCSV(csvContent);
  const col = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));

  const phoneMap = new Map();
  const nameMap = new Map();

  for (const r of rows) {
    const pid = (r[col["place_id"]] || "").trim();
    if (!pid) continue;
    const phone = normPhone(r[col["phone_number"]]);
    const name = normName(r[col["name"]]);
    if (phone) phoneMap.set(phone, pid);
    if (name.length > 2) nameMap.set(name, pid);
  }

  console.log(`Loaded index: ${phoneMap.size} phones, ${nameMap.size} names with Place IDs.`);

  // Paginate through businesses where place_id is null
  let updatedTotal = 0;
  let offset = 0;

  console.log("Scanning Supabase for businesses missing place_id...");
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?select=id,name,phone&place_id=is.null&limit=500&offset=${offset}`,
      { headers: AUTH_HEADERS }
    );
    if (!res.ok) break;
    const missingRows = await res.json();
    if (!missingRows || missingRows.length === 0) break;

    const updates = [];
    for (const r of missingRows) {
      const p = normPhone(r.phone);
      const n = normName(r.name);
      const matchedPid = (p && phoneMap.get(p)) || (n && nameMap.get(n));
      if (matchedPid) {
        updates.push({ id: r.id, place_id: matchedPid });
      }
    }

    if (updates.length > 0) {
      // Execute parallel updates
      await Promise.all(
        updates.map((u) =>
          fetch(`${SUPABASE_URL}/rest/v1/businesses?id=eq.${u.id}`, {
            method: "PATCH",
            headers: AUTH_HEADERS,
            body: JSON.stringify({ place_id: u.place_id }),
          })
        )
      );
      updatedTotal += updates.length;
      process.stdout.write(`✅ Updated ${updatedTotal} rows with Place IDs in Supabase...\r`);
    }

    offset += missingRows.length;
    if (missingRows.length < 500) break;
  }

  console.log(`\n🎉 Backfill complete! Total Supabase rows updated with Place IDs: ${updatedTotal}`);
}

run().catch(console.error);
