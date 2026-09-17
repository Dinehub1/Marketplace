/**
 * Voice-over — a script in, one MP3 out.
 *
 * The language question is answered before it is asked. MeloTTS is multilingual and this build
 * offers English only, because no other language has been listened to on our side — so the
 * screen says "English" once, plainly, instead of showing a picker whose other entries nobody
 * has verified. A synthetic voice that mispronounces Hindi is worse than an honest English-only
 * build, and finding that out after paying for a clip is worse than both.
 *
 * The character limit is shown as a counter rather than enforced silently at submit: the
 * engine caps a clip at 4,000 characters, and a person pasting a full script deserves to know
 * where the line is before they press the button.
 *
 * Nothing here plays the clip in the app. On a phone the OS opens an MP3 in whatever player the
 * person already uses, and on the web it downloads — which is what "give me the file" means in
 * both places. Building a player would be building a second, worse one.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { canDownloadFile, openResult, runJob, type JobResult } from "@/lib/tools";
import { useProductUI, type ProductUI } from "@/lib/product-ui";

/** The engine's own meta, as `voiceover` returns it. */
type VoiceoverMeta = { words?: number; chars?: number; seconds?: number; bytes?: number; attempts?: number };

/** The engine's cap, mirrored so the counter and the button agree with it. */
const MAX_CHARS = 4000;

/** A few scripts to start from, because an empty box is the hardest part of a first use. */
const STARTERS: { label: string; text: string }[] = [
  {
    label: "Shop offer",
    text: "Namaste! This week at our shop, all stainless steel items are twenty percent off. Bring this message and get free delivery within the city.",
  },
  {
    label: "Reel intro",
    text: "Here is a thirty-second tip that saved me two hours this week. Watch till the end, because the last step is the one everyone skips.",
  },
];

export default function Voiceover() {
  const ui = useProductUI("voiceover");
  const s = useMemo(() => makeStyles(ui), [ui]);

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  const tooLong = trimmed.length > MAX_CHARS;
  const missing = !trimmed
    ? "Type the script first — the clip is a reading of these words and nothing else."
    : tooLong
      ? `The script is ${trimmed.length} characters; one clip takes up to ${MAX_CHARS}.`
      : null;

  const meta = (job?.meta ?? null) as VoiceoverMeta | null;
  const outputUrl = job?.outputUrl ?? null;

  async function makeVoice() {
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const result = await runJob({
        product: "voiceover",
        // The script rides in `payload`: it is up to 4,000 characters and the route's shared
        // field cap is 120, so the JSON envelope is the shape that carries it.
        fields: { payload: JSON.stringify({ text: trimmed, lang: "en" }) },
      });
      setJob(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the engine. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.badgeRow}>
        <Text style={s.badge}>VOICE-OVER · MP3</Text>
        <Text style={s.price}>₹99/clip</Text>
      </View>

      <Text style={s.h1}>Your script,{"\n"}read aloud</Text>
      <Text style={s.sub}>
        A synthetic voice reads exactly the words you type. It does not rewrite them, and it adds
        nothing to the ends.
      </Text>

      <Text style={s.section}>The script</Text>
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          setJob(null);
        }}
        placeholder="Paste or type what should be said."
        placeholderTextColor={ui.faint}
        multiline
        style={[s.input, s.script]}
      />
      <View style={s.counterRow}>
        <Text style={[s.counter, tooLong && { color: ui.error }]}>
          {trimmed.length} / {MAX_CHARS} characters
        </Text>
        <Text style={s.counter}>
          {trimmed ? `${trimmed.split(/\s+/).length} words` : "no words yet"}
        </Text>
      </View>

      <View style={s.starters}>
        {STARTERS.map((st) => (
          <Pressable
            key={st.label}
            style={s.starter}
            onPress={() => {
              setText(st.text);
              setJob(null);
            }}
            accessibilityRole="button"
          >
            <Text style={s.starterText}>{st.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.note}>
        <Text style={s.noteText}>
          <Text style={s.noteStrong}>This build speaks English only. </Text>
          The model knows other languages, but none has been listened to on our side yet, so the
          list stays at one until one has been.
        </Text>
        <Text style={s.noteText}>
          Numbers and currency are read as written — type “twenty percent” or “Rs. 499” the way
          you want to hear them.
        </Text>
      </View>

      {missing ? <Text style={s.missing}>{missing}</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, (!!missing || busy) && s.dim]}
        onPress={() => void makeVoice()}
        disabled={!!missing || busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!missing || busy }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Make the voice-over</Text>}
      </Pressable>

      {outputUrl ? (
        <View style={s.result}>
          <Text style={s.label}>The clip</Text>
          <Pressable
            style={s.secondary}
            onPress={() => openResult(outputUrl, "voiceover.mp3")}
            accessibilityRole="button"
          >
            <Text style={s.secondaryText}>
              {canDownloadFile() ? "Download voiceover.mp3" : "Open voiceover.mp3"}
            </Text>
          </Pressable>
          <Text style={s.hint}>
            {meta?.words ?? trimmed.split(/\s+/).length} word
            {(meta?.words ?? trimmed.split(/\s+/).length) === 1 ? "" : "s"} read
            {meta?.seconds !== undefined ? ` in ${meta.seconds}s` : ""}. The clip&apos;s own
            length is whatever the voice took — this app does not trim or pad it.
          </Text>
          {meta?.attempts && meta.attempts > 1 ? (
            <Text style={s.hint}>
              The model refused the first call and the retry produced this clip ({meta.attempts}{" "}
              attempts).
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={s.foot}>
        The script is sent to a hosted voice model and is not kept after the job. It is a
        synthetic voice, not a recording of a person.
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
    script: { minHeight: 150, textAlignVertical: "top" },
    counterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },
    counter: { color: MUTED, fontSize: 12, fontWeight: "600" },
    starters: { flexDirection: "row", gap: 8, marginTop: 12 },
    starter: {
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: ui.surface,
    },
    starterText: { color: INK, fontSize: 12.5, fontWeight: "700" },
    note: {
      borderWidth: 1,
      borderColor: LINE,
      borderRadius: 12,
      padding: 12,
      marginTop: 16,
      gap: 8,
      backgroundColor: ui.c.surfaceSunken,
    },
    noteText: { color: MUTED, fontSize: 12.5, lineHeight: 18 },
    noteStrong: { color: INK, fontWeight: "700" },
    missing: { color: ui.error, fontSize: 13, lineHeight: 19, marginTop: 14 },
    error: { color: ui.error, fontSize: 13.5, lineHeight: 19, marginTop: 14, fontWeight: "600" },
    primary: {
      backgroundColor: ACCENT,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 16,
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
    foot: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 26 },
  });
}
