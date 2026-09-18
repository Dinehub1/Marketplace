/**
 * Room Redesign — a photo of a room in, the same room restyled out.
 *
 * The product was parked for a round, and the screen says what changed rather than pretending
 * nothing did: every image-to-image model Workers AI used to host is gone, and this runs on
 * FLUX.2 [klein], which edits by reference. Two consequences a person can see:
 *
 *   - the furniture, materials, colours and light change; the walls, the window and the camera
 *     angle do not, because that is the instruction the engine sends with every look. "Your room,
 *     restyled" is only true if it is still recognisably your room;
 *   - the photo is fitted to under 512x512 before it is sent, because that is the model's own
 *     limit. The screen prints both sizes back afterwards (`input_px` → `sent_px`) so the
 *     constraint is visible instead of being a thing that quietly happens.
 *
 * The five looks are chips, not a free-text prompt. A shopkeeper pointing a phone at a sofa wants
 * a room back, not a prompt-engineering exercise — and a text box here would be a way to send
 * something the model answers with a refusal, which reads as our bug.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

/** The engine's own meta, as `room_redesign` returns it. */
type RoomMeta = {
  model?: string;
  look?: string;
  input_px?: string;
  sent_px?: string;
  seconds?: number;
  attempts?: number;
};

/** The five looks the engine offers, with the labels a person reads. The ids are the engine's. */
const LOOKS: { id: string; label: string; hint: string }[] = [
  { id: "warm", label: "Warm & cosy", hint: "Teak, cane, terracotta, lamplight" },
  { id: "minimal", label: "Minimal", hint: "Off-white, one sofa, no clutter" },
  { id: "modern", label: "Modern", hint: "Charcoal, walnut, a geometric rug" },
  { id: "classic", label: "Classic", hint: "Carved wood, maroon and gold" },
  { id: "bright", label: "Bright", hint: "White and oak, linen, plants" },
];

