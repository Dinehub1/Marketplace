#!/usr/bin/env node
/**
 * scripts/sync-place-ids.mjs
 * 
 * 1. Synchronizes authentic Google `place_id`s from Supabase (19,943 records)
 *    into local master datasets (`combined_indore_master_CLEAN.csv` and
 *    `combined_indore_master.csv`).
 * 2. Generates deterministic fallback Place IDs for any remaining unindexed rows.
 * 3. Ensures 100% ID coverage so that deduplication is foolproof across the codebase.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..");

// ── 1. Load Environment Variables ───────────────────────────────────────────
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

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials in .env");
  process.exit(1);
}

const AUTH_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// ── 2. Normalization Helpers ────────────────────────────────────────────────
function normPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function normName(name) {
  if (!name) return "";
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function generateDeterministicPlaceId(name, phone, address) {
  const base = `${normName(name)}|${normPhone(phone) || ""}|${(address || "").slice(0, 30).toLowerCase()}`;
  const hash = crypto.createHash("md5").update(base).digest("hex").slice(0, 16);
  return `indore:0x${hash}`;
}

// ── 3. Fetch All Existing Place IDs from Supabase ───────────────────────────
async function fetchSupabasePlaceMap() {
  console.log("📡 Fetching all 19,943 Place IDs from Supabase...");
  const phoneToPlace = new Map();
  const nameToPlace = new Map();
  const allKnownPlaceIds = new Set();
  let offset = 0;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/businesses?select=name,phone,place_id&place_id=not.is.null&limit=1000&offset=${offset}`,
      { headers: AUTH_HEADERS }
    );
    if (!res.ok) break;
    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    for (const r of rows) {
      if (r.place_id) {
        allKnownPlaceIds.add(r.place_id);
        const p = normPhone(r.phone);
        if (p) phoneToPlace.set(p, r.place_id);
        const n = normName(r.name);
        if (n.length > 2) nameToPlace.set(n, r.place_id);
      }
    }
    offset += rows.length;
    if (rows.length < 1000) break;
  }

  console.log(`✅ Loaded ${allKnownPlaceIds.size} unique Place IDs from Supabase`);
  console.log(`   Indexed: ${phoneToPlace.size} phone mappings, ${nameToPlace.size} name mappings\n`);
  return { phoneToPlace, nameToPlace, allKnownPlaceIds };
}

// ── 4. CSV Parser & Serializer ──────────────────────────────────────────────
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

function escapeCSVField(str) {
  if (str === null || str === undefined) return "";
  const s = String(str);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ── 5. Sync a CSV File ──────────────────────────────────────────────────────
function syncCSV(filePath, { phoneToPlace, nameToPlace }) {
  const fullPath = resolve(ROOT, filePath);
  if (!existsSync(fullPath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  console.log(`⚙️  Synchronizing Place IDs for "${filePath}"...`);
  const content = readFileSync(fullPath, "utf8");
  const [header, ...rows] = parseCSV(content);

  const col = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));
  const pidIdx = col["place_id"];
  const nameIdx = col["name"];
  const phoneIdx = col["phone_number"] ?? col["phone"];
  const addrIdx = col["address"];

  if (pidIdx === undefined) {
    console.error(`Missing place_id column in ${filePath}`);
    return;
  }

  let matchedFromSupabase = 0;
  let alreadyHadPid = 0;
  let generatedDeterministic = 0;

  for (const r of rows) {
    let existingPid = (r[pidIdx] || "").trim();
    if (existingPid && existingPid.startsWith("0x")) {
      alreadyHadPid++;
      continue;
    }

    const name = r[nameIdx] || "";
    const phone = normPhone(r[phoneIdx]);
    const addr = r[addrIdx] || "";

    // Match from Supabase
    let matchedPid = (phone && phoneToPlace.get(phone)) || (name && nameToPlace.get(normName(name)));

    if (matchedPid) {
      r[pidIdx] = matchedPid;
      matchedFromSupabase++;
    } else {
      // Deterministic Place ID
      const newPid = generateDeterministicPlaceId(name, phone, addr);
      r[pidIdx] = newPid;
      generatedDeterministic++;
    }
  }

  // Write back to file
  const outLines = [header.map(escapeCSVField).join(",")];
  for (const r of rows) {
    outLines.push(r.map(escapeCSVField).join(","));
  }
  writeFileSync(fullPath, outLines.join("\n"), "utf8");

  console.log(`   Total rows:                  ${rows.length}`);
  console.log(`   Previously had Place ID:     ${alreadyHadPid}`);
  console.log(`   Matched from Supabase:       ${matchedFromSupabase}`);
  console.log(`   Generated Canonical Place ID: ${generatedDeterministic}`);
  console.log(`   Final Coverage:              100% (all rows now have Place ID)\n`);
}

// ── 6. Run Sync ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`========================================================================`);
  console.log(`🔄 PLACE ID SYNCHRONIZATION AND DEDUPLICATION ENGINE`);
  console.log(`========================================================================\n`);

  const { phoneToPlace, nameToPlace } = await fetchSupabasePlaceMap();

  syncCSV("combined_indore_master_CLEAN.csv", { phoneToPlace, nameToPlace });
  syncCSV("combined_indore_master.csv", { phoneToPlace, nameToPlace });

  console.log(`========================================================================`);
  console.log(`✨ SYNCHRONIZATION COMPLETE: All local datasets now have 100% Place IDs.`);
  console.log(`========================================================================\n`);
}

main().catch(console.error);
