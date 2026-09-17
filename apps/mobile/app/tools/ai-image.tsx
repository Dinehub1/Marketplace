/**
 * Text to image — one prompt in, one picture out.
 *
 * The engine (`services/tools/worker.py`, `ai_image` behind product=ai-image)
 * calls a hosted model on Workers AI (`@cf/black-forest-labs/flux-1-schnell`),
 * stores the JPEG in our bucket and answers with the link plus what it really
 * sent. This screen's job is small: take one description, run that job, show the
 * picture that came back, and say what the run was.
 *
 * Three honesty rules, each from a measurement rather than a taste:
 *   1. **What the model is not.** flux is fast and literal: it draws a sentence,
 *      it does not design a logo or set type. The copy says "describe it plainly"
 *      and never "design", because a screen that promises design gets told so by
 *      the first picture.
 *   2. **One picture per run, and it costs us money.** The route serves this free
 *      (the catalogue row `ai-image` is `price_paise 0` / `plan free`), but every
 *      run bills 172.8 neurons ≈ ₹0.18 inside a 10,000-neuron daily allowance —
 *      about 57 pictures a day (docs/product-plan.md, measured from job 148's own
 *      meta). So the card says the run was free and says the allowance is finite,
 *      and it does not pretend the offer is unlimited.
 *   3. **The price is the server's answer**, never this screen's: if the route
 *      ever puts the job behind the paywall (`locked: true`) the unlock row
 *      appears by itself. Nothing is priced here.
 *
 * Look and feel: colours, sizes and gaps come from `lib/product-ui`, and the whole
 * style body lives inside `makeStyles(ui)` — a `StyleSheet.create` at module scope
 * is evaluated once, outside the theme, and cannot follow dark mode (queue item 19).
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { formatBytes, openPaywall, openResult, runJob, type JobResult } from "@/lib/tools";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";

/**
 * The prompt cap. It is the route's own limit (`FIELD_LIMITS.prompt = 300` in
 * apps/web/app/api/job/route.ts, which answers 413 above it), repeated here so a
 * too-long prompt is caught before the upload instead of after it.
 */
const MAX_PROMPT = 300;

/** The engine's own meta, as `ai_image` returns it. */
type GenMeta = {
  model?: string;
  generated?: boolean;
  bytes?: number;
  width?: number;
  height?: number;
  steps?: number;
  shape?: string;
};

