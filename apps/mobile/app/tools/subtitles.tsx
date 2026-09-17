/**
 * Subtitles — audio in, one timed .srt out.
 *
 * The honest shape of this screen, and why it is not "drop your reel here". The engine reads
 * an audio track through Workers AI's Whisper, and the product returns a *caption file* rather
 * than a video with text burnt in — burning it in needs ffmpeg, which this box does not run.
 * So the screen asks for audio, says which button to press in an editor to get it, and names
 * what comes back (an .srt the editor imports). Offering a video picker would be offering a job
 * that cannot run.
 *
 * The language choice is three chips, not a text field. The model takes an ISO code, and a free
 * text field is a way to send `gujrati` and read a 400 the screen could have prevented; the
 * three that exist are the ones we can spell.
 *
 * What the screen shows afterwards is the engine's own meta — the cue count, the word count,
 * the transcribed span and a preview of the transcript — rather than a re-derivation here. If
 * the engine says the audio held nothing, that sentence is the engine's, printed as it arrived.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  canDownloadFile,
  formatBytes,
  openResult,
  pickFile,
  runJob,
  type JobResult,
  type PickedFile,
} from "@/lib/tools";
import { useProductUI, type ProductUI } from "@/lib/product-ui";

/** The engine's own meta, as `subtitles` returns it. */
type SubtitlesMeta = {
  model?: string;
  cues?: number;
  words?: number;
  text_chars?: number;
  text_preview?: string;
  transcribed_minutes?: number;
  lang?: string;
  seconds?: number;
};

/** Auto-detect, or say which language is being spoken. Both are codes Whisper knows. */
const LANGS: { id: string; label: string }[] = [
  { id: "", label: "Auto" },
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
];

