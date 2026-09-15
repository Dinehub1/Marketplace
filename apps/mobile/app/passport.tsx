/**
 * Passport Photo Maker — the first standalone product screen.
 *
 * Deliberately its own thing: brand colour #1d4ed8, no directory furniture, no
 * "connecting people" copy. One job, visible in the first two seconds: pick a
 * photo, choose the size, get a print-ready sheet. The steps are numbered because
 * the whole product is three taps and the user should see that immediately.
 *
 * Works on web and native: expo-image-picker opens the file dialog in a browser
 * and the camera roll on a phone, so this screen is testable without a device.
 */
import { useState } from "react";
import {
  ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";

const BLUE = "#1d4ed8";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const BG = "#f8fafc";

const SIZES = [
  { id: "passport", label: "Passport", spec: "35 × 45 mm", note: "India, most forms" },
  { id: "visa", label: "Visa 2×2", spec: "51 × 51 mm", note: "US, Schengen" },
  { id: "stamp", label: "Stamp size", spec: "20 × 25 mm", note: "Exams, forms" },
];

export default function PassportPhoto() {
  const [size, setSize] = useState("passport");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    setError(null);
    try {
      // lazy: the picker is native-only on some platforms, so it must not break the web build
      const ImagePicker = require("expo-image-picker");
      if (!perm.granted && Platform.OS !== "web") {
        setError("Photo permission is needed to make your passport photo.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1,
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
      const r = await fetch("/api/job", { method: "POST", body: form });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Could not make the photo");
      setPreview(j.preview_url ?? j.output_url);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Try another photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap}>
      <View style={s.badgeRow}>
        <Text style={s.badge}>PRINT-READY · 300 DPI</Text>
        <Text style={s.price}>₹49</Text>
      </View>

      <Text style={s.h1}>Passport photo{"\n"}in 30 seconds</Text>
      <Text style={s.sub}>
        Take a selfie or pick a photo. We cut the background, set the exact size and print
        six on one sheet.
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
          <Pressable key={o.id} onPress={() => setSize(o.id)}
            style={[s.sizeCard, size === o.id && s.sizeCardOn]}>
            <Text style={[s.sizeLabel, size === o.id && { color: BLUE }]}>{o.label}</Text>
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
          <View style={s.previewInner}>
            <Text style={{ color: MUTED, fontSize: 12 }}>preview renders here</Text>
          </View>
          <Text style={s.watermarkNote}>
            Preview is watermarked. Pay ₹49 to download the clean 300 dpi sheet.
          </Text>
          <Pressable style={s.primary}><Text style={s.primaryText}>Download clean sheet · ₹49</Text></Pressable>
        </View>
      ) : (
        <Pressable style={[s.primary, busy && { opacity: 0.7 }]} onPress={pick} disabled={busy}>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  wrap: { padding: 22, paddingBottom: 48, maxWidth: 520, width: "100%", alignSelf: "center" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  badge: { color: BLUE, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  price: { color: INK, fontSize: 20, fontWeight: "800" },
  h1: { color: INK, fontSize: 32, fontWeight: "800", lineHeight: 37, marginBottom: 10 },
  sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  steps: { flexDirection: "row", gap: 10, marginBottom: 26 },
  step: { flex: 1, alignItems: "center", gap: 6 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center" },
  stepNum: { color: BLUE, fontWeight: "800", fontSize: 12 },
  stepText: { color: MUTED, fontSize: 11, textAlign: "center" },
  label: { color: INK, fontWeight: "700", fontSize: 13, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 22 },
  sizeCard: { flex: 1, borderWidth: 1.5, borderColor: LINE, borderRadius: 12, padding: 10, backgroundColor: "#fff" },
  sizeCardOn: { borderColor: BLUE, backgroundColor: "#eff6ff" },
  sizeLabel: { color: INK, fontWeight: "700", fontSize: 13 },
  sizeSpec: { color: MUTED, fontSize: 11, marginTop: 2 },
  sizeNote: { color: "#94a3b8", fontSize: 10, marginTop: 2 },
  primary: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 12 },
  previewBox: { backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: LINE },
  previewInner: { height: 190, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  watermarkNote: { color: MUTED, fontSize: 12, marginBottom: 12 },
  foot: { color: "#94a3b8", fontSize: 11, marginTop: 18, textAlign: "center" },
});
