/**
 * AdMob Mediation Report → `ad_source_daily`: who won the auction, and what they paid.
 *
 * ## Why this exists
 *
 * AppLovin and InMobi bid inside the AdMob auction. The app sees the winning *price* of
 * each impression (the SDK's PAID event) but not the winning *network* — the React Native
 * library does not expose the ad source for full-screen formats. AdMob's mediation report
 * does, per ad source, per day, per country, and it is the number AdMob actually pays out
 * on. So per-network revenue is pulled from here, server-side, rather than reconstructed
 * on the phone.
 *
 * ## Credentials
 *
 * The AdMob API accepts only OAuth user credentials — there is no service-account access.
 * A one-time consent (Google Cloud OAuth client + the `admob.readonly` scope, e.g. via the
 * OAuth 2.0 Playground) yields a refresh token; the server exchanges it for a short-lived
 * access token on every run. Four environment variables, all required:
 *
 *   ADMOB_PUBLISHER_ID     pub-XXXXXXXXXXXXXXXX (also used for app-ads.txt)
 *   ADMOB_CLIENT_ID        OAuth client id
 *   ADMOB_CLIENT_SECRET    OAuth client secret
 *   ADMOB_REFRESH_TOKEN    refresh token for the AdMob account owner
 *
 * ## Why a rolling window
 *
 * Estimated earnings are revised for a few days after the fact, so each run re-pulls the
 * last N days and upserts on the natural key. Re-running is always safe.
 */
import { db } from "@/lib/nextel";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://admob.googleapis.com/v1";

const ENV_KEYS = ["ADMOB_PUBLISHER_ID", "ADMOB_CLIENT_ID", "ADMOB_CLIENT_SECRET", "ADMOB_REFRESH_TOKEN"] as const;

/** The env vars the sync needs that are not set. Empty means it can run. */
export function missingAdmobEnv(): string[] {
  return ENV_KEYS.filter((k) => !(process.env[k] ?? "").trim());
}

async function accessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ADMOB_CLIENT_ID!.trim(),
      client_secret: process.env.ADMOB_CLIENT_SECRET!.trim(),
      refresh_token: process.env.ADMOB_REFRESH_TOKEN!.trim(),
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`OAuth token exchange failed: ${body.error ?? res.status} ${body.error_description ?? ""}`.trim());
  }
  return body.access_token;
}

type Dim = { value?: string; displayLabel?: string };
type Metric = { integerValue?: string; microsValue?: string; doubleValue?: number };
type ReportChunk = {
  row?: { dimensionValues?: Record<string, Dim>; metricValues?: Record<string, Metric> };
};

export type AdSourceDailyRow = {
  day: string;
  app_id: string;
  app_name: string | null;
  platform: string;
  ad_source_id: string;
  ad_source_name: string | null;
  network: string;
  format: string;
  country: string;
  ad_requests: number | null;
  matched_requests: number | null;
  impressions: number | null;
  clicks: number | null;
  earnings_micros: number | null;
  currency: string;
};

/**
 * Our network id for an AdMob ad source label ("AdMob Network", "AppLovin (bidding)",
 * "InMobi (bidding)", …). The raw id and label are stored too, so a label AdMob renames
 * later can be re-mapped from the table without re-syncing.
 */
export function networkFor(label: string | undefined): string {
  const l = (label ?? "").toLowerCase();
  if (l.includes("applovin")) return "applovin";
  if (l.includes("inmobi")) return "inmobi";
  if (l.includes("admob") || l.includes("google")) return "admob";
  return "other";
}

const int = (m: Metric | undefined): number | null => {
  const v = m?.integerValue ?? m?.microsValue;
  if (v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** `20260927` → `2026-09-27`. */
const isoDay = (yyyymmdd: string): string =>
  `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;

const parts = (d: Date) => ({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });

/** Pull the mediation report for [start, end] (inclusive, UTC dates) as table rows. */
export async function fetchMediationReport(start: Date, end: Date): Promise<AdSourceDailyRow[]> {
  const token = await accessToken();
  const publisher = process.env.ADMOB_PUBLISHER_ID!.trim();
  const res = await fetch(`${API}/accounts/${encodeURIComponent(publisher)}/mediationReport:generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reportSpec: {
        dateRange: { startDate: parts(start), endDate: parts(end) },
        dimensions: ["DATE", "APP", "PLATFORM", "AD_SOURCE", "FORMAT", "COUNTRY"],
        metrics: ["AD_REQUESTS", "MATCHED_REQUESTS", "IMPRESSIONS", "CLICKS", "ESTIMATED_EARNINGS"],
        // AdMob pays out in USD; asking for it keeps every row in one currency.
        localizationSettings: { currencyCode: "USD" },
      },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 500);
    throw new Error(`AdMob mediation report failed (${res.status}): ${detail}`);
  }

  // The response is an array: one header, then rows, then one footer.
  const chunks = (await res.json()) as ReportChunk[];
  const rows: AdSourceDailyRow[] = [];
  for (const chunk of Array.isArray(chunks) ? chunks : []) {
    const d = chunk.row?.dimensionValues;
    const m = chunk.row?.metricValues;
    if (!d || !m || !d.DATE?.value || !d.APP?.value || !d.AD_SOURCE?.value) continue;
    rows.push({
      day: isoDay(d.DATE.value),
      app_id: d.APP.value,
      app_name: d.APP.displayLabel ?? null,
      platform: d.PLATFORM?.value ?? "UNKNOWN",
      ad_source_id: d.AD_SOURCE.value,
      ad_source_name: d.AD_SOURCE.displayLabel ?? null,
      network: networkFor(d.AD_SOURCE.displayLabel),
      format: d.FORMAT?.value ?? "UNKNOWN",
      country: d.COUNTRY?.value ?? "ZZ",
      ad_requests: int(m.AD_REQUESTS),
      matched_requests: int(m.MATCHED_REQUESTS),
      impressions: int(m.IMPRESSIONS),
      clicks: int(m.CLICKS),
      earnings_micros: int(m.ESTIMATED_EARNINGS),
      currency: "USD",
    });
  }
  return rows;
}

const UPSERT_BATCH = 500;

/** Upsert rows on the table's natural key. Returns how many were written. */
export async function upsertAdSourceDaily(rows: AdSourceDailyRow[]): Promise<number> {
  let written = 0;
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH).map((r) => ({ ...r, synced_at: new Date().toISOString() }));
    const res = await db("ad_source_daily?on_conflict=day,app_id,platform,ad_source_id,format,country", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new Error(`ad_source_daily upsert failed (${res.status}): ${detail}`);
    }
    written += batch.length;
  }
  return written;
}

/** Sync the last `days` days (today included). The one call the route makes. */
export async function syncAdSourceDaily(days: number): Promise<{ from: string; to: string; rows: number }> {
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const rows = await fetchMediationReport(start, end);
  const written = await upsertAdSourceDaily(rows);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), rows: written };
}
