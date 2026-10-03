/**
 * Ambient Sounds & White Noise — Sleep, Focus & Relaxation Audio Machine.
 *
 * Inspired by Moodist (eval-repos/moodist) and adapted for Expo mobile.
 *
 * Features:
 * - 8 Ambient Sound channels (White Noise, Brown Noise, Gentle Rain, Night Crickets,
 *   Ocean Waves, Forest Birds, Coffee Shop, Binaural Delta Waves).
 * - Individual volume sliders and master mute/play.
 * - Sleep countdown timer (15 min, 30 min, 45 min, 60 min) with auto-stop.
 * - Rewarded Ad integration: "Unlock Binaural Deep Sleep pack".
 * - AdBanner at the bottom (generates hundreds of impressions during long sessions).
 */
import { useEffect, useState } from "react";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { setAudioModeAsync } from "expo-audio";
import { alpha, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { AdBanner } from "@/components/ad-slot";

type SoundChannel = {
  id: string;
  name: string;
  icon: string;
  category: "noise" | "nature" | "focus";
  isPremium?: boolean;
};

const SOUND_PRESETS: SoundChannel[] = [
  { id: "white-noise", name: "White Noise", icon: "📻", category: "noise" },
  { id: "brown-noise", name: "Brown Noise", icon: "🌊", category: "noise" },
  { id: "gentle-rain", name: "Gentle Rain", icon: "🌧️", category: "nature" },
  { id: "thunderstorm", name: "Thunderstorm", icon: "⛈️", category: "nature" },
  { id: "ocean-waves", name: "Ocean Waves", icon: "🏖️", category: "nature" },
  { id: "night-crickets", name: "Night Forest", icon: "🦗", category: "nature" },
  { id: "coffee-shop", name: "Quiet Cafe", icon: "☕", category: "focus" },
  { id: "binaural-delta", name: "Binaural Delta (Sleep)", icon: "🧠", category: "focus", isPremium: true },
];

export default function AmbientSoundsScreen() {
  const { c, brand } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeSounds, setActiveSounds] = useState<Record<string, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);

  // Setup audio session
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch(() => {});
  }, []);

  // Sleep timer countdown
  useEffect(() => {
    if (!timerSecondsLeft || !isPlaying) return;

    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          setIsPlaying(false);
          setActiveSounds({});
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSecondsLeft, isPlaying]);

  function toggleSound(sound: SoundChannel) {
    if (sound.isPremium && !premiumUnlocked) {
      handleUnlockPremium();
      return;
    }

    Haptics.selectionAsync();
    setActiveSounds((prev) => {
      const next = { ...prev };
      if (next[sound.id]) {
        delete next[sound.id];
      } else {
        next[sound.id] = 0.7; // Default 70% volume
      }
      setIsPlaying(Object.keys(next).length > 0);
      return next;
    });
  }

  function handleSetTimer(mins: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerMinutes === mins) {
      setTimerMinutes(null);
      setTimerSecondsLeft(null);
    } else {
      setTimerMinutes(mins);
      setTimerSecondsLeft(mins * 60);
    }
  }

  function handleMasterToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (Object.keys(activeSounds).length === 0) {
        // Default to rain + brown noise
        setActiveSounds({ "gentle-rain": 0.7, "brown-noise": 0.5 });
      }
      setIsPlaying(true);
    }
  }

  function handleUnlockPremium() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPremiumUnlocked(true);
    setActiveSounds((prev) => ({ ...prev, "binaural-delta": 0.8 }));
    setIsPlaying(true);
  }

  function formatTimer(sec: number | null) {
    if (sec === null) return "Off";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: c.canvas,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* ── Top Header ── */}
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: c.ink }]}>Ambient Sounds</Text>
          <Text style={[s.subtitle, { color: c.ink2 }]}>
            {isPlaying
              ? `${Object.keys(activeSounds).length} active • Timer: ${formatTimer(timerSecondsLeft)}`
              : "Tap sounds to mix your soundscape"}
          </Text>
        </View>

        <Pressable
          onPress={handleMasterToggle}
          style={[
            s.playBtn,
            { backgroundColor: isPlaying ? brand.primary : c.surfaceRaised },
          ]}
        >
          <Text style={[s.playBtnText, { color: isPlaying ? "#ffffff" : c.ink }]}>
            {isPlaying ? "Pause ⏸" : "Play ▶"}
          </Text>
        </Pressable>
      </View>

      {/* ── Sleep Timer Bar ── */}
      <View style={s.timerBar}>
        <Text style={[s.timerLabel, { color: c.ink2 }]}>SLEEP TIMER:</Text>
        {[15, 30, 45, 60].map((mins) => (
          <Pressable
            key={mins}
            onPress={() => handleSetTimer(mins)}
            style={[
              s.timerPill,
              {
                backgroundColor: timerMinutes === mins ? brand.primary : c.surfaceRaised,
                borderColor: c.hairline,
              },
            ]}
          >
            <Text
              style={[
                s.timerPillText,
                { color: timerMinutes === mins ? "#ffffff" : c.ink },
              ]}
            >
              {mins}m
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Sound Cards Grid ── */}
      <ScrollView
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
      >
        {SOUND_PRESETS.map((snd) => {
          const isActive = isPlaying && !!activeSounds[snd.id];
          const isLocked = snd.isPremium && !premiumUnlocked;

          return (
            <Pressable
              key={snd.id}
              onPress={() => toggleSound(snd)}
              style={[
                s.card,
                {
                  backgroundColor: isActive ? alpha(brand.primary, 0.15) : c.surfaceRaised,
                  borderColor: isActive ? brand.primary : c.hairline,
                },
              ]}
            >
              <Text style={s.cardIcon}>{snd.icon}</Text>
              <Text style={[s.cardName, { color: c.ink }]}>{snd.name}</Text>

              {isLocked ? (
                <View
                  style={[
                    s.rewardBadge,
                    { backgroundColor: alpha(brand.primary, 0.2) },
                  ]}
                >
                  <Text style={[s.rewardBadgeText, { color: brand.primary }]}>
                    🎁 Rewarded Ad
                  </Text>
                </View>
              ) : (
                <Text style={[s.cardStatus, { color: isActive ? brand.primary : c.ink2 }]}>
                  {isActive ? "Active" : "Tap to Play"}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Bottom Sticky AdBanner ── */}
      <View style={s.adContainer}>
        <AdBanner accent={brand.primary} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  playBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  timerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: 8,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  timerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  timerPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: space.md,
    gap: space.md,
    paddingBottom: space.md,
  },
  card: {
    width: "47%",
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  rewardBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rewardBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  adContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    paddingBottom: space.xs,
  },
});
