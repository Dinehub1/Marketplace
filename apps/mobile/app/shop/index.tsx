/**
 * The Shop Toolkit's dashboard — this app's first screen, and deliberately not the toolbox hub.
 *
 * Why it is not a grid of tiles. The Toolbox app already is a grid of tiles, and two listings
 * whose first screen is the same screen is the "these are one app" signal Apple 4.3 and Play's
 * spam policy exist to catch. A shopkeeper's phone also wants a different shape: the thing they
 * do every day is make a bill, and everything else is secondary. So one job is the screen — a
 * full-width action card — and the rest of the listing's jobs are a list underneath it, named
 * and priced, each one honest about whether it works yet.
 *
 * Where the jobs come from. `TARGET.products` through `lib/products.ts`, the same registry the
 * listing is checked against — never a second list typed into this screen. That is what keeps
 * "1 of 7 jobs live" a measurement rather than a claim, and it means a product that gains a
 * screen is promoted here by editing one line in the registry.
 *
 * What the number under the card is. How many shops have a bill series on **this device** —
 * the invoice counter's own store, asked one question. It is labelled "on this phone" for the
 * same reason every counter label is: there is no server-side series, and a number that reads
 * as the shop's own when it is one phone's would be a lie the shopkeeper bills against.
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { countersOnThisPhone } from "@/lib/invoice-counter";
import { productsFor, type Product } from "@/lib/products";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { TARGET } from "@/lib/target";

export default function ShopDashboard() {
  const router = useRouter();
  // The screen's accent is the *listing's* colour, not a product's: this is the app's front
  // door, and the product accents belong to the products inside it.
  const ui = useProductUI();
  const s = useMemo(() => makeStyles(ui, TARGET.color), [ui]);
  const [shops, setShops] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    countersOnThisPhone()
      .then((n) => alive && setShops(n))
      .catch(() => alive && setShops(null));
    return () => {
      alive = false;
    };
  }, []);

  const claimed = productsFor(TARGET.products);
  const ready = claimed.filter((p) => p.route !== null);
  const soon = claimed.filter((p) => p.route === null);
  // The first job the listing promises that actually works. In catalogue order that is the
  // GST bill today; if another product is built ahead of it, the hero follows the registry.
  const hero = ready[0] ?? null;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>SHOP TOOLKIT</Text>
        <Text style={s.count}>{`${ready.length} of ${claimed.length} jobs live`}</Text>
      </View>

      <Text style={s.h1}>Your shop&apos;s{"\n"}paperwork</Text>
      <Text style={s.sub}>{TARGET.tagline}</Text>

      {hero ? (
        <View style={s.hero}>
          <Text style={s.heroTag}>READY NOW</Text>
          <Text style={s.heroTitle}>{hero.label}</Text>
          <Text style={s.heroBlurb}>{hero.blurb}</Text>
          <Text style={s.heroSeries}>
            {shops === null
              ? " "
              : shops === 0
                ? "No bill has been made from this phone yet."
                : `Bill numbers kept on this phone: ${shops} shop${shops === 1 ? "" : "s"}.`}
          </Text>
          <Pressable
            style={s.heroCta}
            onPress={() => router.push(hero.route as never)}
            accessibilityRole="button"
            accessibilityLabel={`${hero.label}. ${hero.blurb} ${hero.price}`}
          >
            <Text style={s.heroCtaText}>Make a bill</Text>
          </Pressable>
          <Text style={s.heroPrice}>{hero.price}</Text>
        </View>
      ) : (
        <View style={s.note}>
          <Text style={s.noteText}>
            None of this listing&apos;s jobs are built yet. That is a gap in the app, not a
            problem with your phone: the listing promises {claimed.length} jobs and this build
            can open none of them.
          </Text>
        </View>
      )}

      {soon.length > 0 ? (
        <>
          <View style={s.sectionRow}>
            <Text style={s.section}>Promised by this listing</Text>
            <Text style={s.sectionCount}>{`${soon.length} to come`}</Text>
          </View>
          <Text style={s.sectionNote}>
            These are on the plan and priced, and they are not in this build. They are listed so
            the app tells you what it cannot do yet instead of hiding it.
          </Text>

          <View style={s.list}>
            {soon.map((p, i) => (
              <SoonRow key={p.slug} product={p} ui={ui} s={s} last={i === soon.length - 1} />
            ))}
          </View>
        </>
      ) : null}

      <Text style={s.foot}>
        Everything this app does runs on your phone: a bill is made here and handed to you as a
        PDF. Nothing is uploaded to us, and there is no account to make.
      </Text>
    </ScrollView>
  );
}

function SoonRow({
  product,
  ui,
  s,
  last,
}: {
  product: Product;
  ui: ProductUI;
  s: Styles;
  last: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      style={[s.row, last && s.rowLast]}
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityLabel={`${product.label}. ${product.blurb} ${product.price}. Coming soon`}
    >
      <View style={s.rowMain}>
        <Text style={s.rowName}>{product.label}</Text>
        <Text style={s.rowBlurb}>{product.blurb}</Text>
        {open ? (
          <Text style={s.rowWhy}>
            Not built yet, so this tap cannot open it. The price is {product.price} on the plan;
            you will not be charged for something that does not run.
          </Text>
        ) : null}
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowPrice}>{product.price}</Text>
        <View style={s.tagSoon}>
          <Text style={[s.tagText, { color: ui.faint }]}>SOON</Text>
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
    h1: { color: INK, fontSize: 32, fontWeight: "800", lineHeight: 37, marginBottom: 10 },
    sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 18 },

    hero: {
      borderRadius: 20,
      padding: 18,
      backgroundColor: ui.c.surfaceSunken,
      borderWidth: 1.5,
      borderColor: LINE,
    },
    heroTag: { color: ACCENT, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.1 },
    heroTitle: { color: INK, fontSize: 23, fontWeight: "800", marginTop: 6 },
    heroBlurb: { color: MUTED, fontSize: 14, lineHeight: 20, marginTop: 4 },
    heroSeries: { color: MUTED, fontSize: 12.5, lineHeight: 18, marginTop: 10 },
    heroCta: {
      backgroundColor: ACCENT,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 14,
    },
    heroCtaText: { color: "#fff", fontWeight: "800", fontSize: 15.5 },
    heroPrice: { color: MUTED, fontSize: 12, marginTop: 8, textAlign: "center" },

    note: {
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 16,
      padding: 14,
      backgroundColor: ui.c.surfaceSunken,
    },
    noteText: { color: MUTED, fontSize: 13.5, lineHeight: 19 },

    sectionRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 28,
    },
    section: { color: INK, fontSize: 15, fontWeight: "800" },
    sectionCount: { color: MUTED, fontSize: 12.5, fontWeight: "700" },
    sectionNote: { color: MUTED, fontSize: 12.5, lineHeight: 18, marginTop: 6, marginBottom: 10 },

    list: {
      borderWidth: 1.5,
      borderColor: LINE,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: ui.surface,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: LINE,
    },
    rowLast: { borderBottomWidth: 0 },
    rowMain: { flex: 1 },
    rowName: { color: INK, fontSize: 15, fontWeight: "700" },
    rowBlurb: { color: MUTED, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
    rowWhy: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 8, fontStyle: "italic" },
    rowRight: { alignItems: "flex-end", gap: 6 },
    rowPrice: { color: INK, fontSize: 12.5, fontWeight: "700" },
    tagSoon: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: LINE,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: ui.c.surfaceInset,
    },
    tagText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.6 },

    foot: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 26 },
  });
}
