import AsyncStorage from "@react-native-async-storage/async-storage";
import { advanceCounter, type BillAdvance, type InvoiceCounter } from "@hermes/core";

/**
 * Bill numbers, remembered per shop **on the device**.
 *
 * The bill number used to be typed from memory on every bill, so two bills could
 * carry the same number — a tax problem for the shop, not a cosmetic one. This
 * keeps the highest number used per shop and offers the next one.
 *
 * It is device-local on purpose (AsyncStorage, not the account, not a Supabase
 * table): there is no `invoice_counters` table, and a counter labelled as the
 * shop's own when it is one phone's would be a lie on the screen. Every label
 * that shows one of these numbers says "on this phone". The *rules* (parse,
 * advance, suggest next) live in `@hermes/core` so the screen, this store and the
 * core test all read the same ones; only the storage is here.
 *
 * Stored shape, under one key so nothing needs migrating when a shop key changes:
 *   { "<shopKey>": { last, width, prefix } }
 */
const KEY = "hermes-invoice-counters";

/** Shops kept. Two shops need two counters; a phone that has billed for fifty is
 *  keeping more than any screen shows, so the oldest entries fall off. */
const MAX_SHOPS = 50;

type Counters = Record<string, InvoiceCounter>;

/** Storage can hold anything (an older build, a hand-edited value); a counter is
 *  only usable when its fields are the right shape, so a corrupt entry is treated
 *  as absent rather than crashing the screen the shopkeeper is billing from. */
function saneCounter(value: unknown): InvoiceCounter | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<InvoiceCounter>;
  const last =
    typeof v.last === "number" && Number.isFinite(v.last) && v.last > 0 ? Math.floor(v.last) : 0;
  if (!last) return null;
  const width =
    typeof v.width === "number" && Number.isFinite(v.width)
      ? Math.min(Math.max(Math.floor(v.width), 1), 9)
      : String(last).length;
  const prefix = typeof v.prefix === "string" ? v.prefix.slice(0, 12) : "";
  return { last, width, prefix };
}

async function loadAll(): Promise<Counters> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Counters = {};
    for (const [shop, value] of Object.entries(parsed)) {
      const c = saneCounter(value);
      if (c) out[shop] = c;
    }
    return out;
  } catch {
    // Unreadable or corrupt: start empty. The shop can still make a bill — the
    // number is typed by hand again — which beats a screen that will not open.
    return {};
  }
}

async function saveAll(counters: Counters): Promise<void> {
  const keys = Object.keys(counters);
  const kept: Counters = keys.length > MAX_SHOPS ? {} : counters;
  if (keys.length > MAX_SHOPS) {
    // Oldest first is the object insertion order, so drop from the front.
    for (const k of keys.slice(keys.length - MAX_SHOPS)) kept[k] = counters[k];
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(kept)).catch(() => {});
}

/** The counter for one shop, or null when this phone has never billed for it. */
export async function loadCounter(shopKey: string | null): Promise<InvoiceCounter | null> {
  if (!shopKey) return null;
  const all = await loadAll();
  return all[shopKey] ?? null;
}

/**
 * Record a made bill and return the counter afterwards.
 *
 * Forward only (see `advanceCounter`): re-printing an old number does not rewind
 * the series, and a number this cannot parse leaves the counter untouched.
 */
export async function recordBillNo(
  shopKey: string | null,
  billNo: string,
): Promise<BillAdvance & { saved: boolean }> {
  const empty: BillAdvance = {
    counter: { last: 0, width: 1, prefix: "" },
    moved: false,
    alreadyUsed: false,
    parsed: null,
  };
  if (!shopKey) return { ...empty, saved: false };
  const all = await loadAll();
  const advance = advanceCounter(all[shopKey] ?? null, billNo);
  if (advance.parsed) {
    await saveAll({ ...all, [shopKey]: advance.counter });
    return { ...advance, saved: true };
  }
  return { ...advance, saved: false };
}

/** Forget every counter. Only for tests and a user who wants to start over. */
export async function clearCounters(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}

/**
 * How many shops have a bill series on **this phone**.
 *
 * The dashboard asks this one question and gets one number, so the counters map stays
 * internal. Summing the counters would be the tempting version and it would be wrong: each
 * shop's `last` is its own series, so the sum is not "bills made", and a dashboard that
 * printed it would be inventing a figure the shop would then trust.
 */
export async function countersOnThisPhone(): Promise<number> {
  return Object.keys(await loadAll()).length;
}
