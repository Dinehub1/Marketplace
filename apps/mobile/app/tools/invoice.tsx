/**
 * Invoice & GST bill.
 *
 * A bill is a form you fill in front of a customer, so the screen is one column
 * in the order a bill reads: you, then them, then the items, then the tax. The
 * preview underneath is the same data rendered as the printed bill — there is no
 * separate "preview mode" to get out of, because the preview *is* the record.
 *
 * Every number on this screen comes from what was typed. Nothing is pre-filled
 * with a sample shop, and the totals are computed, not typed: qty × rate, half
 * the GST as CGST and half as SGST (the intra-state split), and the figure
 * written out in words in the Indian numbering system.
 *
 * The PDF is rendered by the same /api/job route every other tool uses, with the
 * invoice sent as JSON — there is no file to upload, so none is sent.
 *
 * The UPI id, when one is given, is printed on the bill as a scan-to-pay QR carrying
 * that total and the bill number. A malformed id prints no code at all — a QR that
 * pays the wrong person is worse than no QR.
 *
 * Tax is per item. A shop that sells 5% biscuits and 18% wire on one bill must print
 * both rates, so every line can carry its own rate and its own HSN/SAC code; a line
 * with neither follows the bill-level GST rate, which is what this screen did before
 * per-item rates existed. The split rows below the items are the same rows the PDF
 * prints, grouped the same way.
 *
 * The bill number counts itself. A number typed from memory two days running is how
 * a shop prints the same invoice twice, so the last number used per shop is kept
 * (per shop, on this phone — `lib/invoice-counter.ts`) and the next one is offered;
 * the field stays editable, the series only ever moves forward, and a number that
 * was already used says so before the PDF is made. Numbering is this screen's
 * business: the engine prints whatever number it is given.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { counterLabel, nextBillNo, parseBillNo, shopKeyOf, type InvoiceCounter } from "@hermes/core";
import { paletteFor } from "@hermes/tokens";
import { canDownloadFile, openPaywall, openResult, runJob, type JobResult } from "@/lib/tools";
import { loadCounter, recordBillNo } from "@/lib/invoice-counter";
import { useProductUI, type ProductUI } from "@/lib/product-ui";

/**
 * The bill preview is a *printed page*, so it is drawn as paper in both schemes:
 * a white sheet with dark ink, which is what the engine's PDF looks like and what
 * comes out of the printer. Everything around it — the page ground, the labels,
 * the chips, the inputs — follows the theme, which is what the gallery's light and
 * dark captures of this screen now differ in.
 */
const PAPER = paletteFor("light");

const GST_RATES = [0, 5, 12, 18];
/** The same shape the engine accepts (name@bank): a QR is only printed for a real
 *  UPI id, so the screen never sends something that would silently be dropped. */
const VPA = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}@[A-Za-z][A-Za-z0-9.]{1,63}$/;

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

type Item = { id: number; name: string; qty: string; rate: string; hsn: string; gstRate: number | null };
type TaxRow = { rate: number; taxable: number; gst: number; cgst: number; sgst: number };

/** 18 -> "18", 2.5 -> "2.5": the labels the PDF prints, so the preview matches it. */
const fmtRate = (r: number): string => r.toFixed(1).replace(/\.0$/, "");

/** Indian grouping (last three digits, then pairs) without depending on Intl. */
function money(n: number): string {
  const fixed = (Math.round(n * 100) / 100).toFixed(2);
  const [whole, dec] = fixed.split(".");
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  return `₹${rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3}.${dec}`;
}

/** Strict on purpose: a money field that quietly turns "-5" into 5 prints a
 *  wrong amount on a customer's bill. Unparseable or negative reads as 0, which
 *  the missing-fields guard then blocks from being exported at all. */
