/**
 * Stretch — the movement diagrams.
 *
 * Why hand-drawn SVG rather than photographs or emoji: a photo of a model cannot show which
 * *part* of the movement is the point, and it cannot show direction; an emoji is a different
 * illustration on every OS version and cannot be posed at all. A vector figure can do the
 * one thing the screen actually needs — put an arrow on the body part that should be moving
 * — and it stays crisp, weighs nothing, themes to the palette, and works offline.
 *
 * ── One body, eight poses ─────────────────────────────────────────────────────────────
 *
 * Every diagram is the *same* figure, redrawn. That is deliberate: eight independently
 * drawn illustrations look like eight different people, and a routine that swaps between
 * them reads as a slideshow rather than as one class. So the anatomy is shared — head
 * radius, torso length, limb weight, the ground line — and each export below only changes
 * joint positions and adds its own direction cue.
 *
 * ── Side-specific movements ───────────────────────────────────────────────────────────
 *
 * For a movement that is done on one side at a time, the figure is mirrored and the label
 * (RIGHT / LEFT) swaps. The person never has to guess which side the screen means: the pose
 * is drawn facing the side being worked.
 */
import Svg, { Circle, Defs, G, Line, Marker, Path, Polyline } from "react-native-svg";
import { useTheme } from "@/lib/theme";
import type { StretchDiagramId } from "@/lib/stretch-diagrams";

/**
 * One coordinate space for all eight diagrams.
 *
 * 200×160 with the ground at y=140. A single viewBox means the caller can render any of
 * them at any size and they stay in proportion to each other — a movement whose figure
 * filled the frame next to one that did not would look like a zoom, not a pose.
 */
export const FIGURE_VIEWBOX = { width: 200, height: 160 };

/** Cue mark ids are per-SVG-root, so one static name is safe here. */
const ARROW = "stretch-cue-arrow";

export type Side = "both" | "left" | "right";

/**
 * A direction cue: an arrowhead in the product accent.
 *
 * It is the whole reason these are vectors. "Roll your shoulders back" is ambiguous in
 * prose and unambiguous as a curve with an arrowhead on it.
 */
function Cue({ color }: { color: string }) {
  return (
    <Defs>
      <Marker id={ARROW} markerWidth={7} markerHeight={7} refX={4.5} refY={3.5} orient="auto" markerUnits="strokeWidth">
        <Polyline points="0,0 7,3.5 0,7" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </Marker>
    </Defs>
  );
}

/**
 * The shared anatomy, as props on an SVG group.
 *
 * Rendered as stroked paths with round caps and joins rather than as filled shapes: a
 * stroked limb has no corners to get wrong when a joint moves, so a pose is defined purely
 * by where the joints are.
 */
function Figure({
  ink,
  accent,
  children,
}: {
  ink: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <G
      stroke={ink}
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Head — a filled disc so it reads as a head rather than as a knot in the neck. */}
      <Circle cx={100} cy={34} r={15} fill={ink} stroke="none" />
      {children}
      {/* The accent is used only for the part being worked, so the eye goes there first. */}
      <Cue color={accent} />
    </G>
  );
}

/** The seat / floor a seated pose sits on, so the pose is grounded rather than floating. */
function Ground({ color }: { color: string }) {
  return <Line x1={28} y1={140} x2={172} y2={140} stroke={color} strokeWidth={2.5} strokeLinecap="round" />;
}

/** A stool, for the two seated movements. */
function Stool({ color }: { color: string }) {
  return (
    <G stroke={color} strokeWidth={5} strokeLinecap="round" fill="none">
      <Line x1={74} y1={112} x2={126} y2={112} />
      <Line x1={80} y1={112} x2={80} y2={140} />
      <Line x1={120} y1={112} x2={120} y2={140} />
    </G>
  );
}

/* ── 1. Neck rolls ───────────────────────────────────────────────────────────────────── */

