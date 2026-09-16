/**
 * Toolbox — the grid screen.
 *
 * Its job: show what this app can actually do, and what it cannot, in one
 * screen with no scrolling past a promise. A card is tappable **only** if a
 * screen exists behind it; everything else wears a COMING SOON tag and says so
 * out loud when tapped. A grid of dead tiles is worse than a short grid.
 *
 * Prices are the ones in docs/product-plan.md, not invented here. Hand-drawn
 * monogram tiles rather than icons: one accent per tool, no icon-font install,
 * no emoji that render as tofu on a cheap Android font.
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";

/**
 * The grid's stylesheet: built once by the screen and handed to every card, so a
 * card cannot draw in a different scheme from the screen around it. Colours,
 * sizes and gaps come from `lib/product-ui` — this file had six of its own
 * constants and thirty-six hex values before.
 */
type Styles = ReturnType<typeof makeStyles>;

type Tool = {
  id: string;
  name: string;
  job: string;
  price: string;
  accent: string;
  /** Present only when a screen exists behind the card. */
  route?: string;
  /**
   * "ready"    — the whole job runs today, phone included.
   * "server"   — the screen is finished, but the engine does not implement this
   *              product yet, so the job comes back refused. Marked, not hidden.
   */
  status?: "ready" | "server";
};

const READY_TOOLS: Tool[] = [
  {
    id: "passport-photo",
    name: "Passport photo",
    job: "Selfie in, a print-ready 35×45 mm sheet out.",
    price: "₹49",
    accent: "#1d4ed8",
    route: "/passport",
    status: "ready",
  },
  {
    id: "bg-remove",
    name: "Background remover",
    job: "Cuts the person or product out, saves a clear PNG.",
    price: "Free · ₹99 pack",
    accent: "#0f766e",
    route: "/tools/bg-remove",
    status: "ready",
  },
  {
    id: "signature-maker",
    name: "Signature maker",
    job: "Sign with a finger, export a clean PNG for forms.",
    price: "₹49",
    accent: "#6d28d9",
    route: "/tools/signature",
    status: "ready",
  },
  {
    id: "pdf-tools",
    name: "PDF toolkit",
    job: "Merge, split or shrink PDFs before emailing them.",
    price: "Free · ₹299/mo",
    accent: "#b91c1c",
    route: "/tools/pdf",
    status: "server",
  },
  {
    id: "invoice-maker",
    name: "Invoice & GST bill",
    job: "Type the items, get a GST bill you can send.",
    price: "₹299/mo",
    accent: "#166534",
    route: "/tools/invoice",
    status: "server",
  },
];

const LIVE_COUNT = READY_TOOLS.filter((t) => t.status === "ready").length;

const SOON_TOOLS: Tool[] = [
  {
    id: "photo-repair",
    name: "Old photo repair",
    job: "Cracks and fading cleaned off a scanned photo.",
    price: "₹99",
    accent: "#9a3412",
  },
  {
    id: "product-photo",
    name: "Product photo cleaner",
    job: "Shop catalogue shots on a clean white background.",
    price: "₹99/mo",
    accent: "#0e7490",
  },
  {
    id: "card-maker",
    name: "Visiting card / ID maker",
    job: "One card design, printed or sent as an image.",
    price: "₹199",
    accent: "#7c3aed",
  },
  {
    id: "marksheet-maker",
    name: "Marksheet & certificate maker",
    job: "Certificates from a name list, for coaching classes.",
    price: "₹199",
    accent: "#a16207",
  },
  {
    id: "worksheet-maker",
    name: "Worksheet & quiz generator",
    job: "Practice sheets and quizzes from a chapter.",
    price: "₹199/mo",
    accent: "#0369a1",
  },
  {
    id: "translate-doc",
    name: "Hindi ↔ English translation",
    job: "A document in, the other language out.",
    price: "₹49",
    accent: "#0f766e",
  },
  {
    id: "study-helper",
    name: "Study helper",
    job: "Photograph a question, get the worked answer.",
    price: "₹99/mo",
    accent: "#4f46e5",
  },
  {
    id: "cover-maker",
    name: "Reel & thumbnail cover",
    job: "A cover image sized for reels and YouTube thumbs.",
    price: "₹399/mo",
    accent: "#db2777",
  },
  {
    id: "bill-tracker",
    name: "Bill scanner & expense book",
    job: "Photograph a bill, keep the month's expenses.",
    price: "₹199/mo",
    accent: "#166534",
  },
  {
    id: "catalogue",
    name: "Catalogue maker",
    job: "Your products in one shareable catalogue.",
    price: "₹199/mo",
    accent: "#b45309",
  },
  {
    id: "notes-from-audio",
    name: "Lecture → notes",
    job: "Record a class, get notes you can revise from.",
    price: "₹99/mo",
    accent: "#334155",
  },
];