export default function TextToImage() {
  const ui = useProductUI("ai-image");
  const s = useMemo(() => makeStyles(ui), [ui]);

  const [prompt, setPrompt] = useState("");
  const [job, setJob] = useState<JobResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = (job?.meta ?? {}) as GenMeta;
  const typed = prompt.trim();
  const tooLong = typed.length > MAX_PROMPT;
  const picture = job?.previewUrl ?? job?.outputUrl ?? null;
  const done = !!picture;

  async function draw() {
    const text = prompt.trim();
    if (!text) {
      setError("Type what you want in the picture first — the model needs a subject.");
      return;
    }
    if (text.length > MAX_PROMPT) {
      setError(
        `That is ${text.length} characters; the server takes up to ${MAX_PROMPT} in one run — ` +
        "cut it down and try again.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const result = await runJob({ product: "ai-image", fields: { prompt: text } });
      setJob(result);
      if (!result.previewUrl && !result.outputUrl) {
        setError("The model finished without a picture. Nothing was charged — try again.");
      }
    } catch (e: any) {
      setError(e?.message || "That drawing could not be made. Try a plainer description.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>TEXT TO IMAGE · MADE ON OUR SERVER</Text>
      </View>

      <Text style={s.h1}>Describe it,{"\n"}and the model draws it</Text>
      <Text style={s.sub}>
        One description, one picture. Say what should be in the picture and what it looks
        like — a shop sign with fruits around it, a plain background for a product. Kept
        plain on purpose: this model draws what you say, literally, and it does not design
        a logo or lay out words for you.
      </Text>

      <Text style={s.label}>What should be in the picture</Text>
      <TextInput
        style={[s.input, s.inputTall, tooLong && s.inputBad]}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="a steel tiffin box on a wooden table, warm light"
        placeholderTextColor={ui.faint}
        multiline
        numberOfLines={4}
        editable={!busy}
        accessibilityLabel="What should be in the picture"
      />
      <Text style={s.hint}>
        {typed.length}/{MAX_PROMPT} characters. One picture per run, and the run cannot be
        undone once it is sent.
      </Text>
      {tooLong ? (
        <Text style={s.error}>
          That is {typed.length} characters and the server takes {MAX_PROMPT} — shorten it.
        </Text>
      ) : null}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, (busy || !typed) && s.dim]}
        onPress={draw}
        disabled={busy || !typed}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy || !typed }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryText}>Draw the picture</Text>
        )}
      </Pressable>

      {busy ? <Text style={s.hint}>Drawing on the server — this takes a few seconds.</Text> : null}

      {done ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>The picture that came back</Text>
          <View style={s.frame}>
            <Image source={{ uri: picture as string }} style={s.picture} resizeMode="contain" />
          </View>

          <View style={s.row}>
            <Text style={s.rowLabel}>Model</Text>
            <Text style={s.rowValue}>{meta.model ?? "the server did not say"}</Text>
          </View>
          {meta.width && meta.height ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>Size</Text>
              <Text style={s.rowValue}>{`${meta.width} × ${meta.height} pixels`}</Text>
            </View>
          ) : null}
          {meta.steps ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>Steps</Text>
              <Text style={s.rowValue}>
                {`${meta.steps}${meta.shape ? ` · ${meta.shape}` : ""}`}
              </Text>
            </View>
          ) : null}
          {meta.bytes ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>File</Text>
              <Text style={s.rowValue}>{formatBytes(meta.bytes)} JPEG</Text>
            </View>
          ) : null}

          {/* Measured, not assumed: the same prompt run twice does not produce the same
              picture — the model samples — so a redraw is a new picture, and the screen
              must not read as if it reprints the last one. */}
          <Text style={s.cardFine}>
            Drawn new each run: the same words will not give back the same pixels, and this
            model does not set text or design a logo. A picture of a person is not a real
            person.
          </Text>
        </View>
      ) : null}

      {done && !busy ? (
        <>
          {job?.locked ? (
            <Pressable
              style={s.primary}
              onPress={() => job?.jobId && openPaywall(job.jobId)}
              accessibilityRole="button"
            >
              <Text style={s.primaryText}>
                {job?.pricePaise
                  ? `Unlock the picture · ₹${Math.round(job.pricePaise / 100)}`
                  : "Unlock the picture"}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={s.secondary}
                onPress={async () => {
                  const url = job?.outputUrl ?? job?.previewUrl;
                  if (!url) return;
                  await openResult(url, "text-to-image.jpg");
                }}
                accessibilityRole="button"
              >
                <Text style={s.secondaryText}>
                  {job?.free ? "Save the picture · free" : "Save the picture"}
                </Text>
              </Pressable>
              {job?.free ? (
                <Text style={s.hint}>
                  This run was free — the file is yours, with no unlock step.
                </Text>
              ) : null}
            </>
          )}
        </>
      ) : null}

      <Text style={s.foot}>
        Drawn on our server by an open image model on Workers AI ({meta.model ?? "flux-1-schnell"}).
        Nothing is uploaded from your phone and no photo of yours is used. Each picture costs us
        about ₹0.18 inside a daily free allowance of roughly 57 pictures, so the run is free but
        it is not unlimited.
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
    inputTall: { minHeight: 96, textAlignVertical: "top" },
    inputBad: { borderColor: ui.error },
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
    cardFine: { ...productText.fine, color: ui.faint, marginTop: space.sm },
    // The picture keeps its own white mat in both schemes: a JPEG of a shop sign on a
    // dark ground reads as a dark photograph, and the sheet is what the model drew.
    frame: {
      marginTop: space.sm,
      borderRadius: radius.sm,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: ui.c.hairlineStrong,
      overflow: "hidden",
    },
    picture: { width: "100%", height: 280 },
    row: { flexDirection: "row", alignItems: "baseline", gap: space.sm, marginTop: 2 },
    rowLabel: { ...type.meta, color: ui.muted, width: 62 },
    rowValue: { ...type.meta, color: ui.ink, flexShrink: 1 },
    primary: {
      backgroundColor: ui.accent, borderRadius: radius.md, paddingVertical: space.base,
      minHeight: ui.touch, alignItems: "center", justifyContent: "center", marginTop: space.base,
    },
    dim: { opacity: 0.7 },
    // #fff on a filled accent button in both schemes — the same exception bg-remove,
    // exif-strip and the document check keep. Do not "fix" it to ui.ink.
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