/** A standing figure, head tilted toward one shoulder with a half-circle cue beside it. */
function NeckRolls({ ink, accent, side }: { ink: string; accent: string; side: Side }) {
  const toRight = side !== "left";
  const tilt = toRight ? 1 : -1;
  return (
    <Figure ink={ink} accent={accent}>
      <Ground color={ink} />
      {/* Torso and legs: standing, arms relaxed at the sides. */}
      <Path d="M100 49 L100 96" stroke={ink} />
      <Path d="M100 62 L84 88" />
      <Path d="M100 62 L116 88" />
      <Path d="M100 96 L90 140" />
      <Path d="M100 96 L110 140" />
      {/* The neck: drawn in the accent, tilted, because the neck is the movement. */}
      <Path d={`M100 49 L${100 + tilt * 5} 56`} stroke={accent} strokeWidth={8} />
      {/* The half-circle the chin travels along. */}
      <Path
        d={toRight ? "M78 30 A26 26 0 0 1 112 14" : "M122 30 A26 26 0 0 0 88 14"}
        stroke={accent}
        strokeWidth={2}
        markerEnd={`url(#${ARROW})`}
        opacity={0.9}
      />
    </Figure>
  );
}

/* ── 2. Shoulder rolls ───────────────────────────────────────────────────────────────── */

/** A standing figure with the shoulder line drawing a full backward circle. */
function ShoulderRolls({ ink, accent }: { ink: string; accent: string }) {
  return (
    <Figure ink={ink} accent={accent}>
      <Ground color={ink} />
      <Path d="M100 49 L100 96" stroke={ink} />
      <Path d="M100 62 L84 90" />
      <Path d="M100 62 L116 90" />
      <Path d="M100 96 L90 140" />
      <Path d="M100 96 L110 140" />
      {/* Both shoulders, drawn in the accent: this is a two-sided movement. */}
      <Path d="M100 62 L82 64" stroke={accent} strokeWidth={8} />
      <Path d="M100 62 L118 64" stroke={accent} strokeWidth={8} />
      {/* Backward circle on the left, forward on the right — the full roll. */}
      <Path d="M74 58 A17 17 0 1 0 78 76" stroke={accent} strokeWidth={2} markerEnd={`url(#${ARROW})`} />
      <Path d="M126 58 A17 17 0 1 1 122 76" stroke={accent} strokeWidth={2} markerEnd={`url(#${ARROW})`} />
    </Figure>
  );
}

/* ── 3. Chest opener ─────────────────────────────────────────────────────────────────── */

/** Hands clasped behind the back, chest lifted, elbows drawing backwards. */
function ChestOpener({ ink, accent }: { ink: string; accent: string }) {
  return (
    <Figure ink={ink} accent={accent}>
      <Ground color={ink} />
      {/* The chest lifts: a slight backward lean through the spine. */}
      <Path d="M100 49 Q97 72 101 96" stroke={ink} />
      <Path d="M100 96 L90 140" />
      <Path d="M100 96 L110 140" />
      {/* Arms taken behind the body and joined, drawn in the accent. */}
      <Path d="M100 62 Q118 78 108 96" stroke={accent} strokeWidth={7} />
      <Path d="M100 62 Q82 78 92 96" stroke={accent} strokeWidth={7} />
      <Path d="M100 100 L100 100" />
      {/* Hands meet behind the back. */}
      <Path d="M104 96 Q100 102 96 96" stroke={accent} strokeWidth={6} />
      {/* The opening cue: two arrows pushing the elbows back. */}
      <Path d="M126 70 L138 66" stroke={accent} strokeWidth={2} markerEnd={`url(#${ARROW})`} />
      <Path d="M74 70 L62 66" stroke={accent} strokeWidth={2} markerEnd={`url(#${ARROW})`} />
    </Figure>
  );
}

/* ── 4. Seated twist ─────────────────────────────────────────────────────────────────── */

