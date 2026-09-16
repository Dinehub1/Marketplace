/**
 * Photo collage.
 *
 * Two to four photos onto one sheet — the shapes people actually post: two
 * side by side, three in a strip, four in a square. Every tile is cut to the
 * same cell, so the sheet reads as one picture instead of four photos of
 * different heights pasted together. Letterboxing instead would leave them
 * floating in white bars, which looks like a bug next to a strip that fits.
 *
 * The engine (services/tools/worker.py → `collage`) rejects a shape that cannot
 * hold the photos it was given ("a 2x1 sheet holds only 2 photos"). The screen
 * says the same thing *before* the upload — a chip that cannot work is dimmed
 * with the reason on it rather than left to fail on the server.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import {
  canDownloadFile, formatBytes, openResult, pickFiles, runJob,
  type JobResult, type PickedFile,
} from "@/lib/tools";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";

/** Mirrors COLLAGE_LAYOUTS in services/tools/worker.py, with the cells it holds. */
const LAYOUTS: { value: string; label: string; holds: number; note: string }[] = [
  { value: "auto", label: "Auto", holds: 4, note: "we pick the shape that fits" },
  { value: "2x1", label: "2 across", holds: 2, note: "two side by side" },
  { value: "1x2", label: "2 down", holds: 2, note: "two stacked" },
  { value: "2x2", label: "2 × 2", holds: 4, note: "a square of four" },
  { value: "3x1", label: "3 across", holds: 3, note: "a strip of three" },
];

const MAX_PHOTOS = 4;

type CollageMeta = {
  grid?: string;
  photos?: number;
  cell_px?: number;
  gap?: number;
  size_out?: string;
  bytes_out?: number;
};

