/**
 * Signature maker.
 *
 * A sheet of paper, a pen and a button. That is the whole screen: the pad takes
 * most of the height because signing with a finger is the job, and anything
 * between the finger and the paper (a scroll view that steals the gesture, a
 * form asking for a name first) breaks it.
 *
 * Strokes are kept as points, not as one bitmap, which is what makes Undo and a
 * thickness change possible at all. The PNG is rendered from the same vector
 * data the pad draws, so what you sign is exactly what is exported — the
 * background stays clear so it drops onto a form or a letterhead.
 */
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Svg, { Path, Line } from "react-native-svg";
import { saveDataUrl } from "@/lib/tools";

const VIOLET = "#6d28d9";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const BG = "#f8fafc";

const WIDTHS = [2.4, 4, 7];
const INKS = [
  { id: "ink", label: "Black", value: "#0f172a" },
  { id: "blue", label: "Blue", value: "#1d4ed8" },
];

type Pt = { x: number; y: number };
type Stroke = { d: string; w: number; c: string };

const PAD_H = 240;

function pointsToPath(pts: Pt[]): string {
  if (!pts.length) return "";
  const round = (n: number) => Math.round(n * 10) / 10;
  const [first, ...rest] = pts;
  return `M ${round(first.x)} ${round(first.y)}${rest
    .map((p) => ` L ${round(p.x)} ${round(p.y)}`)
    .join("")}`;
}

