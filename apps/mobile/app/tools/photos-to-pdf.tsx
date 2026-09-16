/**
 * Photos to PDF.
 *
 * What people actually use this for: the set of ID and address photos a form
 * demands, a shop's stock shots for a wholesaler, a homework set for a teacher.
 * So the pages are a real paper size at a legible resolution, one photo per
 * page, **in the order the photos were picked** — the stack on screen is the
 * order of the document, so it is visible and editable rather than implied.
 *
 * The engine (services/tools/worker.py → `photos_to_pdf`, pdfcpu `import`)
 * centres each photo on the page keeping its own shape; stretching every photo
 * to fill the page is how a wide stock shot arrives distorted.
 *
 * Free: pdfcpu is already installed on the VM, so a job costs nothing to run.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import {
  MULTI_MAX, canDownloadFile, formatBytes, openResult, pickFiles, runJob,
  type JobResult, type PickedFile,
} from "@/lib/tools";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";

/** Mirrors PDF_PAGE_FORMATS in services/tools/worker.py and the route's checker. */
const PAGE_SIZES: { value: string; label: string; note: string }[] = [
  { value: "a4", label: "A4", note: "the usual form size" },
  { value: "letter", label: "Letter", note: "US letter" },
  { value: "a5", label: "A5", note: "half of A4 — a booklet" },
];

type PdfMeta = {
  page_format?: string;
  pages_out?: number;
  photos?: number;
  bytes_out?: number;
  dpi?: number;
};