/** Seated on a stool, torso rotated, one hand braced on the opposite knee. */
function SeatedTwist({ ink, accent, side }: { ink: string; accent: string; side: Side }) {
  const toRight = side !== "left";
  return (
    <Figure ink={ink} accent={accent}>
      <Stool color={ink} />
      <Ground color={ink} />
      {/* Seated torso: hips on the stool, spine rotated by leaning the shoulder line. */}
      <Path d="M100 49 L100 108" stroke={ink} />
      {/* Thigh forward, shin down. */}
      <Path d="M100 108 L128 112" stroke={ink} />
      <Path d="M128 112 L128 140" stroke={ink} />
      <Path d="M100 108 L74 112" stroke={ink} />
      <Path d="M74 112 L74 140" stroke={ink} />
      {/* The twist: one arm across to the far knee, drawn in the accent. */}
      <Path d={toRight ? "M100 62 Q120 70 128 106" : "M100 62 Q80 70 72 106"} stroke={accent} strokeWidth={7} />
      <Path d={toRight ? "M100 62 Q80 74 74 88" : "M100 62 Q120 74 126 88"} stroke={accent} strokeWidth={7} />
      {/* Rotation cue: an arc around the shoulders. */}
      <Path
        d={toRight ? "M72 46 A30 30 0 0 1 128 44" : "M128 46 A30 30 0 0 0 72 44"}
        stroke={accent}
        strokeWidth={2}
        markerEnd={`url(#${ARROW})`}
      />
    </Figure>
  );
}

/* ── 5. Wrist & finger stretch ───────────────────────────────────────────────────────── */

/** One arm extended forward, palm turned, the other hand drawing the fingers back. */
function WristStretch({ ink, accent, side }: { ink: string; accent: string; side: Side }) {
  const toRight = side !== "left";
  const d = toRight ? 1 : -1;
  return (
    <Figure ink={ink} accent={accent}>
      <Ground color={ink} />
      <Path d="M100 49 L100 96" stroke={ink} />
      {/* The extended arm, in the accent: this is the arm being stretched. */}
      <Path d={`M100 62 L${100 + d * 40} 56`} stroke={accent} strokeWidth={7} />
      {/* The wrist bends up as the other hand pulls the fingers back. */}
      <Path d={`M${100 + d * 40} 56 L${100 + d * 46} 40`} stroke={accent} strokeWidth={6} />
      {/* The pulling hand. */}
      <Path d="M100 62 L84 84" stroke={ink} />
      {/* The other arm is relaxed. */}
      <Path d={`M100 62 L${100 - d * 16} 88`} stroke={ink} />
      <Path d="M100 96 L90 140" />
      <Path d="M100 96 L110 140" />
      {/* Cue: the wrist flexing back. */}
      <Path
        d={`M${100 + d * 52} 44 A14 14 0 ${d > 0 ? "0 1" : "0 0"} ${100 + d * 44} 26`}
        stroke={accent}
        strokeWidth={2}
        markerEnd={`url(#${ARROW})`}
      />
    </Figure>
  );
}

/* ── 6. Standing hip stretch ─────────────────────────────────────────────────────────── */

/** A lunge: front knee bent, back leg straight, hips pressed forward. */
function HipStretch({ ink, accent, side }: { ink: string; accent: string; side: Side }) {
  // The working (back) leg swaps sides, so the figure steps the other way.
  const backLeft = side === "left";
  const backX = backLeft ? 62 : 138;
  const frontX = backLeft ? 132 : 68;
  return (
    <Figure ink={ink} accent={accent}>
      <Ground color={ink} />
      <Path d="M100 49 L100 94" stroke={ink} />
      <Path d="M100 62 L86 84" />
      <Path d="M100 62 L114 84" />
      {/* Front leg: thigh forward, shin vertical, a bent knee. */}
      <Path d={`M100 94 L${frontX} 106`} stroke={ink} />
      <Path d={`M${frontX} 106 L${frontX} 140`} stroke={ink} />
      {/* Back leg: extended and straight — the one being stretched, in the accent. */}
      <Path d={`M100 94 L${backX} 122`} stroke={accent} strokeWidth={7} />
      <Path d={`M${backX} 122 L${backX} 140`} stroke={accent} strokeWidth={7} />
      {/* Cue: the hips press forward, toward the front leg. */}
      <Path
        d={backLeft ? "M100 104 L116 104" : "M100 104 L84 104"}
        stroke={accent}
        strokeWidth={2}
        markerEnd={`url(#${ARROW})`}
      />
    </Figure>
  );
}

/* ── 7. Hamstring reach ──────────────────────────────────────────────────────────────── */

