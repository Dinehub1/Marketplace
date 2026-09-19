/**
 * Document translation — one document in, the same text in another language out.
 *
 * The engine (services/tools/worker.py, `translate_doc` behind product=translate-doc)
 * reads a PDF, a DOCX or plain text with markitdown and translates it with a hosted
 * model on Workers AI (job 161: en→hi, 221 characters, 30 neurons, 6.3 s). It writes
 * one Markdown report, and this screen's job is to show the two things a person needs:
 * the translated text itself, and what the run actually cost and used.
 *
 * Three honesty rules, all of them from measurements rather than taste:
 *
 *   1. The language list is `TRANSLATE_LANGS` from `@hermes/core` — the *same array*
 *      the job route validates against, so the picker cannot offer a code the route
 *      answers with a 400 (item 25's lesson: the PDF screen owned a second copy of a
 *      grammar and drifted in both directions). Gujarati and Telugu are in neither
 *      list because their round trips changed the numbers or came back empty.
 *   2. It says "machine translation, read it before you send it" where a person will
 *      read it, not in small print: the model reflowed a PDF's sentence order once,
 *      and translated "wiring" as "तारावली".
 *   3. Nothing is priced here. After a run the screen prints what the *server*
 *      answered (`free` / `locked`, and the unlock row appears by itself if the
 *      catalogue row is ever put behind the paywall). What this should cost is a
 *      business decision, not a screen's.
 *
 * The text is not sent to a document service, but it *is* sent to a model — the one
 * product in the toolbox that leaves this box — so the foot says so.
 *
 * Look and feel: colours, sizes and gaps come from `lib/product-ui`, and the whole
 * style body lives inside `makeStyles(ui)` — a `StyleSheet.create` at module scope is
 * evaluated once outside the theme and cannot follow dark mode.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { TRANSLATE_LANG_NAMES, TRANSLATE_LANGS, TRANSLATE_LANGS_HELP } from "@hermes/core";
import {
  formatBytes, openResult, pickFile, runJob,
  type JobResult, type PickedFile,
} from "@/lib/tools";
import { UnlockRow } from "@/components/unlock-row";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";

/** The engine's own meta, as `translate_doc` returns it. */
type TranslateMeta = {
  model?: string;
  engines?: Record<string, number>;
  fallback?: string;
  source?: string;
  target?: string;
  extractor?: string;
  input_suffix?: string;
  chars_in?: number;
  chars_out?: number;
  chunks?: number;
  seconds?: number;
  tokens_in?: number;
  tokens_out?: number;
  neurons?: number;
};

/**
 * How each language names itself — a picker for Indian languages should not make a
 * Tamil reader find "Tamil" in English. Codes come from `@hermes/core`; a code with no
 * label here falls back to its English name rather than rendering an empty chip, so
 * adding a language upstream can never produce a blank button.
 */
const LANG_NATIVE: Record<string, string> = {
  en: "English", hi: "हिंदी", bn: "বাংলা", mr: "मराठी", ta: "தமிழ்", ml: "മലയാളം",
  kn: "ಕನ್ನಡ", pa: "ਪੰਜਾਬੀ", or: "ଓଡ଼ିଆ", as: "অসমীয়া", ur: "اردو",
};

function langName(code: string): string {
  return TRANSLATE_LANG_NAMES[code] ?? code;
}

function langLabel(code: string): string {
  return LANG_NATIVE[code] ?? langName(code);
}

/**
 * The rate the meter is read at, from `docs/product-plan.md` (item 16): Cloudflare
 * bills Workers AI $0.011 per 1,000 neurons, converted at the rate
 * `scripts/cost-report.mjs` fetched live on 2026-09-17 (USD 1 = ₹96.02). The app
 * cannot fetch an exchange rate at render time, so the figure is labelled "about" and
 * the neuron count beside it is the measured one — the number to trust.
 */
const NEURON_USD_PER_1000 = 0.011;
const USD_INR = 96.02;

function rupeesFor(neurons?: number): string | null {
  if (typeof neurons !== "number") return null;
  return `₹${((neurons * NEURON_USD_PER_1000 * USD_INR) / 1000).toFixed(2)}`;
}

/** The report stores the translation under this heading (see `translate_doc`). */
function translationOutOf(markdown: string, target: string): string {
  const head = `## In ${langName(target)}`;
  const i = markdown.indexOf(head);
  return (i >= 0 ? markdown.slice(i + head.length) : markdown).trim();
}

