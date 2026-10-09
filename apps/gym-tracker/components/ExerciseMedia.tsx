import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/constants/theme';
import type { Exercise } from '@/lib/exercises';
import { animationUrl, imageUrl, MEDIA_CREDIT } from '@/lib/media';

/** The 180×180 still, for list rows. Falls back to a glyph when media is off or fails to load. */
export function ExerciseThumb({ exercise, size = 60 }: { exercise: Exercise | undefined; size?: number }) {
  const t = useTheme();
  const [failed, setFailed] = useState(false);
  const uri = imageUrl(exercise?.media);
  return (
    <View style={[styles.thumb, { width: size, height: size, backgroundColor: uri && !failed ? t.media : t.surfaceAlt }]}>
      {uri && !failed ? (
        // The lists are virtualised already, so the web default of loading="lazy" only delays rows
        // that are on screen (and in some embedded browsers never starts them at all).
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" onError={() => setFailed(true)} transition={120} loading="eager" />
      ) : (
        <MaterialCommunityIcons name="dumbbell" size={size * 0.45} color={t.textMuted} />
      )}
    </View>
  );
}

/**
 * The large animated demo with its credit. Tapping pauses it (shows the still) and plays it again,
 * which also stops a distracting loop while reading the steps.
 */
export function ExerciseDemo({ exercise, style }: { exercise: Exercise | undefined; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const gif = animationUrl(exercise?.media);
  const still = imageUrl(exercise?.media);

  if (!gif || failed) {
    return (
      <View style={[styles.demo, { backgroundColor: t.surface }, style]}>
        <MaterialCommunityIcons name="weight-lifter" size={72} color={t.textMuted} />
        <Text style={{ color: t.textMuted, marginTop: 8 }}>{exercise ? exercise.target : ''}</Text>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityLabel={paused ? 'Play animation' : 'Pause animation'}
      onPress={() => setPaused((p) => !p)}
      style={[styles.demo, { backgroundColor: t.media }, style]}>
      <Image
        source={{ uri: paused ? still! : gif }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        onError={() => setFailed(true)}
        transition={0}
        loading="eager"
      />
      <View style={[styles.badge, { left: 10 }]}>
        <Text style={styles.badgeText}>{MEDIA_CREDIT}</Text>
      </View>
      <View style={[styles.badge, { right: 10 }]}>
        <Text style={styles.badgeText}>{paused ? '▶ tap to play' : '❙❙ tap to pause'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumb: { borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  demo: { aspectRatio: 1.25, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', bottom: 10, backgroundColor: 'rgba(60,60,67,0.75)', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
