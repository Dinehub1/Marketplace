/**
 * Document check — one document in, what the file really holds out.
 *
 * The engine (services/tools/worker.py, `resume_check` behind
 * product=resume-checker) reads a PDF, a DOCX or plain text with markitdown
 * (MIT, runs on this VM) and writes one Markdown report. This screen's job is to
 * say the three things that mean something to a person:
 *
 *   - how much text the file really carries (words, characters, pages),
 *   - whether an email and a phone number are in it,
 *   - which of the keywords they typed actually appear — as whole words, so
 *     `sql` is not "found" inside `mysql`.
 *
 * Two honesty rules are deliberate:
 *   1. It never claims what a hiring system wants. That is not knowable from
 *      this box, so the screen says "the words that appear in your file".
 *   2. The price is whatever the *server* answered. If the route ever puts this
 *      job behind the paywall (`locked: true`), the unlock row appears by
 *      itself; today the route serves it free and the screen says the run was
 *      free. Nothing is priced here, because that is a business decision, not a
 *      screen's.
 *
 * Look and feel: colours, sizes and gaps come from `lib/product-ui`, and the
 * whole style body lives inside `makeStyles(ui)` — a `StyleSheet.create` at
 * module scope is evaluated once outside the theme and cannot follow dark mode.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import {
  formatBytes, openResult, pickFile, runJob,
  type JobResult, type PickedFile,
} from "@/lib/tools";
import { UnlockRow } from "@/components/unlock-row";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";

/** The engine's own meta, as `resume_check` returns it. */
type DocMeta = {
  extractor?: string;
  input_suffix?: string;
  text_len?: number;
  words?: number;
  pages?: number | null;
  emails?: string[];
  phones?: string[];
  headings?: string[];
  keywords_found?: string[];
  keywords_missing?: string[];
};

/** What the route will accept, and how many keywords one check may carry. */
const MAX_KEYWORDS = 30;
const MAX_KEYWORD_CHARS = 700;
/** The report is stored as Markdown; this is how much of it the toggle shows. */
const TEXT_SHOWN = 4000;

/** Commas, semicolons or new lines separate keywords; repeats are dropped. */
function parseKeywords(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const k = part.trim();
    if (!k) continue;
    if (!out.some((seen) => seen.toLowerCase() === k.toLowerCase())) out.push(k);
  }
  return out;
}

function group(n?: number): string {
  return typeof n === "number" ? n.toLocaleString("en-IN") : "?";
}

