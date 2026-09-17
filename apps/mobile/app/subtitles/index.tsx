/**
 * Subtitles & Voice-over's first screen: a chooser, not a hub of tiles.
 *
 * Why a chooser and not the toolbox grid. This listing has exactly two jobs and they are two
 * different kinds of work — one takes a file in, one takes words in — so the screen says what
 * each one wants and what it hands back, in that order. Two full-width cards rather than a
 * grid, and the copy names the deliverable ("an .srt with the timings", "an MP3") because that
 * is the thing a person is deciding about.
 *
 * The two limits are stated on this screen, not buried in the product screens, because they are
 * the two things someone would otherwise discover by being disappointed:
 *   - captions come back as a caption *file* the editor imports, not as text burnt into a video
 *     (burning it in needs ffmpeg, which this build does not run);
 *   - the voice speaks English only (the model knows other languages; none has been listened
 *     to here, and a synthetic voice mispronouncing Hindi is worse than no Hindi option).
 *
 * The list comes from `TARGET.products` through `lib/products.ts`, the same registry the store
 * listing is checked against, so a product whose screen is not built can never be advertised
 * here as if it were.
 */
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { productsFor, type Product } from "@/lib/products";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { TARGET } from "@/lib/target";

export default function SubtitlesVoiceChooser() {
  const router = useRouter();
  const ui = useProductUI();
  const s = useMemo(() => makeStyles(ui, TARGET.color), [ui]);
  const products = productsFor(TARGET.products);
  const ready = products.filter((p) => p.route !== null);
  const soon = products.filter((p) => p.route === null);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>SUBTITLES &amp; VOICE</Text>
        <Text style={s.count}>{`${ready.length} of ${products.length} jobs live`}</Text>
      </View>

      <Text style={s.h1}>Captions and voice</Text>
      <Text style={s.sub}>{TARGET.tagline}</Text>

      {ready.map((p) => (
        <Card
          key={p.slug}
          product={p}
          ui={ui}
          s={s}
          onPress={() => router.push(p.route as never)}
        />
      ))}

      {soon.length > 0 ? (
        <View style={s.soonBox}>
          <Text style={s.soonHead}>Not in this build</Text>
          {soon.map((p) => (
            <Text key={p.slug} style={s.soonLine}>
              <Text style={s.soonName}>{p.label}</Text>
              {` — ${p.blurb} (${p.price})`}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={s.note}>
        <Text style={s.noteHead}>What these do, exactly</Text>
        <Text style={s.noteText}>
          <Text style={s.noteStrong}>Captions come back as a file. </Text>
          You send the audio and get an .srt whose lines are timed to it — the file CapCut,
          InShot, YouTube and Premiere all import. The text is not burnt into the video here:
          that needs a video encoder this build does not run, and a promise to render one would
          be a promise it cannot keep.
        </Text>
        <Text style={s.noteText}>
          <Text style={s.noteStrong}>The voice speaks English only. </Text>
          The model has other languages, but none has been listened to on our side yet, and a
          synthetic voice that mispronounces Hindi is worse than an honest English-only build.
        </Text>
        <Text style={s.noteText}>
          Both jobs run on a hosted model, so they need a connection and they cost us money per
          run. Neither uploads anything you did not choose, and nothing is kept after the job.
        </Text>
      </View>
    </ScrollView>
  );
}

function Card({
  product,
  ui,
  s,
  onPress,
}: {
  product: Product;
  ui: ProductUI;
  s: Styles;
  onPress: () => void;
}) {
  // The one line that says what the job takes and what it gives back. Kept beside the card
  // rather than inside the registry because it is this screen's sentence, not a catalogue field.
  const shape =
    product.slug === "subtitles"
      ? "Audio in · timed .srt out"
      : product.slug === "voiceover"
        ? "Your words in · MP3 out"
        : "Tap to open";

  return (
    <Pressable
      style={s.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.label}. ${product.blurb} ${product.price}`}
    >
      <Text style={s.cardShape}>{shape}</Text>
      <Text style={s.cardName}>{product.label}</Text>
      <Text style={s.cardBlurb}>{product.blurb}</Text>
      <View style={s.cardFoot}>
        <Text style={s.cardPrice}>{product.price}</Text>
        <View style={s.open}>
          <Text style={[s.openText, { color: ui.accent }]}>Open →</Text>
        </View>
      </View>
    </Pressable>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function makeStyles(ui: ProductUI, ACCENT: string) {
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
    count: { color: MUTED, fontSize: 12.5, fontWeight: "700" },
    h1: { color: INK, fontSize: 32, fontWeight: "800", lineHeight: 37, marginBottom: 8 },
    sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 20 },

    card: {
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      backgroundColor: ui.surface,
    },
    cardShape: { color: ACCENT, fontSize: 10.5, fontWeight: "800", letterSpacing: 1 },
    cardName: { color: INK, fontSize: 22, fontWeight: "800", marginTop: 6 },
    cardBlurb: { color: MUTED, fontSize: 14, lineHeight: 20, marginTop: 4 },
    cardFoot: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
    },
    cardPrice: { color: INK, fontSize: 13, fontWeight: "700" },
    open: { paddingVertical: 4 },
    openText: { fontSize: 13.5, fontWeight: "800" },

    soonBox: {
      borderWidth: 1,
      borderColor: LINE,
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
      backgroundColor: ui.c.surfaceSunken,
    },
    soonHead: { color: MUTED, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
    soonLine: { color: MUTED, fontSize: 13, lineHeight: 19, marginTop: 8 },
    soonName: { color: INK, fontWeight: "700" },

    note: {
      borderTopWidth: 1,
      borderTopColor: LINE,
      paddingTop: 16,
      marginTop: 6,
      gap: 10,
    },
    noteHead: { color: INK, fontSize: 13, fontWeight: "800" },
    noteText: { color: MUTED, fontSize: 12.5, lineHeight: 19 },
    noteStrong: { color: INK, fontWeight: "700" },
  });
}