/** A forward hinge: legs straight, torso folded over, head hanging. */
function HamstringReach({ ink, accent }: { ink: string; accent: string }) {
  return (
    <Figure ink={ink} accent={accent}>
      <Ground color={ink} />
      {/* Straight legs. */}
      <Path d="M100 96 L92 140" stroke={ink} />
      <Path d="M100 96 L108 140" stroke={ink} />
      {/* The fold: hips back, torso down, drawn in the accent because the hinge is the pose. */}
      <Path d="M100 54 Q78 78 92 96" stroke={accent} strokeWidth={8} />
      {/* Head hangs low. */}
      <Circle cx={90} cy={52} r={15} fill={ink} stroke="none" />
      {/* Arms hang toward the floor. */}
      <Path d="M94 62 L86 104" stroke={ink} />
      <Path d="M94 62 L100 106" stroke={ink} />
      {/* Cue: hinge at the hips, not the waist. */}
      <Path d="M118 96 A26 26 0 0 0 112 62" stroke={accent} strokeWidth={2} markerEnd={`url(#${ARROW})`} />
    </Figure>
  );
}

/* ── 8. Slow breathing ───────────────────────────────────────────────────────────────── */

/** Seated, hands resting, with concentric rings showing the breath expanding. */
function SlowBreathing({ ink, accent }: { ink: string; accent: string }) {
  return (
    <Figure ink={ink} accent={accent}>
      <Stool color={ink} />
      <Ground color={ink} />
      <Path d="M100 49 L100 106" stroke={ink} />
      <Path d="M100 106 L126 110" stroke={ink} />
      <Path d="M126 110 L126 140" stroke={ink} />
      <Path d="M100 106 L74 110" stroke={ink} />
      <Path d="M74 110 L74 140" stroke={ink} />
      {/* Hands resting on the knees. */}
      <Path d="M100 62 L120 96" stroke={ink} />
      <Path d="M100 62 L80 96" stroke={ink} />
      {/* The breath: two rings around the chest, the outer one dashed as it is still filling. */}
      <Circle cx={100} cy={78} r={30} stroke={accent} strokeWidth={2} opacity={0.85} fill="none" />
      <Circle cx={100} cy={78} r={40} stroke={accent} strokeWidth={2} opacity={0.4} fill="none" strokeDasharray="5 6" />
    </Figure>
  );
}

/* ── Registry ────────────────────────────────────────────────────────────────────────── */

/**
 * Draw one movement at a given size.
 *
 * `side` only changes the four movements that are performed one side at a time; the rest
 * accept it and ignore it, so a caller never has to know which is which.
 */
export function StretchFigure({
  id,
  side = "both",
  size = 200,
  accessibilityLabel,
}: {
  id: StretchDiagramId;
  side?: Side;
  size?: number;
  /** VoiceOver reads this. The diagram is decorative *and* informative — it is the
   *  instruction — so it is labelled rather than hidden. */
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const ink = c.ink2;
  const accent = id === "slow-breathing" ? c.info : c.positive;
  const height = (size * FIGURE_VIEWBOX.height) / FIGURE_VIEWBOX.width;

  const props = { ink, accent, side };
  const body = (() => {
    switch (id) {
      case "neck-rolls":
        return <NeckRolls {...props} />;
      case "shoulder-rolls":
        return <ShoulderRolls {...props} />;
      case "chest-opener":
        return <ChestOpener {...props} />;
      case "seated-twist":
        return <SeatedTwist {...props} />;
      case "wrist-stretch":
        return <WristStretch {...props} />;
      case "hip-stretch":
        return <HipStretch {...props} />;
      case "hamstring-reach":
        return <HamstringReach {...props} />;
      case "slow-breathing":
        return <SlowBreathing {...props} />;
    }
  })();

  return (
    <Svg
      width={size}
      height={height}
      viewBox={`0 0 ${FIGURE_VIEWBOX.width} ${FIGURE_VIEWBOX.height}`}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {body}
    </Svg>
  );
}

/**
 * The side banner for a one-side-at-a-time movement.
 *
 * Exported alongside the figure so the label and the mirrored pose cannot drift apart:
 * whoever renders the diagram renders the banner from the same `side` value.
 */
export function sideLabel(side: Side): string | null {
  if (side === "left") return "LEFT SIDE";
  if (side === "right") return "RIGHT SIDE";
  return null;
}
