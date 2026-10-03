import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Challenge, challenges, ProgressData } from '@/constants/Challenges';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChallengeWithStatus extends Omit<Challenge, 'isUnlocked'> {
  isUnlocked: boolean;
}

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const cardBackgroundColor = Colors[colorScheme ?? 'light'].surface;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const secondaryTextColor = Colors[colorScheme ?? 'light'].secondaryText;
  const accentColor = Colors[colorScheme ?? 'light'].tint;
  const disabledCardColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  const [challengesWithStatus, setChallengesWithStatus] = useState<ChallengeWithStatus[]>([]);
  
  useFocusEffect(
    useCallback(() => {
      const loadProgressData = async () => {
        try {
          const storedProgress = await AsyncStorage.getItem('userProgress');
          const progress: ProgressData | null = storedProgress ? JSON.parse(storedProgress) : null;

          const updatedChallenges = challenges.map(challenge => ({
            ...challenge,
            isUnlocked: progress ? challenge.isUnlocked(progress) : false,
          }));
          setChallengesWithStatus(updatedChallenges);
        } catch (e) {
          console.error('Failed to load progress data in Challenges:', e);
        }
      };

      loadProgressData();
    }, [])
  );

  const unlockedCount = challengesWithStatus.filter(c => c.isUnlocked).length;

  const renderChallengeCard = ({ item }: { item: ChallengeWithStatus }) => (
    <View style={[
      styles.challengeCard,
      { backgroundColor: item.isUnlocked ? cardBackgroundColor : disabledCardColor },
      !item.isUnlocked && styles.lockedChallengeCard
    ]}>
      <IconSymbol name={item.icon as any} size={36} color={item.isUnlocked ? accentColor : secondaryTextColor} style={styles.challengeIcon} />
      <ThemedText style={[styles.challengeLevel, { color: item.isUnlocked ? accentColor : secondaryTextColor }]}>Level {item.level}</ThemedText>
      <ThemedText style={[styles.challengeDescription, { color: item.isUnlocked ? textColor : secondaryTextColor }]} numberOfLines={2}>{item.description}</ThemedText>
      {!item.isUnlocked && (
        <View style={styles.lockOverlay}>
          <IconSymbol name="lock.fill" size={24} color={secondaryTextColor} />
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background, paddingBottom: insets.bottom, paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.headerText}>Challenges</ThemedText>
          <ThemedText style={[styles.progressText, { color: secondaryTextColor }]}>{`${unlockedCount}/${challenges.length}`}</ThemedText>
        </View>
        <FlatList
          data={challengesWithStatus}
          renderItem={renderChallengeCard}
          keyExtractor={(item) => `challenge-${item.level}`}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
        />
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerText: {
    textAlign: 'left',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 15,
  },
  challengeCard: {
    flex: 1,
    margin: 5,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    elevation: 4,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  lockedChallengeCard: {
    elevation: 0,
  },
  challengeIcon: {
    marginBottom: 12,
  },
  challengeLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  challengeStatus: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
});