export default function DocumentTranslation() {
  const ui = useProductUI("translate-doc");
  const s = useMemo(() => makeStyles(ui), [ui]);

  const [file, setFile] = useState<PickedFile | null>(null);
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("hi");
  const [job, setJob] = useState<JobResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [textBusy, setTextBusy] = useState(false);

  const meta = (job?.meta ?? {}) as TranslateMeta;
  const suffix = (meta.input_suffix ?? "").replace(".", "").toUpperCase();
  const engines = Object.keys(meta.engines ?? {});

  async function choose() {
    setError(null);
    try {
      const picked = await pickFile("doc");
      if (!picked) return;
      setFile(picked);
      // A new document invalidates the last report: showing the previous translation
      // beside a different file is how a screen starts lying about what it produced.
      setJob(null);
      setText(null);
    } catch (e: any) {
      setError(e?.message || "Could not open a file picker on this device.");
    }
  }

  async function translate(picked: PickedFile, from: string, into: string) {
    setBusy(true);
    setError(null);
    setJob(null);
    setText(null);
    try {
      const result = await runJob({
        product: "translate-doc",
        fields: { source: from, target: into },
        files: [{ field: "file", file: picked }],
      });
      setJob(result);
      if (!result.outputUrl) {
        setError("The server finished without a translation. Nothing was charged — try again.");
      } else {
        await loadText(result.outputUrl, into);
      }
    } catch (e: any) {
      setError(e?.message || "That document could not be translated. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * The translation is read back from the report the engine saved, not from state:
   * the report is the evidence, and a copy held here would be what this screen thinks
   * the model wrote. Measured: the bucket serves it with `Access-Control-Allow-
   * Origin: *`, which is what makes the fetch legal from the app.
   */
  async function loadText(url: string, into: string) {
    setTextBusy(true);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`the report answered ${r.status}`);
      setText(translationOutOf(await r.text(), into));
    } catch (e: any) {
      setError(`The translation was made but could not be read back: ${e?.message || e}`);
    } finally {
      setTextBusy(false);
    }
  }

  function swap() {
    setSource(target);
    setTarget(source);
  }

  function LangRow({ code, onPick }: { code: string; onPick: (c: string) => void }) {
    return (
      <View style={s.chips}>
        {TRANSLATE_LANGS.map((c) => {
          const on = c === code;
          return (
            <Pressable
              key={c}
              onPress={() => onPick(c)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={langName(c)}
              style={[s.chip, on && s.chipOn]}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{langLabel(c)}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const done = !!job?.outputUrl;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>DOCUMENT TRANSLATION · MACHINE TRANSLATION</Text>
      </View>

      <Text style={s.h1}>Same text,{"\n"}other language</Text>
      <Text style={s.sub}>
        A PDF, a Word file or plain text. The same text comes back in the language you
        pick — translated by a model, so read it before you send it to anyone.
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
                <Text style={s.emptyText}>Translating…</Text>
              </>
            ) : (
              <>
                <Text style={s.emptyTitle}>No document yet</Text>
                <Text style={s.emptyText}>
                  A PDF, a Word file or plain text. A scan or a photo cannot work — a
                  picture has no text layer to translate.
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      <Text style={s.label}>Translate from</Text>
      <LangRow code={source} onPick={setSource} />

      <View style={s.swapRow}>
        <Pressable style={s.swap} onPress={swap} accessibilityRole="button">
          <Text style={s.swapText}>⇅ Swap the two</Text>
        </Pressable>
      </View>

      <Text style={s.label}>Translate into</Text>
      <LangRow code={target} onPick={setTarget} />

      {source === target ? (
        <Text style={s.warn}>
          Both sides are {langName(source)} — that is not a translation. Pick another
          language on one side.
        </Text>
      ) : null}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, (busy || source === target) && s.dim]}
        onPress={() => (file ? translate(file, source, target) : choose())}
        disabled={busy || (!!file && source === target)}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryText}>
            {file
              ? `Translate into ${langName(target)}`
              : "Choose a document"}
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
          <Text style={s.cardTitle}>
            {langName(meta.source ?? source)} → {langName(meta.target ?? target)}
          </Text>
          <Text style={s.notice}>
            Machine translation — read it before you send it.
          </Text>

          <Text style={[s.cardTitle, s.cardSpaced]}>The text, translated</Text>
          {textBusy ? (
            <ActivityIndicator color={ui.accent} style={s.textSpin} />
          ) : text ? (
            <View style={s.textBox}>
              <Text style={s.textBody}>{text}</Text>
            </View>
          ) : (
            <Text style={s.cardNote}>
              The report came back empty. Save it below and open it to see for yourself.
            </Text>
          )}

          <Text style={[s.cardTitle, s.cardSpaced]}>What this run used</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Characters</Text>
            <Text style={s.rowValue}>
              {typeof meta.chars_in === "number" ? meta.chars_in.toLocaleString("en-IN") : "?"}
              {" in · "}
              {typeof meta.chars_out === "number" ? meta.chars_out.toLocaleString("en-IN") : "?"}
              {" out"}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Paragraphs</Text>
            <Text style={s.rowValue}>
              {typeof meta.chunks === "number" ? meta.chunks : "?"} sent, one call each
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Seconds</Text>
            <Text style={s.rowValue}>{typeof meta.seconds === "number" ? meta.seconds : "?"}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Model</Text>
            <Text style={s.rowValue}>
              {engines.length ? engines.join(", ") : (meta.model ?? "not recorded")}
              {meta.fallback ? ` · fallback ${meta.fallback}` : ""}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Billed</Text>
            <Text style={s.rowValue}>
              {typeof meta.neurons === "number"
                ? `${meta.neurons} neurons billed (about ${rupeesFor(meta.neurons)})`
                : "not recorded"}
            </Text>
          </View>
          {meta.extractor ? (
            <Text style={s.cardFine}>
              Read from a {suffix || "document"} with {meta.extractor}, the same reader
              the document check uses.
            </Text>
          ) : null}
          <Text style={s.cardFine}>
            The text goes from this phone to our server and on to the model that
            translates it. It is not sent to any document service, and nothing is kept
            beyond the report in our own bucket.
          </Text>
        </View>
      ) : null}

      {done && !busy ? (
        <>
          {job?.locked ? (
            <UnlockRow
              job={job}
              placement="job.unlock-rewarded.translate-doc"
              paidLabel={
                job?.pricePaise
                  ? `Unlock the translation · ₹${Math.round(job.pricePaise / 100)}`
                  : "Unlock the translation"
              }
              paidNote="The file you unlock is the full translation, with no mark."
              onUnlocked={(url) => setJob({ ...job, locked: false, outputUrl: url })}
            />
          ) : (
            <>
              <Pressable
                style={s.secondary}
                onPress={async () => {
                  const url = job?.outputUrl;
                  if (!url) return;
                  await openResult(
                    url,
                    `${(file?.name ?? "document").replace(/\.[^.]+$/, "")}-${meta.target ?? target}.md`,
                  );
                }}
                accessibilityRole="button"
              >
                <Text style={s.secondaryText}>
                  {job?.free ? "Save the translation · free" : "Save the translation"}
                </Text>
              </Pressable>
              {job?.free ? (
                <Text style={s.hint}>
                  This run was free — the translation is yours, with no unlock step.
                </Text>
              ) : null}
            </>
          )}
        </>
      ) : null}

      <Text style={s.foot}>
        Languages offered: {TRANSLATE_LANGS_HELP}. Gujarati and Telugu are not on the
        list: a round trip through them changed the numbers in a test sentence, and a
        translation that quietly moves a figure is worse than no translation. OCR is
        not here either — this reads the text a document already carries, so a scan
        needs a text layer first.
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
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: {
      borderWidth: 1, borderColor: ui.hairline, borderRadius: radius.sm,
      backgroundColor: ui.surface, paddingHorizontal: 12, paddingVertical: 6,
    },
    chipOn: { backgroundColor: ui.accentTint, borderColor: ui.accent },
    chipText: { ...productText.tag, color: ui.muted },
    chipTextOn: { color: ui.accent },
    swapRow: { flexDirection: "row", marginTop: space.sm },
    swap: {
      paddingVertical: 6, paddingHorizontal: 4, minHeight: 32, justifyContent: "center",
    },
    swapText: { ...productText.tag, color: ui.accent },
    warn: { ...type.meta, color: ui.error, marginTop: space.sm },
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
    notice: { ...type.meta, color: ui.accent },
    cardNote: { ...type.meta, color: ui.muted },
    cardFine: { ...productText.fine, color: ui.faint, marginTop: space.sm },
    row: { flexDirection: "row", alignItems: "baseline", gap: space.sm },
    rowLabel: { ...type.meta, color: ui.muted, width: 92 },
    rowValue: { ...type.meta, color: ui.ink, flexShrink: 1 },
    textBox: {
      marginTop: space.sm,
      borderWidth: 1,
      borderColor: ui.c.hairlineStrong,
      borderRadius: radius.sm,
      backgroundColor: ui.c.surfaceSunken,
      padding: space.md,
    },
    textBody: { ...productText.fine, color: ui.c.ink2 },
    textSpin: { marginTop: space.sm },
    primary: {
      backgroundColor: ui.accent, borderRadius: radius.md, paddingVertical: space.base,
      minHeight: ui.touch, alignItems: "center", justifyContent: "center", marginTop: space.base,
    },
    dim: { opacity: 0.7 },
    // #fff on a filled accent button in both schemes — the same exception
    // bg-remove, exif-strip and resume-checker keep. Do not "fix" it to ui.ink.
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