export default function RoomRedesign() {
  const ui = useProductUI("room-redesign");
  const s = useMemo(() => makeStyles(ui), [ui]);

  const [file, setFile] = useState<PickedFile | null>(null);
  const [look, setLook] = useState("warm");
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = (job?.meta ?? null) as RoomMeta | null;
  // While the job runs the chosen photo is what there is to look at; afterwards the restyle is.
  const shown = job?.previewUrl ?? job?.outputUrl ?? file?.uri ?? null;
  const done = !!(job?.previewUrl || job?.outputUrl);
  const outputUrl = job?.outputUrl ?? job?.previewUrl ?? null;
  const chosen = LOOKS.find((l) => l.id === look);

  async function choose() {
    setError(null);
    setJob(null);
    try {
      const picked = await pickFile("image");
      if (picked) setFile(picked);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the photo picker.");
    }
  }

  async function restyle() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const result = await runJob({
        product: "room-redesign",
        fields: { style: look },
        files: [{ field: "file", file }],
      });
      setJob(result);
      if (!result.previewUrl && !result.outputUrl) {
        setError("The engine finished without a picture. Nothing was charged — try again.");
      }
    } catch (e) {
      // The route's own sentence when it has one: a refused account and an unreadable photo are
      // different problems, and the engine writes both to be read.
      setError(e instanceof Error ? e.message : "The restyle failed. Try another photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>AI RESTYLE · PHOTO IN, PHOTO OUT</Text>
        <Text style={s.price}>₹49/room</Text>
      </View>

      <Text style={s.h1}>Your room,{"\n"}restyled</Text>
      <Text style={s.sub}>
        Pick one look, send a photo of the room, and get the same room back with different
        furniture, materials and light.
      </Text>

      <Pressable style={s.frame} onPress={() => void choose()} accessibilityRole="button">
        {shown ? (
          <Image source={{ uri: shown }} style={s.photo} resizeMode="cover" />
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Choose a photo of the room</Text>
            <Text style={s.emptyHint}>Stand back and get the whole room in the frame</Text>
          </View>
        )}
      </Pressable>
      <Text style={s.help}>
        {file
          ? `${file.name}${file.size ? ` · ${formatBytes(file.size)}` : ""}${done ? "" : " · tap the photo to change it"}`
          : "A clear, well-lit photo gives a better restyle than a dark one."}
      </Text>

      <Text style={s.section}>The look</Text>
      {LOOKS.map((l) => (
        <Pressable
          key={l.id}
          onPress={() => {
            setLook(l.id);
            setJob(null);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: look === l.id }}
          style={[s.look, look === l.id && s.lookOn]}
        >
          <View style={s.lookMain}>
            <Text style={[s.lookLabel, look === l.id && { color: ui.accent }]}>{l.label}</Text>
            <Text style={s.lookHint}>{l.hint}</Text>
          </View>
          <View style={[s.dot, look === l.id && { backgroundColor: ui.accent, borderColor: ui.accent }]} />
        </Pressable>
      ))}

      <View style={s.note}>
        <Text style={s.noteText}>
          <Text style={s.noteStrong}>What stays and what changes. </Text>
          The walls, the window and the camera angle stay — the engine is told to keep them on
          every look, so the result is still your room. The furniture, materials, colours and
          lighting change.
        </Text>
        <Text style={s.noteText}>
          The photo is sent to a hosted image model for this one job and is not kept. It is a
          generated picture, not a photograph of a real room.
        </Text>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, (!file || busy) && s.dim]}
        onPress={() => void restyle()}
        disabled={!file || busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: !file || busy }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.primaryText}>
            {done ? `Try ${chosen?.label ?? "another look"}` : "Restyle this room"}
          </Text>
        )}
      </Pressable>

      {done && outputUrl ? (
        <View style={s.result}>
          <Pressable
            style={s.secondary}
            onPress={() => openResult(outputUrl, `room-${look}.jpg`)}
            accessibilityRole="button"
          >
            <Text style={s.secondaryText}>
              {canDownloadFile() ? `Download room-${look}.jpg` : `Open room-${look}.jpg`}
            </Text>
          </Pressable>
          <Text style={s.hint}>
            The {chosen?.label.toLowerCase()} look
            {meta?.input_px && meta?.sent_px
              ? ` · photo ${meta.input_px} sent as ${meta.sent_px}`
              : ""}
            {meta?.seconds !== undefined ? ` · ${meta.seconds}s` : ""}
          </Text>
          {meta?.attempts && meta.attempts > 1 ? (
            <Text style={s.hint}>
              The model refused the first call and the retry produced this picture (
              {meta.attempts} attempts).
            </Text>
          ) : null}
          <Text style={s.hint}>
            Try another look on the same photo — each one is a separate run.
          </Text>
        </View>
      ) : null}

      <Text style={s.foot}>
        Generated by a hosted image model, so it needs a connection and costs us per run. Your
        photo is not added to any library.
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
    sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 16 },
    help: { color: MUTED, fontSize: 12.5, lineHeight: 18, marginTop: 8 },
    section: { color: INK, fontSize: 15, fontWeight: "800", marginTop: 24, marginBottom: 10 },

    frame: {
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1.5,
      borderColor: LINE,
      backgroundColor: ui.c.surfaceSunken,
      aspectRatio: 4 / 3,
      justifyContent: "center",
    },
    photo: { width: "100%", height: "100%" },
    empty: { alignItems: "center", padding: 20 },
    emptyTitle: { color: INK, fontSize: 16, fontWeight: "700" },
    emptyHint: { color: MUTED, fontSize: 12.5, marginTop: 6, textAlign: "center" },

    look: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      marginBottom: 8,
      backgroundColor: ui.surface,
    },
    lookOn: { borderColor: ACCENT, backgroundColor: ui.accentTint },
    lookMain: { flex: 1 },
    lookLabel: { color: INK, fontSize: 14.5, fontWeight: "700" },
    lookHint: { color: MUTED, fontSize: 12, marginTop: 2 },
    dot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: LINE,
    },

    note: {
      borderWidth: 1,
      borderColor: LINE,
      borderRadius: 12,
      padding: 12,
      marginTop: 14,
      gap: 8,
      backgroundColor: ui.c.surfaceSunken,
    },
    noteText: { color: MUTED, fontSize: 12.5, lineHeight: 18 },
    noteStrong: { color: INK, fontWeight: "700" },

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
