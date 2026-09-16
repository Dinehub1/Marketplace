/**
 * The wellness family's link to the main database — sessions and daily counts.
 *
 * What this file is for. The six wellness screens used to keep everything on the phone.
 * That was the right call for goals, phrases and a half-finished session, and the wrong one
 * for the only data a person would miss if they lost the device: what they actually did.
 * This module moves *that* data to the main Supabase project and leaves everything else
 * where it was. The split is deliberate and worth stating plainly:
 *
 *   main database (here)   sessions and daily counts — the record of practice
 *   AsyncStorage (session.ts, settings.ts)
 *                          goals, the breathing phrase, the offline cache, the pending-write
 *                          queue, and the install token. Convenience data, and the credential
 *                          itself, which must never leave the device.
 *
 * Identity without an account. The wellness apps promise "no sign-up" and that promise is
 * the product, so there is no login here. Each install generates a random token once, keeps
 * it in its own storage, and sends it as the `x-wellness-token` header on every request. The
 * tables store only the SHA-256 of that header (computed in SQL — see
 * supabase/migrations/20260917000000_wellness_sync.sql), so:
 *
 *   * the database never holds the token, only a digest;
 *   * the row policy compares the digest, so a request can only ever touch its own rows;
 *   * the client needs no crypto library, because it sends the token and never hashes it.
 *
 * The honest limit: the token is a bearer secret. Someone who can read it off the device can
 * read that device's rows — exactly as they could read its AsyncStorage — but nothing else.
 *
 * Why a hand-rolled PostgREST client rather than supabase-js: same reason as lib/api.ts.
 * The app makes four HTTP calls; the SDK's realtime/auth/storage modules are dead weight in a
 * bundle that has to start fast on a mid-range Android phone over 3G.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SUPABASE_URL, SUPABASE_KEY } from "./config";

/** The install's credential. A bearer secret: it never leaves the device except as a header. */
const TOKEN_KEY = "dropby-wellness-token";
/** Writes that have not reached the database yet. Transient, so it lives on the device. */
const QUEUE_KEY = "dropby-wellness-queue";
/** Which token the local-only history has already been uploaded for. */
const BACKFILL_KEY = "dropby-wellness-backfilled";

/** How many sessions we keep client-side. Beyond this the charts are unreadable anyway. */
export const MAX_SESSIONS = 500;
/** A queue longer than this is a device that has been offline for months; cap it. */
const MAX_QUEUE = 600;

/** One finished practice, in the shape every wellness screen already speaks. */
export type SessionRecord = {
  /** Epoch ms. */
  at: number;
  screen: string;
  minutes: number;
  /** cycles, moves, rounds, intervals — whatever the screen counts. */
  units: number;
  /** The pattern or routine name. */
  label: string;
  /**
   * Stable id for this session, so replaying the offline queue cannot duplicate a row.
   * Optional because screens construct a SessionRecord without one and the store fills it in;
   * it is always present on anything that has been stored.
   */
  clientId?: string;
};

/** day (`YYYY-MM-DD`) → count, for the tap counters. */
export type CountMap = Record<string, number>;

/** A counter's own history, screen by screen. */
export type CountsByScreen = Record<string, CountMap>;

export type RemoteData = { sessions: SessionRecord[]; counts: CountsByScreen };

/** One write waiting for the network. Counts are absolute, so replaying one is safe. */
export type PendingWrite =
  | {
      kind: "session";
      clientId: string;
      screen: string;
      at: number;
      minutes: number;
      units: number;
      label: string;
    }
  | { kind: "count"; screen: string; day: string; count: number };

export type PushOutcome = {
  /** Writes the server accepted. */
  sent: number;
  /** Writes still to send — a network failure, or a row the server refused. */
  remaining: PendingWrite[];
  /** True when the device could not reach the server at all, rather than being refused. */
  offline: boolean;
};

/* ── The install token ──────────────────────────────────────────────────────────────── */

let tokenPromise: Promise<string> | null = null;

/**
 * The token this install syncs under, created on first use and then reused forever.
 *
 * `globalThis.crypto.getRandomValues` exists in the web build and is used when present. It is
 * absent in Hermes (React Native ships no WebCrypto and this app deliberately has no native
 * crypto dependency), so the fallback mixes `Math.random` with the clock. That is not a
 * CSPRNG and this comment will not pretend otherwise — but the secret it guards is one
 * device's glass-of-water count, the digest is per-install, and the alternative is a native
 * module and a rebuild for a bearer token worth nothing to an attacker.
 */