const num = (s: string): number => {
  const v = Number(s.replace(/,/g, "").trim());
  return Number.isFinite(v) && v > 0 ? v : 0;
};

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? `-${ONES[o]}` : ""}`;
}

/** Handles up to 99,99,99,999 — a shop bill never needs more, and a wrong
 *  "lakh/crore" here would be a wrong amount printed on a customer's bill. */
function inWords(n: number): string {
  if (n === 0) return "zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  n %= 100;
  if (crore) parts.push(`${twoDigits(crore)} crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} thousand`);
  if (hundred) parts.push(`${ONES[hundred]} hundred`);
  if (n) parts.push(parts.length ? `and ${twoDigits(n)}` : twoDigits(n));
  return parts.join(" ");
}

function rupeesInWords(amount: number): string {
  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);
  const head = whole === 0 ? "zero rupees" : `${inWords(whole)} rupees`;
  const tail = paise ? ` and ${twoDigits(paise)} paise` : "";
  const text = `${head}${tail} only`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export default function InvoiceMaker() {
  const ui = useProductUI("invoice-maker");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [shop, setShop] = useState("");
  const [gstin, setGstin] = useState("");
  const [upi, setUpi] = useState("");
  const [customer, setCustomer] = useState("");
  const [billNo, setBillNo] = useState("");
  const [date, setDate] = useState(today());
  const [gstRate, setGstRate] = useState(18);
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "", qty: "1", rate: "", hsn: "", gstRate: null }]);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(2);

  /** The bill numbers this phone has made for the shop currently typed. */
  const shopKey = useMemo(() => shopKeyOf(shop, gstin), [shop, gstin]);
  const [counter, setCounter] = useState<InvoiceCounter | null>(null);
  const [billNote, setBillNote] = useState<string | null>(null);
  /** The number that is on the PDF currently shown, which is what the download is
   *  named after (the field itself has already moved on to the next number). */
  const [madeAs, setMadeAs] = useState<string | null>(null);
  /** True once the user has typed their own number for this shop, so the counter
   *  never overwrites a number they chose. A ref, not state: it changes no output. */
  const billTyped = useRef(false);

  useEffect(() => {
    let live = true;
    setBillNote(null);
    if (!shopKey) {
      setCounter(null);
      return;
    }
    void loadCounter(shopKey).then((c) => {
      if (!live) return;
      setCounter(c);
      // Offer the next number only while the field is the app's, not the user's.
      if (!billTyped.current) setBillNo(nextBillNo(c));
    });
    return () => {
      live = false;
    };
  }, [shopKey]);

  const lines = useMemo(
    () =>
      items.map((it) => {
        const qty = num(it.qty);
        const rate = num(it.rate);
        return { ...it, qty, rate, amount: Math.round(qty * rate * 100) / 100 };
      }),
    [items],
  );

  const taxable = Math.round(lines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;

  /** Tax per rate group, computed the way the engine computes it: a 5% and an 18%
   *  line on one bill carry different amounts, and one blended figure would be wrong
   *  for both. A line without its own rate follows the bill-level rate. */
  const taxRows = useMemo<TaxRow[]>(() => {
    const groups = new Map<number, number>();
    for (const l of lines) {
      const r = l.gstRate === null ? gstRate : l.gstRate;
      groups.set(r, Math.round(((groups.get(r) ?? 0) + l.amount) * 100) / 100);
    }
    return [...groups.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([r, base]) => {
        const g = Math.round(base * r) / 100;
        const c = Math.round((g / 2) * 100) / 100;
        return { rate: r, taxable: base, gst: g, cgst: c, sgst: Math.round((g - c) * 100) / 100 };
      });
  }, [lines, gstRate]);

  const gst = Math.round(taxRows.reduce((sum, r) => sum + r.gst, 0) * 100) / 100;
  const cgst = Math.round(taxRows.reduce((sum, r) => sum + r.cgst, 0) * 100) / 100;
  const sgst = Math.round((gst - cgst) * 100) / 100;
  const total = Math.round((taxable + gst) * 100) / 100;

  const filledItems = lines.filter((l) => l.name.trim() && l.rate > 0);
  // What the bill will say about GST: one rate, or the list of rates the lines used.
  const ratesUsed = [...new Set(filledItems.map((l) => (l.gstRate === null ? gstRate : l.gstRate)))].sort((a, b) => a - b);
  const rateLabel = ratesUsed.length <= 1 ? `${fmtRate(ratesUsed[0] ?? gstRate)}%` : `${ratesUsed.map(fmtRate).join("/")}%`;
  const missing = !shop.trim()
    ? "Add your shop name — a bill without it is not a bill."
    : !customer.trim()
      ? "Add the customer's name."
      : filledItems.length === 0
        ? "Add at least one item with a name and a rate."
        : null;

  // A number this phone has already used is said here, before the PDF is made —
  // a warning after the fact is not a warning.
  const typedBillNo = billNo.trim();
  const parsedTyped = parseBillNo(typedBillNo);
  const reusing = !!(shopKey && counter && parsedTyped && parsedTyped.digits <= counter.last);
  const lastBill = counterLabel(counter);

  function setItem(id: number, patch: Partial<Item>) {
    setJob(null);
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function makePdf() {
    setError(null);
    setJob(null);
    setBillNote(null);
    setBusy(true);
    try {
      // Only the fields on this screen go over the wire — no template, no
      // sample data, nothing the user did not type.
      const invoice = {
        shop: shop.trim(),
        gstin: gstin.trim() || null,
        customer: customer.trim(),
        billNo: typedBillNo || null,
        date,
        gstRate,
        upi: VPA.test(upi.trim()) ? upi.trim() : null,
        items: filledItems.map((l) => ({
          name: l.name.trim(),
          qty: l.qty,
          rate: l.rate,
          amount: l.amount,
          hsn: l.hsn.trim() || null,
          gstRate: l.gstRate,
        })),
        totals: { taxable, gst, cgst, sgst, total, inWords: rupeesInWords(total) },
      };
      const result = await runJob({
        product: "invoice-maker",
        fields: { doc: "invoice", payload: JSON.stringify(invoice) },
      });
      setJob(result);
      if (!result.outputUrl && !result.previewUrl) {
        setError("The server finished without a PDF. Nothing was charged — try again.");
      } else if (shopKey && typedBillNo) {
        // The bill exists: remember its number so the next one follows it.
        setMadeAs(typedBillNo);
        const rec = await recordBillNo(shopKey, typedBillNo);
        setCounter(rec.counter);
        billTyped.current = false;
        setBillNo(nextBillNo(rec.counter));
        setBillNote(
          !rec.parsed
            ? `Bill “${typedBillNo}” is on the PDF. This phone cannot follow that series, so type the next number yourself.`
            : rec.moved
              ? `Bill ${typedBillNo} is on the PDF. The next bill from this shop is ${nextBillNo(rec.counter)} on this phone.`
              : `Bill ${typedBillNo} is on the PDF — it was already used on this phone, so it is a reprint. The counter stays at ${counterLabel(rec.counter)}.`,
        );
      }
    } catch (e: any) {
      setError(e?.message || "Could not make the PDF. Nothing was charged.");
    } finally {
      setBusy(false);
    }
  }

  // The clean PDF is behind the paywall (₹299/mo), so this is the watermarked
  // preview until an order is paid — never a "download" of the paid bill.
  const outputUrl = job?.locked ? job?.previewUrl ?? null : job?.outputUrl ?? job?.previewUrl ?? null;
  // The file is named after the number that is actually on the PDF. After a bill is
  // made the field moves on to the next number, so reading it here would name the
  // download after a bill that does not exist yet.
  const madeBillNo = job && madeAs ? madeAs : typedBillNo;
  const fileName = `invoice-${(madeBillNo || date).replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
  // The engine's own tax rows, when it returned them: the note under the result reports
  // the engine's arithmetic rather than a second copy of the screen's.
  const jobMeta = job?.meta ?? {};
  const metaTaxRows = Array.isArray(jobMeta.tax_rows) ? (jobMeta.tax_rows as TaxRow[]) : [];
  const hsnCount = Number(jobMeta.hsn_items ?? 0) || 0;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.badgeRow}>
        <Text style={s.badge}>GST BILL · PDF</Text>
        <Text style={s.price}>₹299/mo</Text>
      </View>

      <Text style={s.h1}>A proper bill,{"\n"}from your phone</Text>
      <Text style={s.sub}>
        Type the items once. The totals, the GST split and the amount in words are worked out
        as you go, and the same numbers go into the PDF.
      </Text>

      <Text style={s.section}>Your shop</Text>
      <Text style={s.label}>Shop name</Text>
      <TextInput
        value={shop}
        onChangeText={(t) => {
          setShop(t);
          setJob(null);
        }}
        placeholder="As it should print on the bill"
        placeholderTextColor={ui.faint}
        style={s.input}
      />
      <Text style={s.label}>GSTIN (optional)</Text>
      <TextInput
        value={gstin}
        onChangeText={setGstin}
        placeholder="15 characters, if you are registered"
        placeholderTextColor={ui.faint}
        autoCapitalize="characters"
        autoCorrect={false}
        style={s.input}
      />

      <Text style={s.label}>UPI id (optional)</Text>
      <TextInput
        value={upi}
        onChangeText={(t) => {
          setUpi(t);
          setJob(null);
        }}
        placeholder="yourname@bank"
        placeholderTextColor={ui.faint}
        autoCapitalize="none"
        autoCorrect={false}
        style={s.input}
      />
      <Text style={s.help}>
        Only if you want the bill to carry a scan-to-pay QR: it is printed with this total
        already filled in. Leave it empty for a plain bill.
      </Text>
      {upi.trim() && !VPA.test(upi.trim()) ? (
        <Text style={s.missing}>
          That is not a UPI id — it should look like yourname@bank. The bill is printed
          without a QR rather than with a wrong one.
        </Text>
      ) : null}

      <Text style={s.section}>Bill to</Text>
      <Text style={s.label}>Customer</Text>
      <TextInput
        value={customer}
        onChangeText={setCustomer}
        placeholder="Name or firm"
        placeholderTextColor={ui.faint}
        style={s.input}
      />
      <View style={s.twoUp}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Bill no. (optional)</Text>
          <TextInput
            value={billNo}
            onChangeText={(t) => {
              billTyped.current = true;
              setBillNo(t);
            }}
            placeholder="e.g. 014"
            placeholderTextColor={ui.faint}
            autoCapitalize="characters"
            style={s.input}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="DD-MM-YYYY"
            placeholderTextColor={ui.faint}
            style={s.input}
          />
        </View>
      </View>
      <Text style={s.help}>
        {!shopKey
          ? "The number counts itself once your shop name is in: this phone remembers the last number you used for each shop."
          : counter
            ? `Counted on this phone: the last bill for this shop was ${lastBill}, so the next one is offered above. Type over it if you number differently.`
            : "No bill has been made from this phone for this shop yet, so numbering starts at 1. Type over it if you number differently."}
      </Text>
      {reusing ? (
        <Text style={s.missing}>
          Bill {typedBillNo} was already used on this phone — the last one was {lastBill}. If this is a
          reprint that is fine; otherwise use {nextBillNo(counter)}.
        </Text>
      ) : null}
      {billNote ? <Text style={s.help}>{billNote}</Text> : null}

      <Text style={s.section}>Items</Text>
      {items.map((it) => (
        <View key={it.id} style={s.itemBlock}>
          <View style={s.itemRow}>
            <TextInput
              value={it.name}
              onChangeText={(t) => setItem(it.id, { name: t })}
              placeholder="What you sold"
              placeholderTextColor={ui.faint}
              style={[s.input, s.itemName]}
            />
            <TextInput
              value={it.qty}
              onChangeText={(t) => setItem(it.id, { qty: t })}
              placeholder="Qty"
              placeholderTextColor={ui.faint}
              keyboardType="decimal-pad"
              style={[s.input, s.itemQty]}
            />
            <TextInput
              value={it.rate}
              onChangeText={(t) => setItem(it.id, { rate: t })}
              placeholder="Rate"
              placeholderTextColor={ui.faint}
              keyboardType="decimal-pad"
              style={[s.input, s.itemRate]}
            />
            <Pressable
              onPress={() => {
                setItems((prev) => (prev.length === 1 ? prev : prev.filter((x) => x.id !== it.id)));
                setJob(null);
              }}
              disabled={items.length === 1}
              accessibilityRole="button"
              accessibilityLabel="Remove this item"
              style={[s.itemRemove, items.length === 1 && { opacity: 0.35 }]}
            >
              <Text style={s.itemRemoveText}>×</Text>
            </Pressable>
          </View>
          <View style={s.itemMeta}>
            {/* The field is 104 px wide (75 px of room inside it) and the placeholder is
              * measured against that, not guessed: "HSN (optional)" measures 81.6 px and is
              * cut off at 320, 360 and 390 px alike, "Code (optional)" is worse (85.7 px).
              * "HSN code" is 55.3 px. The word "optional" therefore lives in the help line
              * below, which is where it was already said. */}
            <TextInput
              value={it.hsn}
              onChangeText={(t) => setItem(it.id, { hsn: t })}
              placeholder="HSN code"
              placeholderTextColor={ui.faint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              style={[s.input, s.itemHsn]}
            />
            <View style={s.chipRow}>
              {[null, 0, 5, 12, 18].map((r) => (
                <Pressable
                  key={String(r)}
                  onPress={() => setItem(it.id, { gstRate: r })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: it.gstRate === r }}
                  style={[s.chip, it.gstRate === r && s.chipOn]}
                >
                  <Text style={[s.chipText, it.gstRate === r && { color: ui.accent }]}>
                    {r === null ? "Bill" : `${r}%`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ))}
      <Pressable
        style={s.secondary}
        onPress={() => {
          const id = nextId.current++;
          setItems((prev) => [...prev, { id, name: "", qty: "1", rate: "", hsn: "", gstRate: null }]);
        }}
        accessibilityRole="button"
      >
        <Text style={s.secondaryText}>+ Add another item</Text>
      </Pressable>
      <Text style={s.help}>
        HSN is the code a B2B bill wants on the line — it is optional, so leave it empty if you
        do not have one. The rate chips set that item&apos;s own GST: “Bill” follows the rate below,
        which is what every item does unless you change it.
      </Text>

      <Text style={s.section}>GST</Text>
      <View style={s.rateRow}>
        {GST_RATES.map((r) => (
          <Pressable
            key={r}
            onPress={() => {
              setGstRate(r);
              setJob(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: gstRate === r }}
            style={[s.rate, gstRate === r && s.rateOn]}
          >
            <Text style={[s.rateText, gstRate === r && { color: ui.accent }]}>{r}%</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.help}>
        The bill&apos;s GST rate: it applies to every item that does not carry its own rate.
        Split as CGST and SGST — the usual split for a sale inside your own state.
      </Text>

      <Text style={s.section}>The bill</Text>
      <View style={s.paper}>
        <View style={s.paperHead}>
          <Text style={s.paperShop}>{shop.trim() || "Your shop name"}</Text>
          <Text style={s.paperDoc}>TAX INVOICE</Text>
        </View>
        <Text style={s.paperMeta}>
          {gstin.trim() ? `GSTIN ${gstin.trim().toUpperCase()}` : "GSTIN not entered"}
        </Text>
        <Text style={s.paperMeta}>
          {billNo.trim() ? `Bill ${billNo.trim()}` : "No bill number"} · {date || "no date"}
        </Text>

        <View style={s.paperRule} />

        <Text style={s.paperLabel}>Bill to</Text>
        <Text style={s.paperCustomer}>{customer.trim() || "Customer name"}</Text>

        <View style={s.paperRule} />

        <View style={s.th}>
          <Text style={[s.thText, s.colName]}>Item</Text>
          <Text style={[s.thText, s.colQty]}>Qty</Text>
          <Text style={[s.thText, s.colRate]}>Rate</Text>
          <Text style={[s.thText, s.colAmt]}>Amount</Text>
        </View>
        {filledItems.length === 0 ? (
          <Text style={s.paperEmpty}>No items yet.</Text>
        ) : (
          filledItems.map((l) => (
            <View key={l.id} style={s.tr}>
              <View style={s.colName}>
                <Text style={s.td} numberOfLines={2}>{l.name.trim()}</Text>
                {l.hsn.trim() ? <Text style={s.tdHsn}>HSN {l.hsn.trim().toUpperCase()}</Text> : null}
              </View>
              <Text style={[s.td, s.colQty]}>{l.qty}</Text>
              <Text style={[s.td, s.colRate]}>{money(l.rate)}</Text>
              <Text style={[s.td, s.colAmt]}>{money(l.amount)}</Text>
            </View>
          ))
        )}

        <View style={s.paperRule} />

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Taxable value</Text>
          <Text style={s.totalValue}>{money(taxable)}</Text>
        </View>
        {taxRows.length <= 1
          ? (taxRows[0]?.rate ? (
              <>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>CGST {fmtRate(taxRows[0].rate / 2)}%</Text>
                  <Text style={s.totalValue}>{money(taxRows[0].cgst)}</Text>
                </View>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>SGST {fmtRate(taxRows[0].rate / 2)}%</Text>
                  <Text style={s.totalValue}>{money(taxRows[0].sgst)}</Text>
                </View>
              </>
            ) : null)
          : taxRows.map((r) => (
              <View key={r.rate}>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Taxable @ {fmtRate(r.rate)}%</Text>
                  <Text style={s.totalValue}>{money(r.taxable)}</Text>
                </View>
                {r.rate ? (
                  <>
                    <View style={s.totalRow}>
                      <Text style={s.totalLabel}>CGST @ {fmtRate(r.rate / 2)}%</Text>
                      <Text style={s.totalValue}>{money(r.cgst)}</Text>
                    </View>
                    <View style={s.totalRow}>
                      <Text style={s.totalLabel}>SGST @ {fmtRate(r.rate / 2)}%</Text>
                      <Text style={s.totalValue}>{money(r.sgst)}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            ))}
        <View style={[s.totalRow, s.grandRow]}>
          <Text style={s.grandLabel}>Total</Text>
          <Text style={s.grandValue}>{money(total)}</Text>
        </View>

        {total > 0 ? <Text style={s.paperWords}>{rupeesInWords(total)}</Text> : null}
        {VPA.test(upi.trim()) ? (
          <Text style={s.paperWords}>Pay by UPI · {upi.trim()} — the printed bill carries the QR</Text>
        ) : null}
      </View>

      {missing ? <Text style={s.missing}>{missing}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, (!!missing || busy) && s.dim]}
        onPress={makePdf}
        disabled={!!missing || busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!missing || busy }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Make the invoice PDF</Text>}
      </Pressable>

      {job?.locked && job.jobId ? (
        <View style={s.result}>
          <Pressable style={s.primary} onPress={() => void openPaywall(job.jobId!)} accessibilityRole="button">
            <Text style={s.primaryText}>
              Unlock the invoice PDF · ₹{Math.round((job.pricePaise || 29900) / 100)}/mo
            </Text>
          </Pressable>
          <Text style={s.hint}>
            The preview PDF is watermarked. The bill you unlock has no mark and prints on A4
            at full quality.
          </Text>
        </View>
      ) : null}

      {outputUrl ? (
        <View style={s.result}>
          <Text style={s.label}>The PDF</Text>
          <Pressable
            style={s.secondary}
            onPress={() => openResult(outputUrl, fileName)}
            accessibilityRole="button"
          >
            <Text style={s.secondaryText}>
              {canDownloadFile() ? `Download ${fileName}` : `Open ${fileName}`}
            </Text>
          </Pressable>
          <Text style={s.hint}>
            It carries exactly the {filledItems.length === 1 ? "one item" : `${filledItems.length} items`}{" "}
            above at {rateLabel} GST, and nothing else.
          </Text>
          {metaTaxRows.length > 1 ? (
            <Text style={s.hint}>
              The bill splits the tax by rate:{" "}
              {metaTaxRows.map((r) => `${fmtRate(r.rate)}% on ${money(Number(r.taxable))}`).join(" · ")}.
            </Text>
          ) : null}
          {hsnCount > 0 ? (
            <Text style={s.hint}>
              {hsnCount} line{hsnCount === 1 ? "" : "s"} carry an HSN code under the item name.
            </Text>
          ) : null}
          {String(jobMeta.upi_uri ?? "") ? (
            <Text style={s.hint}>
              {jobMeta.upi_qr
                ? `The QR on the bill pays ${String(jobMeta.upi)} the full ${money(total)}.`
                : `No QR on this bill: ${String(jobMeta.upi_note ?? "not printed")}.`}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={s.foot}>
        Build as many bills as you like on screen. This product is priced at ₹299/mo on the
        product plan; the payment rail is not connected in this build, so nothing is charged
        here yet.
      </Text>
    </ScrollView>
  );
}

function makeStyles(ui: ProductUI) {
  // The accent, the ink scale, the hairlines and the page ground come from the
  // palette, so dark mode is not a second code path. The bill preview is the one
  // deliberate exception and uses PAPER (see the note at the top of the file).
  const GREEN = ui.accent;
  const INK = ui.ink;
  const MUTED = ui.muted;
  const LINE = ui.hairline;
  const BG = ui.bg;
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  wrap: { padding: 22, paddingBottom: 48, maxWidth: 520, width: "100%", alignSelf: "center" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  badge: { color: GREEN, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  price: { color: INK, fontSize: 20, fontWeight: "800" },
  h1: { color: INK, fontSize: 32, fontWeight: "800", lineHeight: 37, marginBottom: 10 },
  sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 6 },
  section: { color: INK, fontSize: 15, fontWeight: "800", marginTop: 22, marginBottom: 10 },
  label: { color: INK, fontWeight: "700", fontSize: 12.5, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14.5,
    color: INK,
    backgroundColor: ui.surface,
  },
  twoUp: { flexDirection: "row", gap: 10 },
  itemBlock: { marginBottom: 14 },
  itemRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  itemMeta: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 6 },
  itemHsn: { width: 104, fontSize: 12.5, paddingVertical: 7 },
  chipRow: { flexDirection: "row", gap: 4, flex: 1 },
  chip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 9,
    paddingVertical: 6,
    alignItems: "center",
    backgroundColor: ui.surface,
  },
  chipOn: { borderColor: GREEN, backgroundColor: ui.accentTint },
  chipText: { color: MUTED, fontSize: 11.5, fontWeight: "700" },
  itemName: { flex: 1, minWidth: 90 },
  itemQty: { width: 54, textAlign: "center" },
  itemRate: { width: 78, textAlign: "right" },
  itemRemove: { width: 26, alignItems: "center", justifyContent: "center" },
  itemRemoveText: { color: ui.error, fontSize: 20, fontWeight: "700", lineHeight: 22 },
  secondary: {
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: ui.surface,
    marginTop: 4,
  },
  secondaryText: { color: GREEN, fontWeight: "700", fontSize: 13.5 },
  rateRow: { flexDirection: "row", gap: 8 },
  rate: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: ui.surface,
  },
  rateOn: { borderColor: GREEN, backgroundColor: ui.accentTint },
  rateText: { color: INK, fontWeight: "800", fontSize: 14 },
  help: { color: MUTED, fontSize: 11.5, marginTop: 8, lineHeight: 16 },
  // ── The bill itself: paper, in both schemes ───────────────────────────────
  // A bill preview that went dark-mode would stop being a preview of the thing
  // the engine prints and the shop hands over, and the ink would have to invert
  // with it. So these rows read from PAPER (the light palette) on purpose.
  paper: {
    backgroundColor: PAPER.surface,
    borderWidth: 1,
    borderColor: PAPER.hairline,
    borderRadius: 12,
    padding: 14,
  },
  paperHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  paperShop: { color: PAPER.ink, fontSize: 16, fontWeight: "800", flexShrink: 1 },
  paperDoc: { color: PAPER.ink2, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  paperMeta: { color: PAPER.ink2, fontSize: 11, marginTop: 3 },
  paperRule: { height: 1, backgroundColor: PAPER.hairline, marginVertical: 10 },
  paperLabel: { color: PAPER.ink2, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  paperCustomer: { color: PAPER.ink, fontSize: 13.5, fontWeight: "700", marginTop: 2 },
  th: { flexDirection: "row", marginBottom: 4 },
  thText: { color: PAPER.ink2, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
  tr: { flexDirection: "row", paddingVertical: 3, alignItems: "flex-start" },
  td: { color: PAPER.ink, fontSize: 12.5 },
  tdHsn: { color: PAPER.ink2, fontSize: 9.5, marginTop: 1 },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colRate: { flex: 1.6, textAlign: "right" },
  colAmt: { flex: 1.8, textAlign: "right", fontWeight: "700" },
  paperEmpty: { color: PAPER.ink3, fontSize: 12, paddingVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalLabel: { color: PAPER.ink2, fontSize: 12 },
  totalValue: { color: PAPER.ink, fontSize: 12.5 },
  grandRow: { marginTop: 6, borderTopWidth: 1, borderTopColor: PAPER.hairline, paddingTop: 8 },
  grandLabel: { color: PAPER.ink, fontSize: 14, fontWeight: "800" },
  grandValue: { color: PAPER.ink, fontSize: 16, fontWeight: "800" },
  paperWords: { color: PAPER.ink2, fontSize: 11, marginTop: 8, lineHeight: 15 },
  missing: { color: ui.c.warning, fontSize: 12.5, marginTop: 14, lineHeight: 18 },
  error: { color: ui.error, fontSize: 13, marginTop: 12, lineHeight: 18 },
  primary: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  dim: { opacity: 0.45 },
  // Only the one hex the palette does not carry: white text on a filled accent
  // button (the same choice the other product screens make).
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  result: { marginTop: 18 },
  hint: { color: MUTED, fontSize: 12, marginTop: 8, lineHeight: 17 },
  foot: { color: ui.faint, fontSize: 11, marginTop: 22, textAlign: "center", lineHeight: 16 },
  });
}
