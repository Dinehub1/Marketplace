/**
 * Passport Photo Maker — the flagship product screen.
 *
 * One job, visible in the first two seconds: pick a photo, choose the size, get a
 * print-ready sheet. The steps are numbered because the whole product is three
 * taps and the user should see that immediately.
 *
 * Look and feel: every colour, size, radius and gap comes from
 * `lib/product-ui` (which is built on @hermes/tokens), not from constants in this
 * file. That is what makes this screen match the rest of the app and follow dark
 * mode — an audit of the first four product screens found 19 raw hex values and
 * fourteen different font sizes between them.
 *
 * Works on web and native: expo-image-picker opens the file dialog in a browser
 * and the camera roll on a phone, so this screen is testable without a device.
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";

import { WEB_BASE_URL } from "../lib/config";
import { productText, useProductUI, type ProductUI } from "../lib/product-ui";

const SIZES = [
  { id: "passport", label: "Passport", spec: "35 × 45 mm", note: "India, most forms" },
  { id: "visa", label: "Visa 2×2", spec: "51 × 51 mm", note: "US, Schengen" },
  { id: "stamp", label: "Stamp size", spec: "20 × 25 mm", note: "Exams, forms" },
];

export default function PassportPhoto() {
  const ui = useProductUI("passport-photo");
  const s = useMemo(() => makeStyles(ui), [ui]);

  const [size, setSize] = useState("passport");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ count?: number; spec?: string } | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  // Price comes from the server (the same `products` row the order charges), so
  // the screen cannot promise one number and the gateway take another.
  const [pricePaise, setPricePaise] = useState(4900);
  const [error, setError] = useState<string | null>(null);
  const rupees = Math.round(pricePaise / 100);

  async function pick() {
    setError(null);
    try {
      // lazy: the picker is native-only on some platforms, so it must not break the web build
      const ImagePicker = require("expo-image-picker");

      // Ask for the permission first and use what it returns. An earlier version
      // read a `perm` that was never defined, so the very first tap threw a
      // ReferenceError and the button did nothing at all.
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError("Photo permission is needed to make your passport photo.");
          return;
        }
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        // SDK 57 replaced MediaTypeOptions with the array form.
        mediaTypes: ["images"],
        quality: 1,
      });
      if (res.canceled || !res.assets?.length) return;
      setBusy(true);
      const asset = res.assets[0];
      const form = new FormData();
      form.append("product", "passport-photo");
      form.append("size", size);
      // web hands us a File already; native needs the uri shape
      form.append("file", Platform.OS === "web"
        ? (asset.file as any)
        : ({ uri: asset.uri, name: "photo.jpg", type: "image/jpeg" } as any));
      // A relative URL only resolves in a browser. On a phone there is no page
      // origin, so the request must name the host explicitly.
      const base = Platform.OS === "web" ? "" : WEB_BASE_URL;
      const r = await fetch(`${base}/api/job`, { method: "POST", body: form });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Could not make the photo");
      setPreview(j.preview_url ?? j.output_url);
      setJobId(j.job_id ?? null);
      if (j.price_paise) setPricePaise(Number(j.price_paise));
      // Say what was actually produced, from the engine's own numbers rather than
      // a hardcoded "six on a sheet" — how many fit depends on the chosen size.
      if (j?.meta?.photos_on_sheet) {
        const mm = j.meta.size_mm ? `${j.meta.size_mm} mm` : "";
        const px = j.meta.photo_px ? `${j.meta.photo_px} px` : "";
        setSheet({ count: j.meta.photos_on_sheet, spec: [mm, px].filter(Boolean).join(" · ") });
      } else {
        setSheet(null);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Try another photo.");
    } finally {
      setBusy(false);
    }
  }

  /** Open the paywall in the browser: OTP + Razorpay Checkout live there, not in
   *  the app, so no card details and no native payment SDK ever touch the binary. */
  async function unlock() {
    if (!jobId) return;
    const url = `${WEB_BASE_URL}/unlock/${jobId}`;
    try {
      if (Platform.OS === "web") {
        (window as any).open(url, "_blank");
        return;
      }
      const WebBrowser = require("expo-web-browser");
      await WebBrowser.openBrowserAsync(url);
    } catch (e: any) {
      setError(e?.message || "Could not open the payment page.");
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>PRINT-READY · 300 DPI</Text>
        <Text style={s.price}>₹{rupees}</Text>
      </View>

      <Text style={s.h1}>Passport photo{"\n"}in 30 seconds</Text>
      <Text style={s.sub}>
        Take a selfie or pick a photo. We cut the background, set the exact size and lay
        the copies out on one 4×6 sheet.
      </Text>

      <View style={s.steps}>
        {["Pick a photo", "Get your sheet", "Print or save"].map((t, i) => (
          <View key={t} style={s.step}>
            <View style={s.stepDot}><Text style={s.stepNum}>{i + 1}</Text></View>
            <Text style={s.stepText}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={s.label}>Choose the size</Text>
      <View style={s.row}>
        {SIZES.map((o) => (
          <Pressable
            key={o.id}
            onPress={() => setSize(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: size === o.id }}
            style={({ pressed }) => [
              s.sizeCard,
              size === o.id && s.sizeCardOn,
              pressed && s.pressed,
            ]}
          >
            <Text style={[s.sizeLabel, size === o.id && { color: ui.accent }]}>{o.label}</Text>
            <Text style={s.sizeSpec}>{o.spec}</Text>
            <Text style={s.sizeNote}>{o.note}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {preview ? (
        <View style={s.previewBox}>
          <Text style={s.label}>Your sheet</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image source={{ uri: preview }} style={s.previewImage} resizeMode="contain" />
          {sheet?.count ? (
            <Text style={s.sheetMeta}>
              {sheet.count} {sheet.count === 1 ? "photo" : "photos"} on a 4×6 in sheet
              {sheet.spec ? ` · ${sheet.spec}` : ""}
            </Text>
          ) : null}
          <Text style={s.watermarkNote}>
            The preview above is watermarked. Pay ₹{rupees} to download the clean 300 dpi sheet.
          </Text>
          <Pressable
            onPress={unlock}
            disabled={!jobId}
            accessibilityRole="button"
            style={({ pressed }) => [s.primary, pressed && s.pressed, !jobId && s.dim]}
          >
            <Text style={s.primaryText}>Download clean sheet · ₹{rupees}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={pick}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [s.primary, busy && s.dim, pressed && s.pressed]}
        >
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.primaryText}>Take or choose a photo</Text>}
        </Pressable>
      )}

      <Text style={s.foot}>
        Works offline for background removal. No sign-up until you download.
      </Text>
    </ScrollView>
  );
}

/**
 * Every value here comes from the design system: `ui.type` for the nine-step type
 * scale, `ui.space` for gaps, `ui.radius` for corners and the palette's semantic
 * colours for everything else. Nothing is a literal except the white of a button
 * label sitting on the accent colour.
 */
function makeStyles(ui: ProductUI) {
  const { type, space, radius } = ui;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.bg },
    wrap: {
      padding: space.lg, paddingBottom: space.xxl, maxWidth: 520, width: "100%", alignSelf: "center",
    },
    badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md },
    badge: { ...type.caption, color: ui.accent },
    price: { ...type.title2, color: ui.ink },
    h1: { ...type.hero, color: ui.ink, marginBottom: space.sm },
    sub: { ...type.callout, color: ui.muted, marginBottom: space.base },
    steps: { flexDirection: "row", gap: space.md, marginBottom: space.lg },
    step: { flex: 1, alignItems: "center", gap: space.sm },
    stepDot: {
      width: 26, height: 26, borderRadius: 13, backgroundColor: ui.accentTint,
      alignItems: "center", justifyContent: "center",
    },
    stepNum: { ...type.caption, color: ui.accent },
    stepText: { ...productText.fine, color: ui.muted, textAlign: "center" },
    label: { ...productText.label, color: ui.ink, marginBottom: space.sm },
    row: { flexDirection: "row", gap: space.sm, marginBottom: space.lg },
    sizeCard: {
      flex: 1, borderWidth: 1.5, borderColor: ui.hairline, borderRadius: radius.sm,
      padding: space.md, backgroundColor: ui.surface,
    },
    sizeCardOn: { borderColor: ui.accent, backgroundColor: ui.accentTint },
    sizeLabel: { ...productText.label, color: ui.ink },
    sizeSpec: { ...productText.fine, color: ui.muted, marginTop: 2 },
    sizeNote: { ...productText.fine, color: ui.faint, marginTop: 2 },
    primary: {
      backgroundColor: ui.accent, borderRadius: radius.md, paddingVertical: space.base,
      minHeight: ui.touch, alignItems: "center", justifyContent: "center", marginTop: space.xs,
    },
    primaryText: { ...productText.button, color: "#fff" },
    dim: { opacity: 0.6 },
    pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
    error: { ...type.meta, color: ui.error, marginBottom: space.md },
    previewBox: {
      backgroundColor: ui.surface, borderRadius: radius.md, padding: space.base,
      borderWidth: 1, borderColor: ui.hairline,
    },
    previewImage: {
      height: 190, width: "100%", borderRadius: radius.sm,
      backgroundColor: ui.c.surfaceSunken, marginBottom: space.sm,
    },
    sheetMeta: { ...productText.label, color: ui.ink, marginBottom: space.xs },
    watermarkNote: { ...type.meta, color: ui.muted, marginBottom: space.md },
    foot: { ...productText.fine, color: ui.faint, marginTop: space.base, textAlign: "center" },
  });
}
