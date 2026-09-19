/**
 * Background remover.
 *
 * The whole product is one gesture: choose a photo, the person or product comes
 * out on its own with a clear background. So the screen is one frame and one
 * button — no form, no options, nothing to configure before it works.
 *
 * The frame sits on a checkerboard, which is the drawing convention for "this
 * part is transparent". Without it a cut-out of a dark object on dark hair looks
 * like a broken image instead of a PNG with an alpha channel.
 *
 * The work normally happens on the server (services/tools/worker.py → rembg)
 * behind /api/job with product=bg-remove. On the web there is also an opt-in
 * prototype path that runs the matting in the browser itself (lib/bg-local.ts,
 * “on this device” below) — a photo then never leaves the phone and the VM that
 * serves the live site does not have to do the work.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { canDownloadFile, formatBytes, openResult, pickFile, runJob, saveDataUrl, type JobResult, type PickedFile } from "@/lib/tools";
import { UnlockRow } from "@/components/unlock-row";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";
import { ON_DEVICE_MODEL, cutOutOnDevice, onDeviceSupported, type OnDeviceCut } from "@/lib/bg-local";

/** The transparency checkerboard, drawn from Views so it needs no asset.
 *  Colours come from the palette: a checkerboard outside the palette reads as a
 *  bug on a dark screen. */
