/**
 * PDF toolkit.
 *
 * Three jobs that people actually open a PDF app for, chosen as three cards of
 * equal weight instead of a dropdown — you can see what the app can do before
 * you have picked a file, which is the point of a toolkit screen.
 *
 * The file list is a stack, not a text field: the order of the stack is the
 * order of the merge, so it has to be visible and editable. Split and compress
 * take exactly one file, and the screen drops the rest rather than quietly
 * processing a file the user forgot was still loaded.
 *
 * The work runs on the server behind /api/job with product=pdf-tools.
 */
import { useState } from "react";
import { isPageRange, PDF_PAGES_HINT } from "@hermes/core";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { canDownloadFile, formatBytes, openResult, pickFile, runJob, type JobResult, type PickedFile } from "@/lib/tools";

const RED = "#b91c1c";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const BG = "#f8fafc";

type ActionId = "merge" | "split" | "compress" | "rotate" | "page-numbers";

const ACTIONS: { id: ActionId; name: string; job: string; needs: string }[] = [
  { id: "merge", name: "Merge", job: "Two or more PDFs into one, in the order below.", needs: "2+ files" },
  { id: "split", name: "Split pages", job: "Keep a page range, drop the rest.", needs: "1 file" },
  { id: "compress", name: "Compress", job: "Shrink a scan before mailing or sharing it.", needs: "1 file" },
  { id: "rotate", name: "Rotate", job: "Turn pages the right way up — a sideways scan, or one page.", needs: "1 file" },
  { id: "page-numbers", name: "Page numbers", job: "Stamp \"Page 3 of 12\" where a reader looks for it.", needs: "1 file" },
];

/**
 * The three turns that look different, and only those the engine can actually do:
 * measured 2026-09-16, `angle=-90|-180|-270` answers 500 ("unknown shorthand flag
 * '9' in -90") because pdfcpu reads a leading dash as a flag. So the screen sends
 * the positive values only, and the labels name the turn, not a direction pdfcpu
 * has not been asked to confirm.
 */
const ANGLES: { value: string; label: string; hint: string }[] = [
  { value: "90", label: "90°", hint: "one quarter turn" },
  { value: "180", label: "180°", hint: "a half turn — the page upside down" },
  { value: "270", label: "270°", hint: "three quarter turns — the other quarter" },
];

/**
 * The 1..9 grid the engine maps onto pdfcpu's stamp anchors, in reading order so
 * the picker looks like the page it is addressing (1 top-left, 9 bottom-right).
 */
const POSITIONS: { value: string; label: string; short: string }[] = [
  { value: "1", label: "top left", short: "↖" },
  { value: "2", label: "top centre", short: "↑" },
  { value: "3", label: "top right", short: "↗" },
  { value: "4", label: "middle left", short: "←" },
  { value: "5", label: "middle", short: "•" },
  { value: "6", label: "middle right", short: "→" },
  { value: "7", label: "bottom left", short: "↙" },
  { value: "8", label: "bottom centre", short: "↓" },
  { value: "9", label: "bottom right", short: "↘" },
];

/** pdfcpu writes %p/%P; the engine also takes {n}/{total}. Both are shown. */
const DEFAULT_NUMBER_TEXT = "Page {n} of {total}";

/**
 * The split's output file is named after the range the user asked for, in a form
 * a filesystem is happy with. `!` becomes `no` so an exclude (`!5`) is not saved
 * as `pages-5.pdf`, which would read as its opposite.
 */
function rangeFileName(range: string): string {
  const safe = range.replace(/!/g, "no").replace(/[^0-9a-z-]/gi, "").replace(/,+/g, "-");
  return `pages-${safe || "kept"}.pdf`;
}