export default function Subtitles() {
  const ui = useProductUI("subtitles");
  const s = useMemo(() => makeStyles(ui), [ui]);

  const [file, setFile] = useState<PickedFile | null>(null);
  const [lang, setLang] = useState("");
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = (job?.meta ?? null) as SubtitlesMeta | null;
  const outputUrl = job?.outputUrl ?? null;

  async function choose() {
    setError(null);
    setJob(null);
    try {
      const picked = await pickFile("audio");
      if (picked) setFile(picked);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the file picker.");
    }
  }

  async function makeCaptions() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const result = await runJob({
        product: "subtitles",
        fields: lang ? { language: lang } : {},
        files: [{ field: "file", file }],
      });
      setJob(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the engine. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const stem = (file?.name ?? "captions").replace(/\.[^.]+$/, "");
  const fileName = `${stem}.srt`;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.badgeRow}>
        <Text style={s.badge}>SUBTITLES · SRT</Text>
        <Text style={s.price}>₹49/video</Text>
      </View>

      <Text style={s.h1}>Captions, timed{"\n"}to your audio</Text>
      <Text style={s.sub}>
        Send the audio from your reel. You get an .srt whose lines are timed to it — the file
        CapCut, InShot, YouTube and Premiere import.
      </Text>

      <Text style={s.section}>The audio</Text>
      <Pressable style={s.picker} onPress={() => void choose()} accessibilityRole="button">
        {file ? (
          <>
            <Text style={s.pickedName} numberOfLines={2}>
              {file.name}
            </Text>
            <Text style={s.pickedMeta}>
              {[formatBytes(file.size), "tap to choose a different one"].filter(Boolean).join(" · ")}
            </Text>
          </>
        ) : (
          <>
            <Text style={s.pickerTitle}>Choose an audio file</Text>
            <Text style={s.pickerHint}>MP3, M4A, WAV, OGG, WebM or FLAC</Text>
          </>
        )}
      </Pressable>

      <Text style={s.help}>
        Video files are not accepted: the model reads an audio track, and pulling the audio out
        of an MP4 needs a video encoder this build does not run. In CapCut or InShot, export the
        audio (or use the phone&apos;s voice recorder), then choose that file here.
      </Text>

      <Text style={s.section}>Spoken language</Text>
      <View style={s.chipRow}>
        {LANGS.map((l) => (
          <Pressable
            key={l.id || "auto"}
            onPress={() => {
              setLang(l.id);
              setJob(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: lang === l.id }}
            style={[s.chip, lang === l.id && s.chipOn]}
          >
            <Text style={[s.chipText, lang === l.id && { color: ui.accent }]}>{l.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.help}>
        Leave it on Auto unless the transcript comes back in the wrong language — naming it helps
        with short clips and with mixed speech.
      </Text>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, (!file || busy) && s.dim]}
        onPress={() => void makeCaptions()}
        disabled={!file || busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: !file || busy }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Make the captions</Text>}
      </Pressable>

      {outputUrl ? (
        <View style={s.result}>
          <Text style={s.label}>The caption file</Text>
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
            {meta?.cues ?? 0} line{(meta?.cues ?? 0) === 1 ? "" : "s"} ·{" "}
            {meta?.words ?? 0} word{(meta?.words ?? 0) === 1 ? "" : "s"} ·{" "}
            {meta?.transcribed_minutes !== undefined
              ? `${meta.transcribed_minutes.toFixed(2)} min read`
              : "length unknown"}
            {meta?.lang ? ` · ${meta.lang === "auto" ? "language detected" : meta.lang}` : ""}
          </Text>

          {meta?.text_preview ? (
            <View style={s.preview}>
              <Text style={s.previewHead}>What it heard</Text>
              <Text style={s.previewText}>{meta.text_preview}</Text>
              {(meta.text_chars ?? 0) > (meta.text_preview?.length ?? 0) ? (
                <Text style={s.previewMore}>
                  … {meta.text_chars} characters in all — the .srt has the whole transcript.
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={s.hint}>
            Import the .srt into your editor and it lays the lines out over the video. The timing
            is the model&apos;s; this app does not adjust it.
          </Text>
        </View>
      ) : null}

      <Text style={s.foot}>
        The audio is sent to a hosted speech model and is not kept after the job. Nothing about
        your file is stored by us.
      </Text>
    </ScrollView>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function makeStyles(ui: ProductUI) {
  const ACCENT = ui.accent;
  const INK = ui.ink;
  const MUTED = ui.muted;
  const LINE = ui.hairline;
  const BG = ui.bg;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    wrap: { padding: 22, paddingBottom: 52, maxWidth: 520, width: "100%", alignSelf: "center" },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    badge: { color: ACCENT, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
    price: { color: INK, fontSize: 20, fontWeight: "800" },
    h1: { color: INK, fontSize: 32, fontWeight: "800", lineHeight: 37, marginBottom: 10 },
    sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 6 },
    section: { color: INK, fontSize: 15, fontWeight: "800", marginTop: 24, marginBottom: 10 },
    label: { color: INK, fontWeight: "700", fontSize: 12.5, marginBottom: 6 },

    picker: {
      borderWidth: 1.5,
      borderColor: LINE,
      borderStyle: "dashed",
      borderRadius: 14,
      padding: 18,
      alignItems: "center",
      backgroundColor: ui.c.surfaceSunken,
    },
    pickerTitle: { color: INK, fontSize: 15.5, fontWeight: "700" },
    pickerHint: { color: MUTED, fontSize: 12.5, marginTop: 4 },
    pickedName: { color: INK, fontSize: 15, fontWeight: "700", textAlign: "center" },
    pickedMeta: { color: MUTED, fontSize: 12.5, marginTop: 4 },

    help: { color: MUTED, fontSize: 12.5, lineHeight: 18, marginTop: 8 },

    chipRow: { flexDirection: "row", gap: 8 },
    chip: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 11,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: ui.surface,
    },
    chipOn: { borderColor: ACCENT, backgroundColor: ui.accentTint },
    chipText: { color: MUTED, fontSize: 13.5, fontWeight: "700" },

    error: { color: ui.error, fontSize: 13.5, lineHeight: 19, marginTop: 14, fontWeight: "600" },
    primary: {
      backgroundColor: ACCENT,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 18,
    },
    dim: { opacity: 0.45 },
    primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },

    result: { marginTop: 18, gap: 10 },
    secondary: {
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: ui.surface,
    },
    secondaryText: { color: INK, fontWeight: "700", fontSize: 14 },
    hint: { color: MUTED, fontSize: 12.5, lineHeight: 18 },
    preview: {
      borderWidth: 1,
      borderColor: LINE,
      borderRadius: 12,
      padding: 12,
      backgroundColor: ui.c.surfaceSunken,
    },
    previewHead: { color: MUTED, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.8 },
    previewText: { color: INK, fontSize: 13.5, lineHeight: 20, marginTop: 6 },
    previewMore: { color: MUTED, fontSize: 11.5, marginTop: 8, fontStyle: "italic" },
    foot: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 26 },
  });
}