export default function PhotosToPdf() {
  const ui = useProductUI("photos-to-pdf");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [size, setSize] = useState("a4");
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropped, setDropped] = useState(0);
  const [saved, setSaved] = useState(false);

  const meta = (job?.meta ?? {}) as PdfMeta;
  const full = files.length >= MULTI_MAX;
  const sizeLabel = PAGE_SIZES.find((p) => p.value === size)?.label ?? "A4";

  async function add() {
    setError(null);
    setJob(null);
    setSaved(false);
    setDropped(0);
    try {
      const picked = await pickFiles("image", { multiple: true });
      if (!picked.length) return;
      const room = MULTI_MAX - files.length;
      if (picked.length > room) setDropped(picked.length - room);
      setFiles((prev) => [...prev, ...picked].slice(0, MULTI_MAX));
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
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const result = await runJob({
        product: "photos-to-pdf",
        fields: { pagesize: size },
        files: files.map((f) => ({ field: "file", file: f })),
      });
      setJob(result);
      if (!result.outputUrl && !result.previewUrl) {
        setError("The server finished without a PDF. Nothing was charged — try again.");
      }
    } catch (e: any) {
      setError(e?.message || "The PDF could not be made. Try fewer or smaller photos.");
    } finally {
      setBusy(false);
    }
  }

  const pdfUrl = job?.outputUrl ?? job?.previewUrl ?? null;
  const done = !!pdfUrl;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>FREE · ONE PHOTO PER PAGE</Text>
        <Text style={s.price}>₹0</Text>
      </View>

      <Text style={s.h1}>Photos into{"\n"}one PDF</Text>
      <Text style={s.sub}>
        Choose up to {MULTI_MAX} photos. Each one becomes a page, in the order below — the
        order is the document, so check it before you press the button.
      </Text>

      {files.length ? (
        <View style={s.stack}>
          {files.map((f, i) => (
            <View key={`${f.name}-${i}`} style={s.row}>
              <Text style={s.rowIndex}>{i + 1}</Text>
              <Image source={{ uri: f.uri }} style={s.thumb} resizeMode="cover" />
              <View style={s.rowBody}>
                <Text style={s.rowName} numberOfLines={1}>{f.name}</Text>
                <Text style={s.rowMeta}>page {i + 1} · {formatBytes(f.size) || "size unknown"}</Text>
              </View>
              <Pressable
                onPress={() => remove(i)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${f.name} from the PDF`}
                hitSlop={8}
                style={s.remove}
              >
                <Text style={s.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No photos yet</Text>
          <Text style={s.emptyText}>
            Nothing is uploaded until you press the button below, and no photo is resized
            before you can see the order.
          </Text>
        </View>
      )}

      {dropped > 0 ? (
        <Text style={s.hint}>
          {dropped} photo{dropped > 1 ? "s" : ""} left out — one PDF holds {MULTI_MAX}.
        </Text>
      ) : null}

      <Text style={s.pickerLabel}>Page size</Text>
      <View style={s.chipRow}>
        {PAGE_SIZES.map((p) => {
          const on = p.value === size;
          return (
            <Pressable
              key={p.value}
              onPress={() => {
                setSize(p.value);
                setJob(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[s.chip, on && s.chipOn]}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.pickerNote}>
        {PAGE_SIZES.find((p) => p.value === size)?.note} · each photo is centred on the page
        keeping its own shape, so nothing is stretched.
      </Text>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {done ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>The PDF is ready</Text>
          <Text style={s.cardNote}>
            {meta.pages_out ?? files.length} page{(meta.pages_out ?? files.length) === 1 ? "" : "s"} ·{" "}
            {meta.page_format ?? sizeLabel} · {formatBytes(meta.bytes_out) || "size unknown"}
          </Text>
          <Text style={s.cardFine}>
            Every page is a real page, not a picture pasted into a viewer — a printer or a
            form portal reads it like any other PDF.
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[s.primary, (busy || !files.length) && s.dim]}
        onPress={make}
        disabled={busy || !files.length}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryText}>
            {files.length
              ? `Make the PDF · ${files.length} page${files.length === 1 ? "" : "s"}`
              : "Add photos first"}
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
          {full ? `That is all ${MULTI_MAX} photos` : files.length ? "Add more photos" : "Add photos"}
        </Text>
      </Pressable>

      {done && !busy ? (
        <Pressable
          style={s.secondary}
          onPress={async () => {
            if (!pdfUrl) return;
            await openResult(pdfUrl, "photos.pdf");
            setSaved(true);
          }}
          accessibilityRole="button"
        >
          <Text style={s.secondaryText}>
            {canDownloadFile() ? "Save the PDF" : "Open the PDF"}
          </Text>
        </Pressable>
      ) : null}

      {saved ? <Text style={s.hint}>Saved. Check the page order before you send it.</Text> : null}

      <Text style={s.foot}>
        Free — the pages are assembled on our own server with pdfcpu, so nothing is sent to
        a paid conversion service.
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
    stack: { gap: space.sm },
    row: {
      flexDirection: "row", alignItems: "center", gap: space.sm,
      backgroundColor: ui.surface, borderWidth: 1, borderColor: ui.hairline,
      borderRadius: radius.sm, padding: space.sm,
    },
    rowIndex: { ...productText.label, color: ui.faint, width: 18, textAlign: "center" },
    thumb: { width: 44, height: 44, borderRadius: radius.xs, backgroundColor: ui.c.surfaceInset },
    rowBody: { flex: 1, gap: 2 },
    rowName: { ...productText.label, color: ui.ink },
    rowMeta: { ...productText.fine, color: ui.muted },
    remove: { paddingHorizontal: 6, paddingVertical: 4 },
    removeText: { ...productText.label, color: ui.error },
    empty: {
      borderWidth: 1, borderColor: ui.hairline, borderStyle: "dashed", borderRadius: radius.md,
      padding: space.lg, alignItems: "center", gap: space.sm, backgroundColor: ui.surface,
    },
    emptyTitle: { ...type.title3, color: ui.ink },
    emptyText: { ...type.meta, color: ui.muted, textAlign: "center" },
    pickerLabel: { ...productText.label, color: ui.ink, marginTop: space.base, marginBottom: space.sm },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderWidth: 1, borderColor: ui.hairline, borderRadius: radius.sm,
      paddingHorizontal: 14, paddingVertical: 8, backgroundColor: ui.surface,
    },
    chipOn: { borderColor: ui.accent, backgroundColor: ui.accentTint },
    chipText: { ...productText.label, color: ui.muted },
    chipTextOn: { color: ui.accent },
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