export default function PdfToolkit() {
  const [action, setAction] = useState<ActionId>("merge");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [pages, setPages] = useState("");
  const [angle, setAngle] = useState("90");
  const [position, setPosition] = useState("8");
  const [numberText, setNumberText] = useState(DEFAULT_NUMBER_TEXT);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = ACTIONS.find((a) => a.id === action)!;
  const single = action !== "merge";
  // A page range is optional for rotate and numbering, but a range that cannot be
  // read is never sent: the engine would either reject it or rotate the wrong pages.
  // The check is `isPageRange` from @hermes/core — the very function the job route
  // uses for its 400 — so the field cannot refuse a range the engine accepts
  // (`odd`, `even`, `l`, `3-`, `-4`, `!5`) nor pass one pdfcpu calls a syntax error.
  const usesPages = action === "split" || action === "rotate" || action === "page-numbers";
  const pagesTrimmed = pages.trim();
  const rangeBad = pagesTrimmed !== "" && !isPageRange(pagesTrimmed);
  const pagesOk = action === "split" ? isPageRange(pagesTrimmed) : true;
  const rangeOk = !usesPages || pagesTrimmed === "" || isPageRange(pagesTrimmed);

  function choose(next: ActionId) {
    setAction(next);
    setJob(null);
    setError(null);
    // One file means one file: keeping the extra entries hidden would risk
    // processing a PDF the user can no longer see.
    if (next !== "merge") setFiles((f) => f.slice(0, 1));
  }

  async function addFiles() {
    setError(null);
    setJob(null);
    try {
      const picked = await pickFile("pdf");
      if (!picked) return;
      setFiles((prev) => (single ? [picked] : [...prev, picked]));
    } catch (e: any) {
      setError(e?.message || "Could not open a file picker on this device.");
    }
  }

  const filesOk = action === "merge" ? files.length >= 2 : files.length === 1;
  const ready = filesOk && pagesOk && rangeOk && !busy;

  const posLabel = POSITIONS.find((p) => p.value === position)?.label ?? "bottom centre";
  const angleLabel = ANGLES.find((a) => a.value === angle)?.label ?? "90°";

  const label = !filesOk
    ? action === "merge"
      ? "Add at least two PDFs"
      : "Choose a PDF"
    : action === "merge"
      ? `Merge ${files.length} PDFs`
      : action === "split"
        ? `Split pages ${pagesTrimmed}`
        : action === "compress"
          ? "Compress this PDF"
          : action === "rotate"
            ? `Rotate ${angleLabel}${pagesTrimmed ? ` on ${pagesTrimmed}` : ""}`
            : `Number pages at ${posLabel}`;

  async function run() {
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const result = await runJob({
        product: "pdf-tools",
        fields: {
          action,
          // Only what this action uses: the engine has no meaning for an angle on
          // a merge, and a stray parameter hides which job actually ran.
          pages: usesPages && pagesTrimmed ? pagesTrimmed : undefined,
          angle: action === "rotate" ? angle : undefined,
          position: action === "page-numbers" ? position : undefined,
          text: action === "page-numbers" ? numberText.trim() || DEFAULT_NUMBER_TEXT : undefined,
          count: files.length,
        },
        files: files.map((file) => ({ field: "file", file })),
      });
      setJob(result);
      if (!result.outputUrl && !result.previewUrl && result.extraUrls.length === 0) {
        setError("The server finished without a file. Nothing was charged — try again.");
      }
    } catch (e: any) {
      setError(e?.message || "The PDF job failed. Nothing was charged.");
    } finally {
      setBusy(false);
    }
  }

  const resultUrls = job
    ? [...(job.outputUrl ? [job.outputUrl] : []), ...(job.previewUrl && job.previewUrl !== job.outputUrl ? [job.previewUrl] : []), ...job.extraUrls]
    : [];
  const outName =
    action === "merge"
      ? "merged.pdf"
      : action === "split"
        ? rangeFileName(pagesTrimmed)
        : action === "compress"
          ? `${(files[0]?.name ?? "document").replace(/\.pdf$/i, "")}-small.pdf`
          : action === "rotate"
            ? `${(files[0]?.name ?? "document").replace(/\.pdf$/i, "")}-rotated.pdf`
            : `${(files[0]?.name ?? "document").replace(/\.pdf$/i, "")}-numbered.pdf`;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>PDF · MERGE · SPLIT · COMPRESS · ROTATE · NUMBERS</Text>
        <Text style={s.price}>FREE</Text>
      </View>

      <Text style={s.h1}>Pick a job,{"\n"}then the file</Text>
      <Text style={s.sub}>
        Five jobs, all of them on this machine: nothing leaves the device until you press the
        button, and the order of the list below is the order of the merged document.
      </Text>

      <View style={s.actions}>
        {ACTIONS.map((a) => {
          const on = a.id === action;
          return (
            <Pressable
              key={a.id}
              onPress={() => choose(a.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[s.action, on && s.actionOn]}
            >
              <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
              <View style={{ flex: 1 }}>
                <View style={s.actionHead}>
                  <Text style={[s.actionName, on && { color: RED }]}>{a.name}</Text>
                  <Text style={s.actionNeeds}>{a.needs}</Text>
                </View>
                <Text style={s.actionJob}>{a.job}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {action === "rotate" ? (
        <>
          <Text style={s.label}>Turn</Text>
          <View style={s.chips}>
            {ANGLES.map((a) => {
              const on = a.value === angle;
              return (
                <Pressable
                  key={a.value}
                  onPress={() => {
                    setAngle(a.value);
                    setJob(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Rotate ${a.hint}`}
                  style={[s.chip, on && s.chipOn]}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={s.help}>
            {ANGLES.find((a) => a.value === angle)?.hint} — every page turns. Narrow the range
            below to turn only some of them, and if a page lands the wrong way pick a different turn.
          </Text>
        </>
      ) : null}

      {action === "page-numbers" ? (
        <>
          <Text style={s.label}>Where on the page</Text>
          <View style={s.grid}>
            {POSITIONS.map((p) => {
              const on = p.value === position;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => {
                    setPosition(p.value);
                    setJob(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={p.label}
                  style={[s.cell, on && s.cellOn]}
                >
                  <Text style={[s.cellText, on && s.cellTextOn]}>{p.short}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={s.help}>
            Laid out like the page itself: 1 is top left, 9 bottom right. Now: {posLabel}.
          </Text>
          <Text style={s.label}>What it says</Text>
          <TextInput
            value={numberText}
            onChangeText={(t) => {
              setNumberText(t);
              setJob(null);
            }}
            placeholder={DEFAULT_NUMBER_TEXT}
            placeholderTextColor="#94a3b8"
            style={s.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={s.help}>
            {"{n}"} is the page and {"{total}"} the page count, so "Page 3 of 12" works; the
            engine takes %p and %P too. Blank uses {DEFAULT_NUMBER_TEXT}.
          </Text>
        </>
      ) : null}

      {usesPages ? (
        <>
          <Text style={s.label}>{action === "split" ? "Pages to keep" : "Pages (optional)"}</Text>
          <TextInput
            value={pages}
            onChangeText={(t) => {
              setPages(t);
              setJob(null);
            }}
            placeholder={action === "split" ? "1-3, 7" : "all of them"}
            placeholderTextColor="#94a3b8"
            style={[s.input, !rangeOk && s.inputBad]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={s.help}>
            {action === "split"
              ? `A range the engine reads, and anything you do not list is dropped: ${PDF_PAGES_HINT}.`
              : `Leave it empty for every page, or name the ones you mean: ${PDF_PAGES_HINT}.`}
          </Text>
          {rangeBad ? (
            <Text style={s.rangeBad}>
              That range cannot be read — the line above is the whole grammar.
            </Text>
          ) : null}
        </>
      ) : null}

      <View style={s.stackHead}>
        <Text style={s.label}>{action === "merge" ? "Files in order" : "The file"}</Text>
        <Text style={s.stackCount}>
          {files.length === 0 ? "empty" : `${files.length} file${files.length === 1 ? "" : "s"}`}
        </Text>
      </View>

      <View style={s.stack}>
        {files.length === 0 ? (
          <Text style={s.stackEmpty}>
            {action === "merge" ? "No PDFs yet. Add two or more." : "No PDF yet. Add one."}
          </Text>
        ) : (
          files.map((f, i) => (
            <View key={`${f.uri}-${i}`} style={s.row}>
              <Text style={s.rowIndex}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.rowName} numberOfLines={1}>{f.name}</Text>
                <Text style={s.rowMeta}>{formatBytes(f.size) || "PDF"}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setFiles((prev) => prev.filter((_, j) => j !== i));
                  setJob(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${f.name}`}
                style={s.remove}
              >
                <Text style={s.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Pressable style={s.secondary} onPress={addFiles} accessibilityRole="button">
        <Text style={s.secondaryText}>
          {files.length === 0 ? "Choose a PDF" : action === "merge" ? "Add another PDF" : "Choose a different PDF"}
        </Text>
      </Pressable>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, !ready && s.dim]}
        onPress={run}
        disabled={!ready}
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{label}</Text>}
      </Pressable>

      {job && !busy && resultUrls.length > 0 ? (
        <View style={s.result}>
          <Text style={s.label}>Done</Text>
          <View style={s.row}>
            <Text style={s.rowIndex}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rowName} numberOfLines={1}>{outName}</Text>
              <Text style={s.rowMeta}>
                {resultUrls.length === 1 ? "1 file ready" : `${resultUrls.length} files ready`} ·{" "}
                {current.name.toLowerCase()}
              </Text>
            </View>
          </View>
          <Pressable
            style={s.primary}
            onPress={() => openResult(resultUrls[0], outName)}
            accessibilityRole="button"
          >
            <Text style={s.primaryText}>{canDownloadFile() ? "Download it" : "Open it"}</Text>
          </Pressable>
          {resultUrls.length > 1
            ? resultUrls.slice(1).map((u, i) => (
                <Pressable
                  key={u}
                  style={s.linkRow}
                  onPress={() => Linking.openURL(u)}
                  accessibilityRole="button"
                >
                  <Text style={s.link}>File {i + 2} of {resultUrls.length}</Text>
                </Pressable>
              ))
            : null}
          <Text style={s.hint}>
            The link above is the file the job handed back — nothing is stored twice.
          </Text>
        </View>
      ) : null}

      <Text style={s.foot}>
        Free to use, and no sign-up for a single file. A ₹299/mo plan is priced on the product
        plan for shops running bulk jobs — the checkout is not part of this build.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  wrap: { padding: 22, paddingBottom: 48, maxWidth: 520, width: "100%", alignSelf: "center" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  badge: { color: RED, fontSize: 11, fontWeight: "800", letterSpacing: 1, flexShrink: 1 },
  price: { color: INK, fontSize: 20, fontWeight: "800" },
  h1: { color: INK, fontSize: 32, fontWeight: "800", lineHeight: 37, marginBottom: 10 },
  sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  actions: { gap: 8, marginBottom: 18 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  actionOn: { borderColor: RED, backgroundColor: "#fef2f2" },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: RED },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: RED },
  actionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  actionName: { color: INK, fontSize: 14.5, fontWeight: "800" },
  actionNeeds: { color: "#94a3b8", fontSize: 10.5, fontWeight: "700" },
  actionJob: { color: MUTED, fontSize: 12, lineHeight: 16.5, marginTop: 2 },
  label: { color: INK, fontWeight: "700", fontSize: 13, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: INK,
    backgroundColor: "#fff",
  },
  inputBad: { borderColor: "#fca5a5" },
  rangeBad: { color: "#b91c1c", fontSize: 11.5, marginTop: 6, lineHeight: 16 },
  help: { color: MUTED, fontSize: 11.5, marginTop: 6, lineHeight: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  chipOn: { borderColor: RED, backgroundColor: "#fef2f2" },
  chipText: { color: INK, fontSize: 14, fontWeight: "700" },
  chipTextOn: { color: RED },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 3 * 46 + 2 * 8,
    gap: 8,
  },
  cell: {
    width: 46,
    height: 40,
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cellOn: { borderColor: RED, backgroundColor: "#fef2f2" },
  cellText: { color: MUTED, fontSize: 17, fontWeight: "700", lineHeight: 20 },
  cellTextOn: { color: RED },
  stackHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 8 },
  stackCount: { color: "#94a3b8", fontSize: 11.5, fontWeight: "700" },
  stack: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stackEmpty: { color: "#94a3b8", fontSize: 12.5, paddingVertical: 12, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  rowIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f1f5f9",
    color: MUTED,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 22,
    overflow: "hidden",
  },
  rowName: { color: INK, fontSize: 13, fontWeight: "600" },
  rowMeta: { color: MUTED, fontSize: 11 },
  remove: { paddingHorizontal: 8, paddingVertical: 4 },
  removeText: { color: RED, fontSize: 11.5, fontWeight: "700" },
  secondary: {
    borderWidth: 1.5,
    borderColor: LINE,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
  },
  secondaryText: { color: INK, fontWeight: "700", fontSize: 14 },
  primary: { backgroundColor: RED, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 12 },
  dim: { opacity: 0.45 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 12, lineHeight: 18 },
  result: { marginTop: 20 },
  linkRow: { paddingVertical: 10 },
  link: { color: RED, fontSize: 13, fontWeight: "700" },
  hint: { color: MUTED, fontSize: 11.5, marginTop: 10, lineHeight: 16 },
  foot: { color: "#94a3b8", fontSize: 11, marginTop: 22, textAlign: "center", lineHeight: 16 },
});