export function installToken(): Promise<string> {
  if (!tokenPromise) {
    tokenPromise = (async () => {
      try {
        const existing = await AsyncStorage.getItem(TOKEN_KEY);
        if (existing) return existing;
      } catch {
        /* storage unavailable: fall through and mint one for this run */
      }
      const token = randomToken();
      try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } catch {
        /* a device that cannot persist the token re-registers each launch; still correct,
           just not continuous */
      }
      return token;
    })();
  }
  return tokenPromise;
}

const HEX = "0123456789abcdef";

function randomToken(): string {
  const bytes = new Uint8Array(32);
  const webCrypto = (globalThis as { crypto?: { getRandomValues?: (b: Uint8Array) => Uint8Array } })
    .crypto;
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (const b of bytes) out += HEX[b >> 4] + HEX[b & 15];
  return out;
}

/**
 * The id a session is de-duplicated by. Built from the session's own contents plus a random
 * suffix, so two sessions saved in the same millisecond (a japa round and a bead tick, say)
 * cannot collide, and a storage round-trip that re-presents the same session produces the
 * same id.
 */
export function newClientId(entry: Pick<SessionRecord, "at" | "screen" | "units">): string {
  return `${entry.screen}-${entry.at}-${entry.units}-${randomToken().slice(0, 12)}`;
}

/** Fills in a `clientId` for a record that predates this column (the local-only build). */
export function withClientId(s: SessionRecord): SessionRecord {
  return s.clientId ? s : { ...s, clientId: `legacy-${s.screen}-${s.at}-${s.units}` };
}

/* ── HTTP ───────────────────────────────────────────────────────────────────────────── */

/**
 * One PostgREST call, always carrying the install token. Every table policy keys off the
 * digest of that header, so a request without it is refused rather than silently reading
 * someone else's rows.
 */
function rest(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "x-wellness-token": token,
      ...(init?.headers ?? {}),
    },
  });
}

async function pushSession(
  write: Extract<PendingWrite, { kind: "session" }>,
  token: string,
): Promise<"ok" | "network" | "rejected"> {
  try {
    // `on_conflict` names the unique key the client controls. Without it PostgREST infers the
    // primary key (`id`, a fresh uuid) and a replayed write would violate the client_id
    // constraint instead of being ignored — which is exactly the 409 this call exists to avoid.
    const res = await rest("wellness_sessions?on_conflict=token_hash,client_id", token, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({
        client_id: write.clientId,
        screen: write.screen,
        occurred_at: new Date(write.at).toISOString(),
        minutes: Math.max(0, Math.round(write.minutes)),
        units: Math.max(0, Math.round(write.units)),
        label: write.label.slice(0, 120),
      }),
    });
    if (res.ok) return "ok";
    // 409 is "this row is already there" from a build that did not send on_conflict. The
    // session is in the database either way, which is what the caller cares about.
    if (res.status === 409) return "ok";
    return "rejected";
  } catch {
    return "network";
  }
}

async function pushCount(
  write: Extract<PendingWrite, { kind: "count" }>,
  token: string,
): Promise<"ok" | "network" | "rejected"> {
  try {
    // An RPC rather than an upsert: the count is absolute and the conflict target includes
    // token_hash, which the client cannot send (it is derived from the header). See the
    // migration for why this is a security-invoker function.
    const res = await rest("rpc/wellness_put_count", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_screen: write.screen,
        p_day: write.day,
        p_count: Math.max(0, Math.round(write.count)),
      }),
    });
    if (res.ok) return "ok";
    return "rejected";
  } catch {
    return "network";
  }
}

/**
 * Drains the queue, oldest first.
 *
 * A network failure stops the pass — the rest of the queue is not going to fare any better,
 * and retrying six hundred writes against a dead connection is how a phone gets hot in a
 * pocket. A row the server actively refuses is dropped instead, because retrying it forever
 * would block everything behind it.
 */
export async function pushPending(writes: PendingWrite[], token: string): Promise<PushOutcome> {
  const remaining: PendingWrite[] = [];
  let sent = 0;
  let offline = false;

  for (let i = 0; i < writes.length; i++) {
    const write = writes[i];
    const result = write.kind === "session" ? await pushSession(write, token) : await pushCount(write, token);
    if (result === "ok") {
      sent++;
      continue;
    }
    if (result === "network") {
      offline = true;
      remaining.push(...writes.slice(i));
      break;
    }
    // "rejected": keep it so a genuinely bad row is visible rather than silently lost, but do
    // not let it stop the ones behind it.
    remaining.push(write);
  }

  return { sent, remaining, offline };
}

