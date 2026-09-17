/**
 * The speaker control that sits in every wellness header.
 *
 * ── Why this is one component and not six copies ───────────────────────────────────────
 *
 * It started as a per-screen control and that was a mistake worth recording. Each screen wrote its
 * own `SoundToggle` + `SpeakerGlyph`, and every one of the first three flipped `cuesOn` alone — which
 * meant that on the two screens with a voice (Breathe, Walk) tapping a crossed-out speaker left the
 * app *still talking*, because `say()` prefers the voice while `voiceOn` is true. Six hand-written
 * copies of a four-state control is six chances to get that wrong, and three of them did.
 *
 * So the control lives here, and the policy lives in `lib/sound.ts`'s `setMuted`: the icon is a
 * **master** mute that turns all three layers off together. Somebody who wants tones but no voice
 * changes that on the Profile page, deliberately, once.
 *
 * ── What it deliberately is not ────────────────────────────────────────────────────────
 *
 * - **Not a volume control.** A phone has one, and an app-level volume slider on a mindfulness screen
 *   is a control nobody has ever wanted.
 * - **Not a preference editor.** It reflects and writes the same `settings.cuesOn/voiceOn/droneOn`
 *   the Profile page does; it just writes all three at once. There is one source of truth.
 * - **Not silent about itself.** Turning sound *on* gets a light tap; turning it *off* gets nothing,
 *   because confirming "muted" with a noise is the one joke this control must not make.
 */
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { alpha, radius, space } from "@hermes/tokens";
import { Text } from "@/components/ui";
import { useSettings } from "@/lib/settings";
import { isMuted, setMuted, useSoundPrefs } from "@/lib/sound";
import { useProductUI } from "@/lib/product-ui";

/**
 * The header speaker. Self-contained: it reads the preferences it reflects and writes the ones it
 * changes, so a screen adds it with one tag and no props.
 *
 * @param labels  Optional nouns for the accessibility label, for a screen that wants to say what
 *                the sound *is* ("glass sounds", "bead sounds") rather than the generic "sound".
 *                Optional because the default is right for five of the six screens and a parameter
 *                every call site passes identically is not a parameter.
 */
export function SoundToggle({ noun = "sound" }: { noun?: string }) {
  const ui = useProductUI();
  const prefs = useSoundPrefs();
  const { update } = useSettings();
  const muted = isMuted(prefs);

  return (
    <Pressable
      onPress={() => {
        // The tap that turns sound *on* answers with a light haptic; the tap that turns it *off*
        // answers with nothing, because confirming "muted" with a noise is the one joke a mute
        // control must not make. The haptic and not a cue: playing a tone to confirm a preference
        // would need the settings write to have landed first, which is a race this control does not
        // need to have.
        if (muted) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setMuted(update, !muted);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: muted }}
      accessibilityLabel={
        muted
          ? `${noun} is off. Tap to turn it on.`
          : `${noun} is on. Tap to turn it off.`
      }
      hitSlop={12}
      style={[
        s.button,
        {
          borderColor: muted ? ui.hairline : alpha(ui.accent, 0.5),
          backgroundColor: muted ? "transparent" : ui.accentTint,
        },
      ]}
    >
      <SpeakerGlyph color={muted ? ui.faint : ui.accent} muted={muted} />
    </Pressable>
  );
}

/**
 * A speaker mark: a cone and two arcs, or a cone and a stroke through it when muted.
 *
 * Drawn here rather than added to `components/icons.tsx`: the shared in-app set is stroked at 20 pt
 * with a 1.7 weight, and this glyph has to hold up at the same size inside a bordered circle, which
 * makes it a control's mark rather than a general icon. Keeping it beside its only user means the two
 * change together.
 */
export function SpeakerGlyph({ color, muted }: { color: string; muted: boolean }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The cone: one closed path, so the speaker reads at 20 pt. */}
      <Path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" />
      {muted ? (
        <Path d="M16 9.5l4 5M20 9.5l-4 5" />
      ) : (
        <>
          <Path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
          <Path d="M18.2 6.8a7.6 7.6 0 0 1 0 10.4" />
        </>
      )}
    </Svg>
  );
}

/**
 * One sound layer, as a labelled switch.
 *
 * Shared between the Profile page's card and the Breathe screen's inline card, which is the reason
 * it is here rather than in either screen: the two had already drifted (one said "Backdrop", the
 * other "Backdrop" with a different hint) and the labels are the part a person reads when deciding
 * what to turn off. One definition means the two places cannot disagree about what "Cues" means.
 *
 * A dot rather than a tick, and colour paired with a border rather than colour alone: a tick is a
 * claim that something was completed, and a colour-only state is unreadable for the people most
 * likely to need the switch to be legible.
 */
export function SoundSwitchRow({
  label,
  hint,
  on,
  onPress,
}: {
  label: string;
  hint: string;
  on: boolean;
  onPress: () => void;
}) {
  const ui = useProductUI();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${label}, ${hint}. ${on ? "On" : "Off"}.`}
      style={[
        s.row,
        {
          borderColor: on ? ui.accent : ui.hairline,
          backgroundColor: on ? ui.accentTint : "transparent",
        },
      ]}
    >
      <View style={s.rowText}>
        <Text variant="callout" style={{ color: on ? ui.accent : ui.muted }}>
          {label}
        </Text>
        <Text variant="caption" tone="ink3" style={s.rowHint}>
          {hint}
        </Text>
      </View>
      <View
        style={[
          s.rowDot,
          { backgroundColor: on ? ui.accent : "transparent", borderColor: on ? ui.accent : ui.hairline },
        ]}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  // 40 pt visible, 64 pt tappable with the hitSlop: the header row is tight on a small phone and a
  // control that shrinks to fit is a control that fails the minimum touch target.
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    minHeight: 44,
  },
  rowText: { flex: 1, gap: 1 },
  rowHint: { lineHeight: 15 },
  rowDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
});
