/**
 * The money model: what a transaction is, the categories it can sit in, and the arithmetic
 * every screen shares. Pure functions only — no React, no storage — so the totals the
 * dashboard shows and the totals the budgets screen shows cannot drift apart.
 *
 * Amounts are whole paise (₹1 = 100). Floating-point rupees turn ₹0.10 + ₹0.20 into
 * ₹0.30000000000000004, and a budget app that is off by a paisa is a budget app nobody trusts.
 */
import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

export type Kind = 'expense' | 'income';

export type Transaction = {
  id: string;
  kind: Kind;
  /** Whole paise, always positive; `kind` carries the sign. */
  amount: number;
  category: string;
  note: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  createdAt: number;
};

/** Monthly limit per expense category, in paise. A missing key means no budget. */
export type Budgets = Record<string, number>;

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export type Category = {
  id: string;
  kind: Kind;
  label: string;
  icon: IconName;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: 'food', kind: 'expense', label: 'Food & Dining', icon: 'restaurant', color: '#f97316' },
  { id: 'groceries', kind: 'expense', label: 'Groceries', icon: 'local-grocery-store', color: '#65a30d' },
  { id: 'transport', kind: 'expense', label: 'Transport', icon: 'directions-car', color: '#3b82f6' },
  { id: 'shopping', kind: 'expense', label: 'Shopping', icon: 'shopping-bag', color: '#ec4899' },
  { id: 'bills', kind: 'expense', label: 'Bills & Utilities', icon: 'receipt', color: '#8b5cf6' },
  { id: 'rent', kind: 'expense', label: 'Rent', icon: 'home', color: '#0ea5e9' },
  { id: 'health', kind: 'expense', label: 'Health', icon: 'local-hospital', color: '#ef4444' },
  { id: 'entertainment', kind: 'expense', label: 'Entertainment', icon: 'movie', color: '#f59e0b' },
  { id: 'education', kind: 'expense', label: 'Education', icon: 'school', color: '#14b8a6' },
  { id: 'other', kind: 'expense', label: 'Other', icon: 'more-horiz', color: '#64748b' },
  { id: 'salary', kind: 'income', label: 'Salary', icon: 'work', color: '#059669' },
  { id: 'business', kind: 'income', label: 'Business', icon: 'storefront', color: '#0d9488' },
  { id: 'gift', kind: 'income', label: 'Gifts', icon: 'card-giftcard', color: '#16a34a' },
  { id: 'other-income', kind: 'income', label: 'Other income', icon: 'attach-money', color: '#4d7c0f' },
];

const FALLBACK: Category = { id: 'other', kind: 'expense', label: 'Other', icon: 'more-horiz', color: '#64748b' };

export function categoryOf(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? FALLBACK;
}

export function categoriesFor(kind: Kind): Category[] {
  return CATEGORIES.filter((c) => c.kind === kind);
}

// ── money formatting and parsing ────────────────────────────────────────────────

const whole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const exact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,23,456 — paise are shown only when there are some. */
export function formatMoney(paise: number): string {
  const rupees = paise / 100;
  return paise % 100 === 0 ? whole.format(rupees) : exact.format(rupees);
}

/** ₹1.2L / ₹45K — for chart labels where a full figure will not fit. */
export function formatCompact(paise: number): string {
  const r = Math.abs(paise) / 100;
  const sign = paise < 0 ? '-' : '';
  if (r >= 1e7) return `${sign}₹${trim(r / 1e7)}Cr`;
  if (r >= 1e5) return `${sign}₹${trim(r / 1e5)}L`;
  if (r >= 1e3) return `${sign}₹${trim(r / 1e3)}K`;
  return `${sign}₹${Math.round(r)}`;
}

function trim(n: number): string {
  return n >= 10 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, '');
}

/**
 * Text from an amount field to paise, or null when it is not a usable amount.
 * Accepts "1,250", "1250.5" and "₹ 99"; rejects zero, negatives and a third decimal.
 */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [r, p = ''] = cleaned.split('.');
  const paise = Number(r) * 100 + Number(p.padEnd(2, '0'));
  return paise > 0 && Number.isSafeInteger(paise) ? paise : null;
}

/** Paise back to what the amount field should show when editing: "1250.5" → "1250.50". */
export function amountToInput(paise: number): string {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

// ── dates ───────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** A Date as the local `YYYY-MM-DD` — never `toISOString`, which is UTC and shifts IST evenings to tomorrow. */
export function toDay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): string {
  return toDay(new Date());
}

export function addDays(day: string, n: number): string {
  const d = fromDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

/** `YYYY-MM` of a day. */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

export function currentMonth(): string {
  return monthOf(today());
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function shortMonthLabel(month: string): string {
  return SHORT_MONTHS[Number(month.slice(5, 7)) - 1];
}

/** "Today", "Yesterday", or "Mon, 6 Oct". */
export function dayLabel(day: string): string {
  const t = today();
  if (day === t) return 'Today';
  if (day === addDays(t, -1)) return 'Yesterday';
  const d = fromDay(day);
  const label = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
  return d.getFullYear() === fromDay(t).getFullYear() ? label : `${label} ${d.getFullYear()}`;
}

// ── totals ──────────────────────────────────────────────────────────────────────

export function inMonth(list: Transaction[], month: string): Transaction[] {
  return list.filter((t) => monthOf(t.date) === month);
}

export type Totals = { income: number; expense: number; net: number };

export function totals(list: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of list) {
    if (t.kind === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

export type CategorySpend = { category: Category; amount: number; share: number };

/** Spending per category for the given transactions, largest first, with each one's share of the total. */
export function spendByCategory(list: Transaction[]): CategorySpend[] {
  const sums = new Map<string, number>();
  for (const t of list) {
    if (t.kind !== 'expense') continue;
    sums.set(t.category, (sums.get(t.category) ?? 0) + t.amount);
  }
  const total = [...sums.values()].reduce((a, b) => a + b, 0);
  return [...sums.entries()]
    .map(([id, amount]) => ({ category: categoryOf(id), amount, share: total ? amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Income and spending for each of the `count` months ending at `month`, oldest first. */
export function monthlyTrend(list: Transaction[], month: string, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const m = addMonths(month, i - count + 1);
    return { month: m, ...totals(inMonth(list, m)) };
  });
}

/** Newest day first; within a day, the most recently entered first. */
export function sortNewest(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
