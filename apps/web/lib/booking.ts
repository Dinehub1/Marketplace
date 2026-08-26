// Server-side booking helpers for the car-service vertical (sarkarcars).
//
// Everything here runs on the server only — API routes import it; never a
// client component.
//
// TIME: slots are wall-clock times in the vendor's city (Indore), i.e. IST.
// The Node server may run anywhere, so no Date-local arithmetic is allowed
// anywhere near a slot. India has no DST and is fixed at UTC+05:30, which
// makes the conversion exact: an IST wall time maps to one UTC instant by
// appending the offset. All slot labels shown to users are the IST wall-clock
// strings computed here, not re-derived from a Date in some other zone.
import { db } from "./nextel";

export const BOOKING_TZ_OFFSET = "+05:30"; // IST, no DST

/** Statuses a customer-created booking can move through. */
export const ACTIVE_STATUSES = ["requested", "confirmed", "in_progress"] as const;

/** Bookings starting less than this far in the future are not bookable. */
const MIN_LEAD_MINUTES = 30;

/** How many days ahead the public booking strip shows. */
export const BOOKING_WINDOW_DAYS = 7;

export type VendorHoursRow = {
  business_id: number;
  day_of_week: number;
  open_time: string; // "09:00:00"
  close_time: string; // "19:00:00"
  slot_minutes: number;
  capacity: number;
};

export type Slot = {
  /** Exact UTC instant to store / POST back. */
  start: string;
  /** IST wall-clock label for display, e.g. "9:00 AM". */
  label: string;
  available: boolean;
};

/**
 * Calendar parts of an instant *as seen in Indore*. Never use the host's
 * local timezone for these — a UTC server would put "today" in the wrong day
 * between 19:30 and 23:59 IST.
 */
export function istParts(instant: Date): { y: number; m: number; d: number; dow: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(instant).map((p) => [p.type, p.value]));
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(String(parts.weekday));
  return { y, m, d, dow };
}