export default function PhotoCollage() {
  const ui = useProductUI("collage");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [layout, setLayout] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const meta = (job?.meta ?? {}) as CollageMeta;
  const chosen = LAYOUTS.find((l) => l.value === layout)!;
  const layoutOk = chosen.value === "auto" || chosen.holds >= files.length;
  const enough = files.length >= 2;
  const full = files.length >= MAX_PHOTOS;
  const ready = enough && layoutOk && !busy;

  async function add() {
    setError(null);
    setJob(null);
    setSaved(false);
    try {
      const picked = await pickFiles("image", { multiple: true });
      if (!picked.length) return;
      const room = MAX_PHOTOS - files.length;
      const next = [...files, ...picked].slice(0, MAX_PHOTOS);
      setFiles(next);
      // Pick a shape the new set can actually fill, rather than leaving a chip
      // selected that the engine would refuse.
      if (chosen.value !== "auto" && chosen.holds < next.length) setLayout("auto");
    } catch (e: any) {
      setError(e?.message || "Could not open a photo picker on this device.");
    }
  }

  function remove(index: number) {
    setJob(null);
    setSaved(false);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function make() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const result = await runJob({
        product: "collage",
        fields: { layout },
        files: files.map((f) => ({ field: "file", file: f })),
      });
      setJob(result);
      if (!result.previewUrl && !result.outputUrl) {
        setError("The server finished without an image. Nothing was charged — try again.");
      }
    } catch (e: any) {
      setError(e?.message || "The collage could not be made. Try fewer photos.");
    } finally {
      setBusy(false);
    }
  }

  const shown = job?.previewUrl ?? job?.outputUrl ?? null;
  const done = !!shown;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>FREE · 2 TO 4 PHOTOS ON ONE SHEET</Text>
        <Text style={s.price}>₹0</Text>
      </View>

      <Text style={s.h1}>A few photos,{"\n"}one picture</Text>
      <Text style={s.sub}>
        Pick 2 to 4 photos and the shape. Every tile is cut to the same cell, so no photo
        keeps a taller frame than its neighbour.
      </Text>

      <View style={s.frame}>
        {shown ? (
          <>
            <Image source={{ uri: shown }} style={s.fill} resizeMode="contain" />
            {busy ? (
              <View style={s.scrim}>
                <ActivityIndicator color={ui.accent} />
                <Text style={s.scrimText}>Laying out the sheet…</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={s.empty}>
            {busy ? (
              <>
                <ActivityIndicator color={ui.accent} />
                <Text style={s.emptyText}>Laying out the sheet…</Text>
              </>
            ) : (
              <>
                <Text style={s.emptyTitle}>No sheet yet</Text>
                <Text style={s.emptyText}>
                  Add your photos below. The collage appears here at full size, and you can
                  try another shape without picking the photos again.
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {files.length ? (
        <View style={s.strip}>
          {files.map((f, i) => (
            <View key={`${f.name}-${i}`} style={s.tileWrap}>
              <Image source={{ uri: f.uri }} style={s.tile} resizeMode="cover" />
              <Pressable
                onPress={() => remove(i)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${f.name} from the collage`}
                hitSlop={8}
                style={s.remove}
              >
                <Text style={s.removeText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={s.pickerLabel}>Shape</Text>
      <View style={s.chipRow}>
        {LAYOUTS.map((l) => {
          const on = l.value === layout;
          const canHold = l.value === "auto" || l.holds >= files.length;
          return (
            <Pressable
              key={l.value}
              onPress={() => {
                if (!canHold) return;
                setLayout(l.value);
                setJob(null);
              }}
              disabled={!canHold}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: !canHold }}
              style={[s.chip, on && s.chipOn, !canHold && s.chipOff]}
            >
              <Text style={[s.chipText, on && s.chipTextOn, !canHold && s.chipTextOff]}>{l.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.pickerNote}>
        {layoutOk
          ? `${chosen.note}.`
          : `${chosen.label} holds ${chosen.holds} photo${chosen.holds === 1 ? "" : "s"} — you have ${files.length}.`}
      </Text>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {done ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>Sheet ready</Text>
          <Text style={s.cardNote}>
            {meta.photos ?? files.length} photos in {meta.grid ?? "a grid"} ·{" "}
            {meta.size_out ?? "size unknown"} · {formatBytes(meta.bytes_out) || ""}
          </Text>
          <Text style={s.cardFine}>
            {meta.cell_px ? `Each cell is ${meta.cell_px} px, ` : ""}saved as a JPEG — the
            format every social app accepts without asking questions.
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[s.primary, !ready && s.dim]}
        onPress={make}
        disabled={!ready}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryText}>
            {!enough
              ? `Add ${2 - files.length} more photo${files.length === 1 ? "" : "s"}`
              : `Make the collage · ${files.length} photos`}
          </Text>
        )}
      </Pressable>

      <Pressable
        style={[s.secondary, full && s.dim]}
        onPress={add}
        disabled={full}
        accessibilityRole="button"
      >
        <Text style={s.secondaryText}>
          {full ? `That is all ${MAX_PHOTOS} photos` : files.length ? "Add more photos" : "Add photos"}
        </Text>
      </Pressable>

      {done && !busy ? (
        <Pressable
          style={s.secondary}
          onPress={async () => {
            if (!shown) return;
            await openResult(shown, "collage.jpg");
            setSaved(true);
          }}
          accessibilityRole="button"
        >
          <Text style={s.secondaryText}>{canDownloadFile() ? "Save the collage" : "Open the collage"}</Text>
        </Pressable>
      ) : null}

      {saved ? <Text style={s.hint}>Saved. The tile order follows the photos above.</Text> : null}

      <Text style={s.foot}>
        Free — the sheet is cut and laid out on our own server, so there is no per-photo
        charge and nothing goes to a paid collage service.
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
    frame: {
      height: 300, borderRadius: radius.md, borderWidth: 1, borderColor: ui.hairline,
      overflow: "hidden", backgroundColor: ui.surface, justifyContent: "center",
    },
    fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
    scrim: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: ui.c.materialHeavy, alignItems: "center", justifyContent: "center", gap: space.sm,
    },
    scrimText: { ...type.meta, color: ui.accent },
    empty: { alignItems: "center", justifyContent: "center", padding: space.lg, gap: space.sm },
    emptyTitle: { ...type.title3, color: ui.ink },
    emptyText: { ...type.meta, color: ui.muted, textAlign: "center" },
    strip: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
    tileWrap: { position: "relative" },
    tile: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: ui.c.surfaceInset },
    remove: {
      position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
      backgroundColor: ui.surface, borderWidth: 1, borderColor: ui.hairline,
      alignItems: "center", justifyContent: "center",
    },
    removeText: { ...productText.label, color: ui.error, lineHeight: 18 },
    pickerLabel: { ...productText.label, color: ui.ink, marginTop: space.base, marginBottom: space.sm },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderWidth: 1, borderColor: ui.hairline, borderRadius: radius.sm,
      paddingHorizontal: 14, paddingVertical: 8, backgroundColor: ui.surface,
    },
    chipOn: { borderColor: ui.accent, backgroundColor: ui.accentTint },
    chipOff: { opacity: 0.45 },
    chipText: { ...productText.label, color: ui.muted },
    chipTextOn: { color: ui.accent },
    chipTextOff: { color: ui.faint },
    pickerNote: { ...type.meta, color: ui.muted, marginTop: space.sm },
    card: {
      marginTop: space.base, backgroundColor: ui.surface, borderWidth: 1,
      borderColor: ui.hairline, borderRadius: radius.md, padding: space.md, gap: 4,
    },
    cardTitle: { ...productText.label, color: ui.ink },
    cardNote: { ...type.meta, color: ui.muted },
    cardFine: { ...productText.fine, color: ui.faint, marginTop: 2 },
    primary: {
      backgroundColor: ui.accent, borderRadius: radius.md, paddingVertical: space.base,
      minHeight: ui.touch, alignItems: "center", justifyContent: "center", marginTop: space.base,
    },
    dim: { opacity: 0.6 },
    primaryText: { ...productText.button, color: "#fff" },
    secondary: {
      borderWidth: 1.5, borderColor: ui.accent, borderRadius: radius.md,
      paddingVertical: space.base, minHeight: ui.touch, alignItems: "center",
      justifyContent: "center", marginTop: space.md, backgroundColor: ui.surface,
    },
    secondaryText: { ...productText.button, color: ui.accent },
    error: { ...type.meta, color: ui.error, marginTop: space.md },
    hint: { ...type.meta, color: ui.muted, marginTop: space.md },
    foot: { ...productText.fine, color: ui.faint, marginTop: space.base, textAlign: "center" },
  });
}