export default function DocumentCheck() {
  const ui = useProductUI("resume-checker");
  const s = useMemo(() => makeStyles(ui), [ui]);

  const [file, setFile] = useState<PickedFile | null>(null);
  const [keywords, setKeywords] = useState("");
  const [job, setJob] = useState<JobResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [textBusy, setTextBusy] = useState(false);
  const [openText, setOpenText] = useState(false);

  const meta = (job?.meta ?? {}) as DocMeta;
  const typed = parseKeywords(keywords);
  const found = meta.keywords_found ?? [];
  const missing = meta.keywords_missing ?? [];
  const suffix = (meta.input_suffix ?? "").replace(".", "").toUpperCase();

  async function choose() {
    setError(null);
    setText(null);
    setOpenText(false);
    try {
      const picked = await pickFile("doc");
      if (!picked) return;
      setFile(picked);
      setJob(null);
      await check(picked, keywords);
    } catch (e: any) {
      setError(e?.message || "Could not open a file picker on this device.");
    }
  }

  async function check(picked: PickedFile, rawKeywords: string) {
    const list = parseKeywords(rawKeywords);
    // The route refuses both of these with a 400; saying it here means the user
    // is not made to upload a document to be told.
    if (list.length > MAX_KEYWORDS) {
      setError(
        `the server checks at most ${MAX_KEYWORDS} keywords in one run (${list.length} were typed) — ` +
        "remove some and try again",
      );
      return;
    }
    if (list.join(",").length > MAX_KEYWORD_CHARS) {
      setError(
        `those keywords are too long together (${list.join(",").length} characters, the limit is ` +
        `${MAX_KEYWORD_CHARS}) — use shorter terms`,
      );
      return;
    }

    setBusy(true);
    setError(null);
    setJob(null);
    setText(null);
    setOpenText(false);
    try {
      const result = await runJob({
        product: "resume-checker",
        fields: { keywords: list.join(",") },
        files: [{ field: "file", file: picked }],
      });
      setJob(result);
      if (!result.outputUrl) {
        setError("The server finished without a report. Nothing was charged — try again.");
      }
    } catch (e: any) {
      setError(e?.message || "That document could not be read. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * The text is fetched from the report the engine saved, not kept in this
   * screen: the bucket serves it with `Access-Control-Allow-Origin: *`
   * (measured), and the report is the evidence — showing a copy held in state
   * would be showing what this screen thinks the engine read.
   */
  async function showText() {
    const url = job?.outputUrl;
    if (!url) return;
    setOpenText(true);
    if (text !== null) return;
    setTextBusy(true);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`the report answered ${r.status}`);
      const md = await r.text();
      const head = "## The document, as text";
      const i = md.indexOf(head);
      setText((i >= 0 ? md.slice(i + head.length) : md).trim());
    } catch (e: any) {
      setError(`Could not read the report back: ${e?.message || e}`);
    } finally {
      setTextBusy(false);
    }
  }

  const done = !!job?.outputUrl;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>DOCUMENT CHECK · READ ON OUR SERVER</Text>
      </View>

      <Text style={s.h1}>What the{"\n"}document says</Text>
      <Text style={s.sub}>
        Choose a CV, a contract, a form — any document. You get how much text it really
        holds, the email and phone number inside it, and which of your keywords appear.
      </Text>

      <View style={s.sheet}>
        {file ? (
          <View style={s.sheetBody}>
            <Text style={s.sheetName} numberOfLines={2}>{file.name}</Text>
            <Text style={s.sheetMeta}>
              {[suffix || file.type || "file", formatBytes(file.size)].filter(Boolean).join(" · ")}
            </Text>
          </View>
        ) : (
          <View style={s.empty}>
            {busy ? (
              <>
                <ActivityIndicator color={ui.accent} />
                <Text style={s.emptyText}>Reading the document…</Text>
              </>
            ) : (
              <>
                <Text style={s.emptyTitle}>No document yet</Text>
                <Text style={s.emptyText}>
                  A PDF, a Word file or plain text. Nothing is read until you choose one, and
                  a scan or a photo cannot work — a picture has no text layer.
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      <Text style={s.label}>Keywords to look for</Text>
      <TextInput
        style={s.input}
        value={keywords}
        onChangeText={setKeywords}
        placeholder="python, tally, forklift"
        placeholderTextColor={ui.faint}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />
      <Text style={s.hint}>
        Up to {MAX_KEYWORDS}, separated by commas or new lines. A whole word only — {"`sql`"} is
        not counted inside {"`mysql`"}. Leave it empty for the numbers alone.
      </Text>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, busy && s.dim]}
        onPress={() => (file ? check(file, keywords) : choose())}
        disabled={busy}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryText}>
            {file ? "Check this document" : "Choose a document"}
          </Text>
        )}
      </Pressable>

      {file && !busy ? (
        <Pressable style={s.secondary} onPress={choose} accessibilityRole="button">
          <Text style={s.secondaryText}>Choose another document</Text>
        </Pressable>
      ) : null}

      {done ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>What the file really holds</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Words</Text>
            <Text style={s.rowValue}>{group(meta.words)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Characters</Text>
            <Text style={s.rowValue}>{group(meta.text_len)}</Text>
          </View>
          {typeof meta.pages === "number" ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>Pages</Text>
              <Text style={s.rowValue}>{meta.pages}</Text>
            </View>
          ) : null}
          <View style={s.row}>
            <Text style={s.rowLabel}>Email</Text>
            <Text style={s.rowValue}>{meta.emails?.length ? meta.emails.join(", ") : "not found"}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Phone</Text>
            <Text style={s.rowValue}>{meta.phones?.length ? meta.phones.join(", ") : "not found"}</Text>
          </View>
          {meta.extractor ? (
            <Text style={s.cardFine}>
              Read from a {suffix || "document"} with {meta.extractor}. Heading words that
              appear: {meta.headings?.length ? meta.headings.join(", ") : "none of the common ones"}.
            </Text>
          ) : null}
          {/* Measured, not assumed: the engine's phone pattern is a 10-digit Indian
              mobile (`(?:\\+91[-\\s]?)?[6-9]\\d{9}`), so a CV with a foreign number
              comes back "not found" — the row must not read as "this document has no
              phone number". An English CV with (+82) 10-9030-1843 was the case that
              showed it. */}
          <Text style={s.cardFine}>
            The phone check looks for a 10-digit Indian mobile number, optionally written
            +91. A number in another country&apos;s format will not be found.
          </Text>

          <Text style={[s.cardTitle, s.cardSpaced]}>Keywords</Text>
          {typed.length ? (
            <>
              <Text style={s.cardFine}>
                Whole words only: {found.length} of {found.length + missing.length} appear in
                the document.
              </Text>
              <View style={s.chips}>
                {found.map((k) => (
                  <View key={`y-${k}`} style={s.chipOk}>
                    <Text style={s.chipOkText}>{k}</Text>
                  </View>
                ))}
                {missing.map((k) => (
                  <View key={`n-${k}`} style={s.chipNo}>
                    <Text style={s.chipNoText}>{k}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.cardFine}>
                Filled = in the document. Outlined = not in it.
              </Text>
            </>
          ) : (
            <Text style={s.cardNote}>
              No keywords were typed, so nothing was scored. The numbers above are the whole
              report.
            </Text>
          )}

          <Text style={[s.cardTitle, s.cardSpaced]}>The text the engine read</Text>
          <Text style={s.cardNote}>
            Fetched back from the report itself, so it is what the reader saw — not what this
            screen expected it to see.
          </Text>
          {openText ? (
            textBusy ? (
              <ActivityIndicator color={ui.accent} style={s.textSpin} />
            ) : text ? (
              <>
                <View style={s.textBox}>
                  <Text style={s.textBody}>
                    {text.slice(0, TEXT_SHOWN)}
                    {text.length > TEXT_SHOWN ? "\n…" : ""}
                  </Text>
                </View>
                {text.length > TEXT_SHOWN ? (
                  <Text style={s.cardFine}>
                    Showing the first {group(TEXT_SHOWN)} of {group(text.length)} characters —
                    open the report below for all of it.
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={s.cardNote}>The report came back empty.</Text>
            )
          ) : (
            <Pressable style={s.secondary} onPress={showText} accessibilityRole="button">
              <Text style={s.secondaryText}>Show the text</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {done && !busy ? (
        <>
          {job?.locked ? (
            <UnlockRow
              job={job}
              placement="job.unlock-rewarded.resume-checker"
              paidLabel={
                job?.pricePaise
                  ? `Unlock the report · ₹${Math.round(job.pricePaise / 100)}`
                  : "Unlock the report"
              }
              paidNote="The report you unlock is the full check, with no mark."
              onUnlocked={(url) => setJob({ ...job, locked: false, outputUrl: url })}
            />
          ) : (
            <>
              <Pressable
                style={s.secondary}
                onPress={async () => {
                  const url = job?.outputUrl;
                  if (!url) return;
                  await openResult(url, `${(file?.name ?? "document").replace(/\.[^.]+$/, "")}-check.md`);
                }}
                accessibilityRole="button"
              >
                <Text style={s.secondaryText}>
                  {job?.free ? "Save the report · free" : "Save the report"}
                </Text>
              </Pressable>
              {job?.free ? (
                <Text style={s.hint}>
                  This run was free — the report is yours, with no unlock step.
                </Text>
              ) : null}
            </>
          )}
        </>
      ) : null}

      <Text style={s.foot}>
        Read on our own server with markitdown, an open-source reader; the report is stored in
        our bucket and the text is not sent to any document service. What this cannot tell you:
        what a hiring system wants or scores — that is not knowable from here. It says which
        words appear in your file.
      </Text>
    </ScrollView>
  );
}

function makeStyles(ui: ProductUI) {
  const { type, space, radius } = ui;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.bg },
    wrap: {
      padding: space.lg, paddingBottom: space.xxl, maxWidth: 520, width: "100%", alignSelf: "center",
    },
    badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: space.md },
    badge: { ...type.caption, color: ui.accent, flexShrink: 1 },
    h1: { ...type.hero, color: ui.ink, marginBottom: space.sm },
    sub: { ...type.callout, color: ui.muted, marginBottom: space.base },
    sheet: {
      minHeight: 120,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: ui.hairline,
      backgroundColor: ui.surface,
      justifyContent: "center",
    },
    sheetBody: { padding: space.lg, gap: 6 },
    sheetName: { ...type.title3, color: ui.ink },
    sheetMeta: { ...type.meta, color: ui.muted },
    empty: { alignItems: "center", justifyContent: "center", padding: space.lg, gap: space.sm },
    emptyTitle: { ...type.title3, color: ui.ink },
    emptyText: { ...type.meta, color: ui.muted, textAlign: "center" },
    label: { ...productText.label, color: ui.ink, marginTop: space.base, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: ui.hairline,
      borderRadius: radius.sm,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      minHeight: ui.touch,
      color: ui.ink,
      backgroundColor: ui.surface,
    },
    hint: { ...productText.fine, color: ui.muted, marginTop: 6 },
    error: { ...type.meta, color: ui.error, marginTop: space.md },
    card: {
      marginTop: space.base,
      backgroundColor: ui.surface,
      borderWidth: 1,
      borderColor: ui.hairline,
      borderRadius: radius.md,
      padding: space.md,
      gap: 4,
    },
    cardTitle: { ...productText.label, color: ui.ink, marginBottom: 2 },
    cardSpaced: { marginTop: space.md },
    cardNote: { ...type.meta, color: ui.muted },
    cardFine: { ...productText.fine, color: ui.faint, marginTop: space.sm },
    row: { flexDirection: "row", alignItems: "baseline", gap: space.sm },
    rowLabel: { ...type.meta, color: ui.muted, width: 92 },
    rowValue: { ...type.meta, color: ui.ink, flexShrink: 1 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: space.sm },
    chipOk: {
      backgroundColor: ui.accentTint, borderRadius: radius.sm,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    chipOkText: { ...productText.tag, color: ui.accent },
    chipNo: {
      borderWidth: 1, borderColor: ui.hairline, borderRadius: radius.sm,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    chipNoText: { ...productText.tag, color: ui.muted },
    textBox: {
      marginTop: space.sm,
      borderWidth: 1,
      borderColor: ui.c.hairlineStrong,
      borderRadius: radius.sm,
      backgroundColor: ui.c.surfaceSunken,
      padding: space.md,
      maxHeight: 320,
    },
    textBody: { ...productText.fine, color: ui.c.ink2 },
    textSpin: { marginTop: space.sm },
    primary: {
      backgroundColor: ui.accent, borderRadius: radius.md, paddingVertical: space.base,
      minHeight: ui.touch, alignItems: "center", justifyContent: "center", marginTop: space.base,
    },
    dim: { opacity: 0.7 },
    // #fff on a filled accent button in both schemes — the same exception
    // bg-remove and exif-strip keep. Do not "fix" it to ui.ink.
    primaryText: { ...productText.button, color: "#fff" },
    secondary: {
      borderWidth: 1.5, borderColor: ui.accent, borderRadius: radius.md,
      paddingVertical: space.base, minHeight: ui.touch, alignItems: "center",
      justifyContent: "center", marginTop: space.md, backgroundColor: ui.surface,
    },
    secondaryText: { ...productText.button, color: ui.accent },
    foot: { ...productText.fine, color: ui.faint, marginTop: space.base, textAlign: "center" },
  });
}
