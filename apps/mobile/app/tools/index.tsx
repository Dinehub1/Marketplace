/**
 * The product hub — what *this* app can do.
 *
 * The grid used to be two hardcoded arrays. That was wrong in a way you can see: opening
 * the toolbox app offered Passport photo, the PDF toolkit and the GST invoice, which are
 * three *other* targets' products. An app whose home screen advertises its siblings is the
 * "these listings are one app" signal that Play's spam policy and Apple's 4.3 exist to
 * catch — and it is also just confusing to the person holding the phone.
 *
 * So the grid renders `TARGET.products` through `lib/products.ts`, and a target shows
 * exactly what its store listing promises. Add a product to a target in `targets.mjs` and
 * it appears here; that is the only place the list lives.
 *
 * A card is tappable **only** if a screen exists behind it. Everything else wears a
 * COMING SOON tag and says so out loud when tapped. A grid of dead tiles is worse than a
 * short grid.
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { productText, useProductUI, type ProductUI } from "@/lib/product-ui";
import { TARGET } from "@/lib/target";
import { productsFor, type Product } from "@/lib/products";

type Styles = ReturnType<typeof makeStyles>;

/**
 * A stable colour per product, from its slug.
 *
 * The previous grid hand-maintained thirty-six hex values so that related jobs shared a
 * family colour (both PDF jobs were red). That is kept, without the maintenance: the hue
 * is a hash of the slug, so a product keeps its colour across builds and two products only
 * collide by accident rather than by omission.
 */
function accentFor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) % 360;
  return `hsl(${h}, 42%, 34%)`;
}

type Card = { product: Product; ready: boolean };

function Tile({ card, onPress, ui, s }: { card: Card; onPress: () => void; ui: ProductUI; s: Styles }) {
  const { product: p, ready } = card;
  const tag = ready ? "READY" : "COMING SOON";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !ready }}
      accessibilityLabel={`${p.label}. ${p.blurb} ${p.price}. ${tag}`}
      style={({ pressed }) => [s.card, !ready && s.cardSoon, pressed && { opacity: 0.75 }]}
    >
      <View style={[s.tile, { backgroundColor: ready ? accentFor(p.slug) : ui.c.surfaceInset }]}>
        <Text style={[s.tileLetter, { color: ready ? "#fff" : ui.faint }]}>
          {p.label.slice(0, 1).toUpperCase()}
        </Text>
      </View>

      <Text style={[s.cardName, !ready && { color: ui.faint }]}>{p.label}</Text>
      <Text style={s.cardJob}>{p.blurb}</Text>

      <View style={s.cardFoot}>
        <Text style={[s.cardPrice, !ready && { color: ui.faint }]}>{p.price}</Text>
        <View style={[s.tag, ready ? s.tagReady : s.tagSoon]}>
          <Text style={[s.tagText, { color: ready ? ui.c.positive : ui.faint }]}>{tag}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ProductHub() {
  const router = useRouter();
  const ui = useProductUI();
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [notice, setNotice] = useState<string | null>(null);

  // The target's own catalogue, in the order targets.mjs declares it.
  const claimed = productsFor(TARGET.products);
  const ready = claimed.filter((p) => p.route !== null);
  const soon = claimed.filter((p) => p.route === null);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>{TARGET.family.toUpperCase()}</Text>
        <Text style={s.price}>{`${ready.length} here · ${soon.length} to come`}</Text>
      </View>

      <Text style={s.h1}>{TARGET.name}</Text>
      <Text style={s.sub}>{TARGET.tagline}</Text>

      {claimed.length === 0 ? (
        <View style={s.sectionNote}>
          <Text style={s.sectionNoteText}>
            This app has no products listed yet. That is a manifest gap, not an empty screen:
            add this target&apos;s products in apps/mobile/targets.mjs and they appear here.
          </Text>
        </View>
      ) : null}

      {ready.length > 0 ? (
        <>
          <View style={s.sectionRow}>
            <Text style={s.section}>Ready now</Text>
            <Text style={s.sectionCount}>{ready.length}</Text>
          </View>
          <Text style={s.sectionNoteText}>
            Every card here has both its screen and its engine, and runs the whole job today.
          </Text>
          <View style={s.grid}>
            {ready.map((p) => (
              <Tile
                key={p.slug}
                card={{ product: p, ready: true }}
                ui={ui}
                s={s}
                onPress={() => router.push(p.route as never)}
              />
            ))}
          </View>
        </>
      ) : null}

      {soon.length > 0 ? (
        <>
          <View style={[s.sectionRow, { marginTop: 26 }]}>
            <Text style={s.section}>Coming soon</Text>
            <Text style={s.sectionCount}>{soon.length}</Text>
          </View>
          <Text style={s.sectionNoteText}>
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
            {soon.map((p) => (
              <Tile
                key={p.slug}
                card={{ product: p, ready: false }}
                ui={ui}
                s={s}
                onPress={() =>
                  setNotice(
                    `${p.label} is not built yet — there is no screen behind this card, so nothing opens and nothing is charged.`,
                  )
                }
              />
            ))}
          </View>
        </>
      ) : null}

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
    sectionNoteText: { ...type.meta, color: ui.muted, marginBottom: space.md },
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