function Checker({ ui, rows = 9, cols = 6 }: { ui: ProductUI; rows?: number; cols?: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flex: 1, flexDirection: "row" }}>
          {Array.from({ length: cols }).map((__, c) => (
            <View
              key={c}
              style={{ flex: 1, backgroundColor: (r + c) % 2 ? ui.c.surfaceInset : ui.surface }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function BackgroundRemover() {
  const ui = useProductUI("bg-remove");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [job, setJob] = useState<JobResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  /** The prototype flag. Off by default: the server path is the product. */
  const [onDevice, setOnDevice] = useState(false);
  const [local, setLocal] = useState<OnDeviceCut | null>(null);

  const canRunOnDevice = onDeviceSupported();

  async function choose() {
    setError(null);
    setSaved(false);
    try {
      const picked = await pickFile("image");
      if (!picked) return;
      setFile(picked);
      setJob(null);
      setLocal(null);
      if (onDevice && canRunOnDevice) await runCutHere(picked);
      else await runCut(picked);
    } catch (e: any) {
      setError(e?.message || "Could not open a photo picker on this device.");
    }
  }

  /** The server path — unchanged, and what the app uses unless the flag is on. */
  async function runCut(picked: PickedFile) {
    setBusy(true);
    setError(null);
    try {
      const result = await runJob({ product: "bg-remove", files: [{ field: "file", file: picked }] });
      setJob(result);
      if (!result.previewUrl && !result.outputUrl) {
        setError("The server finished without a file. Nothing was charged — try again.");
      }
    } catch (e: any) {
      setError(e?.message || "The cut-out failed. Try another photo.");
    } finally {
      setBusy(false);
    }
  }

  /** The prototype path: the matting runs in this browser (web only). */
  async function runCutHere(picked: PickedFile) {
    setBusy(true);
    setError(null);
    try {
      const cut = await cutOutOnDevice(picked.uri);
      setLocal(cut);
    } catch (e: any) {
      setError(
        e?.message ||
          "The on-device cut-out did not run. The model is downloaded once, so this needs a connection the first time — or switch it off and use the server.",
      );
    } finally {
      setBusy(false);
    }
  }

  const shown = local?.dataUrl ?? job?.previewUrl ?? job?.outputUrl ?? file?.uri ?? null;
  const done = !!local || !!job?.previewUrl || !!job?.outputUrl;
  const busyLine = onDevice && canRunOnDevice ? "Cutting the background on this device…" : "Cutting the background…";

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>FREE PREVIEW · PNG WITH A CLEAR BACKGROUND</Text>
        <Text style={s.price}>₹99</Text>
      </View>

      <Text style={s.h1}>Remove the{"\n"}background</Text>
      <Text style={s.sub}>
        Choose a photo. The background comes off and you get a PNG you can drop onto a form,
        a poster or a shop listing.
      </Text>

      {canRunOnDevice ? (
        <Pressable
          style={[s.flagRow, onDevice && s.flagRowOn]}
          onPress={() => setOnDevice((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ selected: onDevice }}
        >
          <Text style={[s.flagMark, onDevice && s.flagMarkOn]}>{onDevice ? "\u25c9" : "\u25cb"}</Text>
          <View style={s.flagText}>
            <Text style={s.flagTitle}>Cut it on this device — prototype</Text>
            <Text style={s.flagSub}>
              {onDevice
                ? `The first cut downloads a ${formatBytes(ON_DEVICE_MODEL.bytes)} model (${ON_DEVICE_MODEL.id}, ${ON_DEVICE_MODEL.licence}) and then runs in this browser. The photo is not uploaded.`
                : "Runs the matting in your browser instead of on the server. Nothing is uploaded, nothing is charged."}
            </Text>
          </View>
        </Pressable>
      ) : null}

      <View style={s.frame}>
        {shown ? (
          <>
            <Checker ui={ui} />
            <View style={s.fill}>
              <Image source={{ uri: shown }} style={s.fill} resizeMode="contain" />
            </View>
            {busy ? (
              <View style={s.scrim}>
                <ActivityIndicator color={ui.accent} />
                <Text style={s.scrimText}>{busyLine}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={s.empty}>
            {busy ? (
              <>
                <ActivityIndicator color={ui.accent} />
                <Text style={s.emptyText}>{busyLine}</Text>
              </>
            ) : (
              <>
                <Text style={s.emptyTitle}>No photo yet</Text>
                <Text style={s.emptyText}>
                  The grey squares are where the background will be. Clear means see-through,
                  so you can put this photo over any colour.
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {file && done ? (
        <View style={s.fileRow}>
          <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
          <Text style={s.fileMeta}>{formatBytes(file.size)}</Text>
        </View>
      ) : null}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, busy && s.dim]}
        onPress={choose}
        disabled={busy}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryText}>{file ? "Choose another photo" : "Choose a photo"}</Text>
        )}
      </Pressable>

      {done && !busy ? (
        local ? (
          <Pressable
            style={s.secondary}
            onPress={() => {
              if (saveDataUrl(local.dataUrl, `${(file?.name ?? "photo").replace(/\.[^.]+$/, "")}-nobg.png`)) {
                setSaved(true);
              }
            }}
            accessibilityRole="button"
          >
            <Text style={s.secondaryText}>Save the PNG</Text>
          </Pressable>
        ) : job?.locked && job.jobId ? (
          <UnlockRow
            job={job}
            // Per-product placement: "which paywall converts on an ad" is a real
            // question and a shared key could not answer it.
            placement="job.unlock-rewarded.bg-remove"
            paidLabel={`Unlock the clean PNG · ₹${Math.round((job.pricePaise || 9900) / 100)}`}
            paidNote="The unpaid preview above is watermarked on purpose."
            onUnlocked={(url) => setJob({ ...job, locked: false, outputUrl: url })}
          />
        ) : (
          <Pressable
            style={s.secondary}
            onPress={async () => {
              const url = job?.outputUrl ?? job?.previewUrl;
              if (!url) return;
              await openResult(url, `${(file?.name ?? "photo").replace(/\.[^.]+$/, "")}-nobg.png`);
              setSaved(true);
            }}
            accessibilityRole="button"
          >
            <Text style={s.secondaryText}>
              {canDownloadFile() ? "Save the PNG" : "Open the PNG"}
            </Text>
          </Pressable>
        )
      ) : null}

      {local ? (
        <Text style={s.hint}>
          On this device: {local.modelFetched
            ? `the model came down in ${(local.loadMs / 1000).toFixed(1)} s and the cut took ${(local.inferMs / 1000).toFixed(1)} s`
            : `the cut took ${(local.inferMs / 1000).toFixed(1)} s (the model was already downloaded)`}
          , the PNG is {formatBytes(local.pngBytes)} at {local.width}×{local.height}. Your photo was not uploaded.
        </Text>
      ) : null}

      {done && job?.locked ? (
        <Text style={s.hint}>
          The preview above is watermarked on purpose. The file you unlock keeps full
          transparency and is not marked.
        </Text>
      ) : null}

      {done && !busy && !local && !canDownloadFile() ? (
        <Text style={s.hint}>
          On a phone the PNG opens full size; saving it into your gallery needs the photo
          library module, which is not in this build yet.
        </Text>
      ) : null}

      {saved ? <Text style={s.hint}>Saved. The file keeps its transparency.</Text> : null}

      {file && !done && !busy && !error ? (
        <Pressable style={s.secondary} onPress={() => (onDevice && canRunOnDevice ? runCutHere(file) : runCut(file))} accessibilityRole="button">
          <Text style={s.secondaryText}>Try the cut-out again</Text>
        </Pressable>
      ) : null}

      <Text style={s.foot}>
        {local
          ? "This cut ran in your browser as a prototype. The server path — a free watermarked preview, and ₹99 for the clean PNG — is unchanged and is what the app uses with this switch off."
          : "The cut-out preview is free and watermarked. ₹99 unlocks the clean PNG, which keeps its transparency and has no mark."}
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
    badgeRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md,
    },
    badge: { ...type.caption, color: ui.accent, flexShrink: 1 },
    price: { ...type.title2, color: ui.ink },
    h1: { ...type.hero, color: ui.ink, marginBottom: space.sm },
    sub: { ...type.callout, color: ui.muted, marginBottom: space.base },
    // The prototype switch. A plain Pressable with onPress (not onPressIn): on
    // react-native-web a press shorter than 50 ms is dropped without it.
    flagRow: {
      flexDirection: "row", alignItems: "flex-start", gap: space.sm,
      borderWidth: 1, borderColor: ui.hairline, borderRadius: radius.md,
      padding: space.md, backgroundColor: ui.surface, marginBottom: space.base,
    },
    flagRowOn: { borderColor: ui.accent },
    flagMark: { ...type.title3, color: ui.faint, lineHeight: 22 },
    flagMarkOn: { color: ui.accent },
    flagText: { flex: 1, gap: 2 },
    flagTitle: { ...productText.label, color: ui.ink },
    flagSub: { ...productText.fine, color: ui.muted },
    frame: {
      height: 280,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: ui.hairline,
      overflow: "hidden",
      backgroundColor: ui.surface,
      justifyContent: "center",
    },
    fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    scrim: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      // materialHeavy is the token for "a surface that must stay legible over
      // unknown content" — exactly what a progress scrim is.
      backgroundColor: ui.c.materialHeavy,
      alignItems: "center",
      justifyContent: "center",
      gap: space.sm,
    },
    scrimText: { ...type.meta, color: ui.accent },
    empty: { alignItems: "center", justifyContent: "center", padding: space.lg, gap: space.sm },
    emptyTitle: { ...type.title3, color: ui.ink },
    emptyText: { ...type.meta, color: ui.muted, textAlign: "center" },
    fileRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginTop: space.md, gap: space.sm,
    },
    fileName: { ...productText.label, color: ui.ink, flexShrink: 1 },
    fileMeta: { ...productText.fine, color: ui.muted },
    primary: {
      backgroundColor: ui.accent, borderRadius: radius.md, paddingVertical: space.base,
      minHeight: ui.touch, alignItems: "center", justifyContent: "center", marginTop: space.base,
    },
    dim: { opacity: 0.7 },
    primaryText: { ...productText.button, color: "#fff" },
    secondary: {
      borderWidth: 1.5,
      borderColor: ui.accent,
      borderRadius: radius.md,
      paddingVertical: space.base,
      minHeight: ui.touch,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.md,
      backgroundColor: ui.surface,
    },
    secondaryText: { ...productText.button, color: ui.accent },
    error: { ...type.meta, color: ui.error, marginTop: space.md },
    hint: { ...type.meta, color: ui.muted, marginTop: space.md },
    foot: { ...productText.fine, color: ui.faint, marginTop: space.base, textAlign: "center" },
  });
}