/** The exported file is the SVG the pad already draws — same geometry, same ink. */
function svgMarkup(strokes: Stroke[], w: number, h: number): string {
  const body = strokes
    .map((s) => `<path d="${s.d}" fill="none" stroke="${s.c}" stroke-width="${s.w}" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `${body}</svg>`
  );
}

/** Web: rasterise the SVG through a canvas. Transparent, so it layers on a form. */
function rasteriseOnWeb(svg: string, w: number, h: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const g: any = globalThis as any;
    if (!g?.document?.createElement || typeof g.Image === "undefined") {
      reject(new Error("This platform cannot rasterise a drawing."));
      return;
    }
    const img = new g.Image();
    img.onload = () => {
      const canvas = g.document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("This browser gave no drawing surface."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("This browser could not render the drawing."));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

export default function SignatureMaker() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [live, setLive] = useState<Stroke | null>(null);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [ink, setInk] = useState(INKS[0].value);
  const [pad, setPad] = useState({ w: 300, h: PAD_H });
  const [png, setPng] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs, not state: a pan handler that reads state gets the value from the
  // render it closed over, which loses points when two moves land in one frame.
  const liveRef = useRef<Pt[]>([]);
  const pen = useRef({ w: width, c: ink });
  pen.current = { w: width, c: ink };
  const svgRef = useRef<any>(null);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // No ScrollView stealing mid-signature: once the finger is down on the
        // pad, every move belongs to the pen.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const p = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
          liveRef.current = [p];
          setLive({ d: pointsToPath([p]), w: pen.current.w, c: pen.current.c });
        },
        onPanResponderMove: (e) => {
          const p = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
          liveRef.current = [...liveRef.current, p];
          setLive({ d: pointsToPath(liveRef.current), w: pen.current.w, c: pen.current.c });
        },
        onPanResponderRelease: () => {
          const pts = liveRef.current;
          liveRef.current = [];
          setLive(null);
          // A tap with no travel is a mis-tap, not a stroke — dropping it keeps
          // stray dots out of the exported file.
          if (pts.length < 3) return;
          setStrokes((s) => [...s, { d: pointsToPath(pts), w: pen.current.w, c: pen.current.c }]);
          setPng(null);
          setNote(null);
        },
      }),
    [],
  );

  async function exportPng() {
    setError(null);
    setNote(null);
    setBusy(true);
    const svg = svgMarkup(strokes, pad.w, pad.h);
    try {
      let dataUrl: string;
      if (typeof (globalThis as any).document?.createElement === "function") {
        dataUrl = await rasteriseOnWeb(svg, Math.round(pad.w), pad.h);
      } else {
        const ref = svgRef.current;
        if (typeof ref?.toDataURL !== "function") {
          throw new Error("Exporting a PNG on this device is not wired up in this build.");
        }
        dataUrl = await new Promise<string>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("The export timed out.")), 8000);
          ref.toDataURL(
            (b64: string) => {
              clearTimeout(timer);
              resolve(`data:image/png;base64,${b64}`);
            },
            { width: Math.round(pad.w), height: pad.h },
          );
        });
      }
      setPng(dataUrl);
      if (!saveDataUrl(dataUrl, "signature.png")) {
        setNote(
          "The PNG above is the real file, at pad size with a clear background. Saving it into your phone's photos needs the file-system and media-library modules, which are not in this build yet.",
        );
      }
    } catch (e: any) {
      setError(e?.message || "Could not export the PNG.");
    } finally {
      setBusy(false);
    }
  }

  const empty = strokes.length === 0 && !live;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.badgeRow}>
        <Text style={s.badge}>DRAWN HERE · PNG OUT</Text>
        <Text style={s.price}>₹49</Text>
      </View>

      <Text style={s.h1}>Sign it with{"\n"}your finger</Text>
      <Text style={s.sub}>
        Sign on the line below, then export a PNG with a clear background. Use it on forms,
        bills and letters without printing anything first.
      </Text>

      <View
        style={s.pad}
        onLayout={(e) =>
          setPad({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
        }
        {...responder.panHandlers}
      >
        {/* The artwork never takes the touch: every point must land on the pad so
            locationX/Y stay in one coordinate space. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg ref={svgRef} width="100%" height="100%">
            <Line
              x1={pad.w * 0.1}
              y1={pad.h - 58}
              x2={pad.w * 0.9}
              y2={pad.h - 58}
              stroke={LINE}
              strokeWidth={1.5}
              strokeDasharray="6 6"
            />
            {strokes.map((st, i) => (
              <Path
                key={i}
                d={st.d}
                fill="none"
                stroke={st.c}
                strokeWidth={st.w}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {live ? (
              <Path
                d={live.d}
                fill="none"
                stroke={live.c}
                strokeWidth={live.w}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
        </View>

        {empty ? (
          <View style={s.padHint} pointerEvents="none">
            <Text style={s.padHintText}>Sign here</Text>
            <Text style={s.padHintSub}>Finger, stylus or mouse</Text>
          </View>
        ) : null}
      </View>

      <Text style={s.label}>Pen</Text>
      <View style={s.toolRow}>
        {WIDTHS.map((w) => (
          <Pressable
            key={w}
            onPress={() => setWidth(w)}
            accessibilityRole="button"
            accessibilityState={{ selected: width === w }}
            style={[s.tool, width === w && s.toolOn]}
          >
            <View style={{ height: w, width: 20, borderRadius: w, backgroundColor: width === w ? VIOLET : MUTED }} />
          </Pressable>
        ))}
        <View style={s.spacer} />
        {INKS.map((o) => (
          <Pressable
            key={o.id}
            onPress={() => setInk(o.value)}
            accessibilityRole="button"
            accessibilityLabel={`${o.label} ink`}
            accessibilityState={{ selected: ink === o.value }}
            style={[s.tool, ink === o.value && s.toolOn]}
          >
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: o.value }} />
          </Pressable>
        ))}
        <View style={s.spacer} />
        <Pressable
          onPress={() => {
            setStrokes((prev) => prev.slice(0, -1));
            setPng(null);
          }}
          disabled={strokes.length === 0}
          accessibilityRole="button"
          style={[s.textTool, strokes.length === 0 && { opacity: 0.4 }]}
        >
          <Text style={s.textToolText}>Undo</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setStrokes([]);
            setPng(null);
            setNote(null);
            setError(null);
          }}
          disabled={strokes.length === 0}
          accessibilityRole="button"
          style={[s.textTool, strokes.length === 0 && { opacity: 0.4 }]}
        >
          <Text style={s.textToolText}>Clear</Text>
        </Pressable>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <Pressable
        style={[s.primary, (strokes.length === 0 || busy) && s.dim]}
        onPress={exportPng}
        disabled={strokes.length === 0 || busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: strokes.length === 0 || busy }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Export PNG</Text>}
      </Pressable>

      {png ? (
        <View style={s.result}>
          <Text style={s.label}>The file</Text>
          <View style={s.resultPad}>
            <Image source={{ uri: png }} style={s.resultImage} resizeMode="contain" />
          </View>
          <Text style={s.resultMeta}>
            {`PNG · ${Math.round(pad.w)}×${pad.h} · clear background · ${
              strokes.length === 1 ? "1 stroke" : `${strokes.length} strokes`
            }`}
          </Text>
          {note ? <Text style={s.hint}>{note}</Text> : null}
        </View>
      ) : null}

      <Text style={s.foot}>
        Drawing and the PNG are free and never leave your device. The ₹49 half of this
        product — the rubber stamp and letterhead version — is not built yet, so nothing is
        charged on this screen.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  wrap: { padding: 22, paddingBottom: 48, maxWidth: 520, width: "100%", alignSelf: "center" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  badge: { color: VIOLET, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  price: { color: INK, fontSize: 20, fontWeight: "800" },
  h1: { color: INK, fontSize: 32, fontWeight: "800", lineHeight: 37, marginBottom: 10 },
  sub: { color: MUTED, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  pad: {
    height: PAD_H,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: LINE,
    overflow: "hidden",
  },
  padHint: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  padHintText: { color: "#cbd5e1", fontSize: 20, fontWeight: "800" },
  padHintSub: { color: "#cbd5e1", fontSize: 12 },
  label: { color: INK, fontWeight: "700", fontSize: 13, marginTop: 18, marginBottom: 8 },
  toolRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tool: {
    width: 40,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: LINE,
    backgroundColor: "#fff",
  },
  toolOn: { borderColor: VIOLET, backgroundColor: "#f5f3ff" },
  spacer: { width: 4 },
  textTool: {
    paddingHorizontal: 12,
    height: 34,
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: LINE,
    backgroundColor: "#fff",
  },
  textToolText: { color: INK, fontSize: 12.5, fontWeight: "700" },
  primary: { backgroundColor: VIOLET, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 18 },
  dim: { opacity: 0.45 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 12, lineHeight: 18 },
  result: { marginTop: 6 },
  resultPad: {
    backgroundColor: "#eef2f7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    padding: 8,
    height: 150,
  },
  resultImage: { width: "100%", height: "100%" },
  resultMeta: { color: MUTED, fontSize: 11.5, marginTop: 8 },
  hint: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 8 },
  foot: { color: "#94a3b8", fontSize: 11, marginTop: 22, lineHeight: 16, textAlign: "center" },
});
