/**
 * Photo metadata cleaner.
 *
 * A photo file carries more than the picture: where it was taken, which phone
 * took it, at what second, and sometimes the software that edited it. People
 * share shop photos, ID photos and homework photos without knowing their home
 * coordinates are inside the file.
 *
 * So this screen does one job and then *shows its work*: it lists the tags the
 * photo arrived with, and the tags the file you download carries — read back
 * from the saved file by the engine, not claimed here. A cleaner that says
 * "done" without saying what it removed is indistinguishable from one that did
 * nothing.
 *
 * The picture itself is untouched: same pixels, same dimensions. Only the tags
 * go. That is why it is free — the engine (services/tools/worker.py, op
 * `strip-exif` behind product=exif-strip) is a re-save, not a cloud call.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import {
  canDownloadFile, formatBytes, openResult, pickFile, runJob,
  type JobResult, type PickedFile,
} from "@/lib/tools";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";

/** The engine's tag slugs, in words a shopkeeper reads rather than "0x9003". */
const TAG_LABELS: Record<string, string> = {
  gps: "Where it was taken (GPS)",
  make: "Phone or camera make",
  model: "Phone or camera model",
  software: "App that edited it",
  datetime: "Date and time",
  taken: "Date and time it was shot",
  orientation: "Which way up it was",
  width: "Pixel width",
  height: "Pixel height",
};

const label = (tag: string) => TAG_LABELS[tag] ?? tag;

type StripMeta = {
  exif_in?: string[];
  exif_out?: string[];
  size_in?: string;
  size_out?: string;
  bytes_in?: number;
  bytes_out?: number;
  content_type?: string;
};

export default function PhotoMetadataCleaner() {
  const ui = useProductUI("exif-strip");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [job, setJob] = useState<JobResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const meta = (job?.meta ?? {}) as StripMeta;
  const arrived = meta.exif_in ?? [];
  const carried = meta.exif_out ?? [];

  async function choose() {
    setError(null);
    setSaved(false);
    try {
      const picked = await pickFile("image");
      if (!picked) return;
      setFile(picked);
      setJob(null);
      await clean(picked);
    } catch (e: any) {
      setError(e?.message || "Could not open a photo picker on this device.");
    }
  }

  async function clean(picked: PickedFile) {
    setBusy(true);
    setError(null);
    try {
      const result = await runJob({ product: "exif-strip", files: [{ field: "file", file: picked }] });
      setJob(result);
      if (!result.previewUrl && !result.outputUrl) {
        setError("The server finished without a file. Nothing was charged — try again.");
      }
    } catch (e: any) {
      setError(e?.message || "The clean copy failed. Try another photo.");
    } finally {
      setBusy(false);
    }
  }

  const shown = job?.previewUrl ?? job?.outputUrl ?? file?.uri ?? null;
  const done = !!job?.previewUrl || !!job?.outputUrl;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>FREE · TAGS REMOVED ON THE SERVER</Text>
        <Text style={s.price}>₹0</Text>
      </View>

      <Text style={s.h1}>Clean the{"\n"}details off</Text>
      <Text style={s.sub}>
        Choose a photo. You get the same picture back with no location, no camera name,
        no timestamp and no editing history inside the file.
      </Text>

      <View style={s.frame}>
        {shown ? (
          <>
            <Image source={{ uri: shown }} style={s.fill} resizeMode="contain" />
            {busy ? (
              <View style={s.scrim}>
                <ActivityIndicator color={ui.accent} />
                <Text style={s.scrimText}>Removing the tags…</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={s.empty}>
            {busy ? (
              <>
                <ActivityIndicator color={ui.accent} />
                <Text style={s.emptyText}>Removing the tags…</Text>
              </>
            ) : (
              <>
                <Text style={s.emptyTitle}>No photo yet</Text>
                <Text style={s.emptyText}>
                  The picture stays exactly as it is. Only the hidden tags leave — this is
                  not a filter and it does not change how the photo looks.
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {file ? (
        <View style={s.fileRow}>
          <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
          <Text style={s.fileMeta}>{formatBytes(file.size)}</Text>
        </View>
      ) : null}

      {error ? <Text style={s.error}>{error}</Text> : null}

      {done ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>What was inside the file</Text>
          {arrived.length ? (
            arrived.map((t) => (
              <View key={t} style={s.tagRow}>
                <Text style={s.tagDot}>•</Text>
                <Text style={s.tagText}>{label(t)}</Text>
                <Text style={s.tagGone}>removed</Text>
              </View>
            ))
          ) : (
            <Text style={s.cardNote}>
              This photo had no identifying tags to begin with, so there was nothing to
              remove. It is safe to post as it is.
            </Text>
          )}

          <Text style={[s.cardTitle, s.cardTitleSpaced]}>What the file you download carries</Text>
          {carried.length ? (
            carried.map((t) => (
              <View key={t} style={s.tagRow}>
                <Text style={s.tagDot}>•</Text>
                <Text style={s.tagText}>{label(t)}</Text>
                <Text style={s.tagKept}>kept</Text>
              </View>
            ))
          ) : (
            <Text style={s.cardNote}>
              Nothing. That line is read back from the copy the server saved, not from a
              list it promised to remove.
            </Text>
          )}

          {meta.size_out ? (
            <Text style={s.cardFine}>
              Picture {meta.size_in ?? "?"} → {meta.size_out} · file{" "}
              {formatBytes(meta.bytes_in)} → {formatBytes(meta.bytes_out)}
            </Text>
          ) : null}
        </View>
      ) : null}

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
        <Pressable
          style={s.secondary}
          onPress={async () => {
            const url = job?.outputUrl ?? job?.previewUrl;
            if (!url) return;
            await openResult(url, `${(file?.name ?? "photo").replace(/\.[^.]+$/, "")}-clean.jpg`);
            setSaved(true);
          }}
          accessibilityRole="button"
        >
          <Text style={s.secondaryText}>
            {canDownloadFile() ? "Save the cleaned photo" : "Open the cleaned photo"}
          </Text>
        </Pressable>
      ) : null}

      {saved ? <Text style={s.hint}>Saved. The tags are not in the copy.</Text> : null}

      {file && !done && !busy && !error ? (
        <Pressable style={s.secondary} onPress={() => clean(file)} accessibilityRole="button">
          <Text style={s.secondaryText}>Try again</Text>
        </Pressable>
      ) : null}

      <Text style={s.foot}>
        Free — the removal is a re-save on our own server, so it costs nothing to run and
        nothing is sent to any photo service.
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
      height: 240,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: ui.hairline,
      overflow: "hidden",
      backgroundColor: ui.surface,
      justifyContent: "center",
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
    fileRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginTop: space.md, gap: space.sm,
    },
    fileName: { ...productText.label, color: ui.ink, flexShrink: 1 },
    fileMeta: { ...productText.fine, color: ui.muted },
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
    cardTitleSpaced: { marginTop: space.md },
    cardNote: { ...type.meta, color: ui.muted },
    cardFine: { ...productText.fine, color: ui.faint, marginTop: space.sm },
    tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    tagDot: { ...type.meta, color: ui.faint },
    tagText: { ...type.meta, color: ui.ink, flexShrink: 1 },
    tagGone: { ...productText.tag, color: ui.c.positive, marginLeft: "auto" },
    tagKept: { ...productText.tag, color: ui.c.warning, marginLeft: "auto" },
    primary: {
      backgroundColor: ui.accent, borderRadius: radius.md, paddingVertical: space.base,
      minHeight: ui.touch, alignItems: "center", justifyContent: "center", marginTop: space.base,
    },
    dim: { opacity: 0.7 },
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