function Tile({
  tool,
  onPress,
  ui,
  s,
}: {
  tool: Tool;
  onPress: () => void;
  ui: ProductUI;
  s: Styles;
}) {
  const ready = !!tool.route;
  const live = tool.status !== "server";
  const tag = !ready ? "COMING SOON" : live ? "READY" : "SERVER SOON";
  const tagStyle = !ready ? s.tagSoon : live ? s.tagReady : s.tagLater;
  const tagColor = !ready ? ui.faint : live ? ui.c.positive : ui.c.warning;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !ready }}
      accessibilityLabel={`${tool.name}. ${tool.job} ${tool.price}. ${tag}`}
      style={({ pressed }) => [s.card, !ready && s.cardSoon, pressed && { opacity: 0.75 }]}
    >
      <View style={[s.tile, { backgroundColor: ready ? tool.accent : ui.c.surfaceInset }]}>
        <Text style={[s.tileLetter, { color: ready ? "#fff" : ui.faint }]}>
          {tool.name.slice(0, 1).toUpperCase()}
        </Text>
      </View>

      <Text style={[s.cardName, !ready && { color: ui.faint }]}>{tool.name}</Text>
      <Text style={s.cardJob}>{tool.job}</Text>

      <View style={s.cardFoot}>
        <Text style={[s.cardPrice, !ready && { color: ui.faint }]}>{tool.price}</Text>
        <View style={[s.tag, tagStyle]}>
          <Text style={[s.tagText, { color: tagColor }]}>{tag}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ToolboxGrid() {
  const router = useRouter();
  const ui = useProductUI();
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>EVERYDAY TOOLS</Text>
        <Text style={s.price}>{`${LIVE_COUNT} working · ${SOON_TOOLS.length} soon`}</Text>
      </View>

      <Text style={s.h1}>Small jobs,{"\n"}finished here</Text>
      <Text style={s.sub}>
        Photo cut-outs, signatures, PDFs and bills. Every card says what it does and what it
        costs. Nothing runs without you tapping it first.
      </Text>

      <View style={s.sectionRow}>
        <Text style={s.section}>Ready now</Text>
        <Text style={s.sectionCount}>{READY_TOOLS.length}</Text>
      </View>
      <Text style={s.sectionNote}>
        READY runs the whole job today. SERVER SOON means the screen is finished but the
        engine has not been given that product yet — the job is refused, out loud, rather
        than half-done.
      </Text>
      <View style={s.grid}>
        {READY_TOOLS.map((t) => (
          <Tile key={t.id} tool={t} ui={ui} s={s} onPress={() => router.push(t.route as any)} />
        ))}
      </View>

      <View style={[s.sectionRow, { marginTop: 26 }]}>
        <Text style={s.section}>Coming soon</Text>
        <Text style={s.sectionCount}>{SOON_TOOLS.length}</Text>
      </View>
      <Text style={s.sectionNote}>
        Priced on the plan, not built yet. Tap one and it will tell you the same thing.
      </Text>

      {notice ? (
        <View style={s.notice}>
          <Text style={s.noticeText}>{notice}</Text>
          <Pressable onPress={() => setNotice(null)} accessibilityRole="button">
            <Text style={s.noticeClose}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={s.grid}>
        {SOON_TOOLS.map((t) => (
          <Tile
            key={t.id}
            tool={t}
            ui={ui}
            s={s}
            onPress={() =>
              setNotice(
                `${t.name} is not built yet — there is no screen behind this card, so nothing opens and nothing is charged.`,
              )
            }
          />
        ))}
      </View>

      <Text style={s.foot}>
        Signing and the bill numbers are worked out on your phone. The photo cut-out, the PDF
        jobs and the invoice PDF are made by the server, so they need a connection.
      </Text>
    </ScrollView>
  );
}

function makeStyles(ui: ProductUI) {
  const { type, space, radius } = ui;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.bg },
    wrap: {
      padding: space.lg, paddingBottom: space.xxl, maxWidth: 560, width: "100%", alignSelf: "center",
    },
    badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md },
    badge: { ...type.caption, color: ui.muted },
    price: { ...type.meta, color: ui.muted },
    h1: { ...type.hero, color: ui.ink, marginBottom: space.sm },
    sub: { ...type.callout, color: ui.muted, marginBottom: space.lg },
    sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.sm },
    section: { ...type.title3, color: ui.ink },
    sectionCount: { ...productText.label, color: ui.faint },
    sectionNote: { ...type.meta, color: ui.muted, marginBottom: space.md },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
    card: {
      width: "48%",
      flexGrow: 1,
      minWidth: 150, // two cards must fit on the narrowest phone we support
      backgroundColor: ui.surface,
      borderWidth: 1,
      borderColor: ui.hairline,
      borderRadius: radius.md,
      padding: space.md,
    },
    cardSoon: { backgroundColor: ui.c.surfaceInset },
    tile: {
      width: 34, height: 34, borderRadius: radius.xs, alignItems: "center",
      justifyContent: "center", marginBottom: space.sm,
    },
    tileLetter: { ...type.body, color: "#fff" },
    cardName: { ...productText.label, color: ui.ink, marginBottom: 3 },
    cardJob: { ...type.meta, color: ui.muted, minHeight: 49 },
    cardFoot: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginTop: space.sm, gap: 6,
    },
    // A price like "Free · ₹99 pack" wraps on a narrow card; the tag must stay
    // pinned to the top of the row instead of drifting down beside the second line.
    cardPrice: { ...productText.label, color: ui.ink, flexShrink: 1 },
    tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs, alignSelf: "flex-start", flexShrink: 0 },
    tagReady: { backgroundColor: ui.c.positiveTint },
    tagLater: { backgroundColor: ui.c.warningTint },
    tagSoon: { backgroundColor: ui.c.surfaceInset },
    tagText: productText.tag,
    notice: {
      backgroundColor: ui.c.warningTint,
      borderWidth: 1,
      borderColor: ui.c.warning,
      borderRadius: radius.sm,
      padding: space.md,
      marginBottom: space.md,
    },
    noticeText: { ...type.meta, color: ui.c.warning, marginBottom: 6 },
    noticeClose: { ...productText.label, color: ui.c.warning },
    foot: { ...productText.fine, color: ui.faint, marginTop: space.lg, textAlign: "center" },
  });
}