/** YYYY-MM-DD for an instant, in IST. */
export function istDateString(instant: Date): string {
  const { y, m, d } = istParts(instant);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** IST wall date string -> JS day-of-week (0=Sunday). */
export function istDayOfWeek(dateStr: string): number {
  // T12:00Z keeps this date-only arithmetic away from any DST edge; the
  // weekday of `YYYY-MM-DD` is timezone-independent anyway when read off the
  // calendar date itself.
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/** Convert an IST wall time on a wall date to the exact UTC instant. */
export function istWallToInstant(dateStr: string, hhmm: string): Date {
  return new Date(`${dateStr}T${hhmm.length === 5 ? `${hhmm}:00` : hhmm}${BOOKING_TZ_OFFSET}`);
}

function minutesToLabel(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

/**
 * Compute one day's slots for a vendor.
 *
 * Capacity model (deliberately simple for launch): every slot boundary admits
 * up to `capacity` concurrent bookings regardless of service duration. A 90
 * minute detailing job booked into a 60-minute slot grid simply starts on a
 * slot boundary; the workshop sequences its own bays. Overlap-aware bay
 * scheduling is a later problem — this model is explainable to vendors over
 * the phone, which matters more at launch than optimality.
 */
export function computeSlots(opts: {
  dateStr: string;
  hours: Pick<VendorHoursRow, "open_time" | "close_time" | "slot_minutes" | "capacity">;
  /** slot_start instants already booked, any status in ACTIVE_STATUSES. */
  taken: string[];
  now?: Date;
}): Slot[] {
  const now = opts.now ?? new Date();
  const minStart = now.getTime() + MIN_LEAD_MINUTES * 60_000;

  const parseHm = (t: string) => {
    const [h, m] = t.split(":");
    return Number(h) * 60 + Number(m);
  };
  const open = parseHm(opts.hours.open_time);
  const close = parseHm(opts.hours.close_time);
  const step = Math.max(15, opts.hours.slot_minutes);

  // Count bookings PER SLOT INSTANT — deliberately not a Set: collapsing
  // duplicates would hide how full a slot already is and break capacity.
  const counts = new Map<number, number>();
  for (const iso of opts.taken) {
    const t = istWallToInstant(opts.dateStr, istHhmm(iso)).getTime();
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  const slots: Slot[] = [];
  for (let mins = open; mins + step <= close; mins += step) {
    const instant = istWallToInstant(opts.dateStr, minutesToHhmm(mins));
    const used = counts.get(instant.getTime()) ?? 0;
    slots.push({
      start: instant.toISOString(),
      label: minutesToLabel(mins),
      available: instant.getTime() >= minStart && used < opts.hours.capacity,
    });
  }
  return slots;
}

/** HH:MM(+ss) part of an ISO timestamp, rendered in IST. */
function istHhmm(iso: string): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(new Date(iso));
}

function minutesToHhmm(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/**
 * Money split for a booking, frozen at creation time.
 * `bps` = basis points, e.g. 1500 = 15%. Whole rupees; the odd rupee goes to
 * the vendor (Math.round favours neither side systematically, but payout is
 * what a vendor checks, so rounding the platform's cut to the nearest rupee
 * and giving the remainder to payout avoids "where did my ₹1 go" calls).
 */
export function commissionSplit(amountInr: number, bps: number): {
  amount: number;
  commission_bps: number;
  commission_amount: number;
  vendor_payout: number;
} {
  const amount = Math.round(amountInr);
  const commission_amount = Math.round((amount * bps) / 10_000);
  return {
    amount,
    commission_bps: bps,
    commission_amount,
    vendor_payout: amount - commission_amount,
  };
}

/** Human-facing short reference derived from the booking id. */
export function bookingRef(id: string): string {
  return `SC-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/**
 * Load a vendor's weekly hours keyed by day-of-week. Vendors with no hours
 * configured fall back to the DEFAULT_HOURS template below so a freshly
 * enrolled shop is bookable immediately (they can change it later); callers
 * pass fallback=false to distinguish "never configured" from real rows.
 */
export const DEFAULT_HOURS = {
  weekdays: { open_time: "09:00:00", close_time: "19:00:00", slot_minutes: 60, capacity: 1 },
};

export async function loadVendorHours(businessId: number): Promise<Map<number, VendorHoursRow>> {
  const res = await db(`vendor_hours?business_id=eq.${businessId}&select=*`);
  const map = new Map<number, VendorHoursRow>();
  if (res.ok) {
    for (const row of ((await res.json()) as VendorHoursRow[]) ?? []) map.set(row.day_of_week, row);
  }
  return map;
}

/**
 * Fetch active bookings for a vendor on an IST wall-date, returning just their
 * slot_start instants.
 */
export async function loadTakenSlots(businessId: number, dateStr: string): Promise<string[]> {
  const dayStart = istWallToInstant(dateStr, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);
  const res = await db(
    `bookings?business_id=eq.${businessId}` +
      `&slot_start=gte.${dayStart.toISOString()}&slot_start=lt.${dayEnd.toISOString()}` +
      `&status=in.(${ACTIVE_STATUSES.join(",")})&select=slot_start`,
  );
  if (!res.ok) return [];
  return (((await res.json()) as { slot_start: string }[]) ?? []).map((r) => r.slot_start);
}

/**
 * Businesses owned by an OTP-verified phone — same ownership proof the leads
 * dashboard uses: the listing's stored phone ends with the verified 10-digit
 * number. Returns id + display fields for every matching business.
 */
export async function loadOwnedBusinesses(phone: string): Promise<
  { id: number; name: string }[]
> {
  const last10 = phone.slice(-10);
  const res = await db(`businesses?phone=like.*${last10}&select=id,name`);
  if (!res.ok) return [];
  return ((await res.json()) as { id: number; name: string }[]) ?? [];
}

/** Allowed booking status transitions for a vendor-driven lifecycle. */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled", "no_show"],
  // Terminal states accept no further moves through this endpoint.
  completed: [],
  cancelled: [],
  no_show: [],
};