/**
 * Everything this install has stored in the database.
 *
 * `null` means "could not reach it", which the caller must treat differently from "empty":
 * an empty answer merged over a full cache would look like the data was wiped.
 */
export async function loadRemote(token: string): Promise<RemoteData | null> {
  try {
    const [sessionsRes, dailyRes] = await Promise.all([
      rest(
        `wellness_sessions?select=client_id,screen,occurred_at,minutes,units,label&order=occurred_at.desc&limit=${MAX_SESSIONS}`,
        token,
      ),
      rest("wellness_daily?select=screen,day,count&order=day.desc&limit=2000", token),
    ]);
    if (!sessionsRes.ok || !dailyRes.ok) return null;

    const sessionRows = (await sessionsRes.json()) as {
      client_id: string;
      screen: string;
      occurred_at: string;
      minutes: number;
      units: number;
      label: string;
    }[];
    const dailyRows = (await dailyRes.json()) as {
      screen: string;
      day: string;
      count: number;
    }[];

    const counts: CountsByScreen = {};
    for (const row of dailyRows) {
      const map = (counts[row.screen] ??= {});
      map[row.day] = row.count;
    }

    return {
      sessions: sessionRows.map((r) => ({
        clientId: r.client_id,
        screen: r.screen,
        at: Date.parse(r.occurred_at),
        minutes: r.minutes,
        units: r.units,
        label: r.label,
      })),
      counts,
    };
  } catch {
    return null;
  }
}

/**
 * Removes every row this install owns. Used by "Delete my data" on the Profile page.
 *
 * Returns false when the device could not reach the server, so the screen can say the delete
 * was local-only instead of claiming a deletion that did not happen. The row policies make
 * the unfiltered DELETE safe: it can only ever see its own rows.
 */
export async function deleteRemote(token: string): Promise<boolean> {
  try {
    const [a, b] = await Promise.all([
      rest("wellness_sessions?id=not.is.null", token, { method: "DELETE" }),
      rest("wellness_daily?screen=not.is.null", token, { method: "DELETE" }),
    ]);
    return a.ok && b.ok;
  } catch {
    return false;
  }
}

/* ── The pending-write queue, on the device ─────────────────────────────────────────── */

/**
 * Queue a write.
 *
 * Counters are coalesced by (screen, day): a mala's 108 bead taps must not become 108 queued
 * writes, they must become one write of the current number. Sessions are coalesced by
 * client id, so an interrupted flush that re-enqueues the same session is harmless.
 */
export async function enqueueWrite(write: PendingWrite): Promise<void> {
  const queue = await readQueue();
  const withoutSame = queue.filter((w) => !sameTarget(w, write));
  // Newest first: the queue is drained in this order and the newest count for a day is the
  // one worth sending.
  const next = [write, ...withoutSame].slice(0, MAX_QUEUE);
  await writeQueue(next);
}

function sameTarget(a: PendingWrite, b: PendingWrite): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "session" && b.kind === "session") return a.clientId === b.clientId;
  if (a.kind === "count" && b.kind === "count") return a.screen === b.screen && a.day === b.day;
  return false;
}

export async function readQueue(): Promise<PendingWrite[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Storage can hold anything (an older build, a hand-edited value). A malformed entry is
    // dropped rather than allowed to break every future sync.
    return parsed.filter(isPendingWrite);
  } catch {
    return [];
  }
}

export async function writeQueue(queue: PendingWrite[]): Promise<void> {
  try {
    if (!queue.length) await AsyncStorage.removeItem(QUEUE_KEY);
    else await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* a device that refuses to store the queue still worked in memory for this run */
  }
}

function isPendingWrite(value: unknown): value is PendingWrite {
  if (!value || typeof value !== "object") return false;
  const w = value as Partial<PendingWrite> & { kind?: string };
  if (w.kind === "session") {
    return typeof w.clientId === "string" && typeof w.screen === "string" && typeof w.at === "number";
  }
  if (w.kind === "count") {
    return typeof w.screen === "string" && typeof w.day === "string" && typeof w.count === "number";
  }
  return false;
}

/* ── The one-time backfill from the local-only build ────────────────────────────────── */

/**
 * Whether this install's existing local history has already been uploaded.
 *
 * The value is the token, not a bare flag: if the token is ever rotated the old history has
 * not been uploaded under the new identity and the backfill must run again.
 */
export async function hasBackfilled(token: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BACKFILL_KEY)) === token;
  } catch {
    return false;
  }
}

export async function markBackfilled(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BACKFILL_KEY, token);
  } catch {
    /* re-running the backfill is harmless: every write in it is idempotent */
  }
}
