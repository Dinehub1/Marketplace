import AnimatedProgress from '@/components/AnimatedProgress';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Challenge, challenges, getCurrentLevel, getNextChallenge, ProgressData } from '@/constants/Challenges';
import { Colors } from '@/constants/Colors';
import { MotivationalTips } from '@/constants/MotivationalTips';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const cardBackgroundColor = Colors[colorScheme ?? 'light'].surface;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const secondaryTextColor = Colors[colorScheme ?? 'light'].secondaryText;
  const accentColor = Colors[colorScheme ?? 'light'].tint;
  const progressRingSecondaryColor = Colors[colorScheme ?? 'light'].progressRingSecondary;

  const [progress, setProgress] = useState<ProgressData>({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    totalDays: 0,
    totalHours: 0,
    cigarettesAvoided: 0,
    packsNotSmoked: 0,
    daysLifeSaved: 0,
    moneySaved: 0,
    healthImprovement: 0,
    currentLevel: 0,
  });

  const [cigarettesSmoked, setCigarettesSmoked] = useState(0);
  const [quitDate, setQuitDate] = useState<string | null>(null);
  const [tip, setTip] = useState('');
  const [nextChallenge, setNextChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load last saved full progress
        const savedProgress = await AsyncStorage.getItem('userProgress');
        if (savedProgress) {
          const parsedProgress = JSON.parse(savedProgress);
          setProgress(parsedProgress);
          setNextChallenge(getNextChallenge(parsedProgress.currentLevel));
        }

        const savedQuitDate = await AsyncStorage.getItem('quitDate');
        setQuitDate(savedQuitDate);
        
        const countValue = await AsyncStorage.getItem('cigarettesSmoked');
        if (countValue !== null) {
          setCigarettesSmoked(parseInt(countValue));
        }

        setTip(MotivationalTips[Math.floor(Math.random() * MotivationalTips.length)]);
        
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (quitDate) {
      const interval = setInterval(async () => {
        const now = new Date();
        const quitDateTime = new Date(quitDate);
        const diffMs = now.getTime() - quitDateTime.getTime();

        if (diffMs < 0) return;

        const smokingHabitsJson = await AsyncStorage.getItem('smokingHabits');
        const habits = smokingHabitsJson ? JSON.parse(smokingHabitsJson) : { cigarettesPerDay: 20, costPerPack: 8.50, cigarettesPerPack: 20 };

        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        const minutes = totalMinutes % 60;
        const hours = totalHours % 24;
        const days = totalDays % 30;
        const months = Math.floor(totalDays / 30.44);

        const cigarettesAvoided = Math.floor((habits.cigarettesPerDay / (24 * 60)) * totalMinutes);
        const moneySaved = (cigarettesAvoided / habits.cigarettesPerPack) * habits.costPerPack;
        const packsNotSmoked = cigarettesAvoided / habits.cigarettesPerPack;
        const lifeSavedDays = Math.floor((cigarettesAvoided * 11) / (60 * 24));

        let healthImprovement = 0;
        if (totalHours >= 24) healthImprovement = 5;
        if (totalDays >= 2) healthImprovement = 10;
        if (totalDays >= 3) healthImprovement = 15;
        if (totalDays >= 7) healthImprovement = 20;
        if (totalDays >= 30) healthImprovement = 30;
        if (totalDays >= 90) healthImprovement = 40;
        if (totalDays >= 365) healthImprovement = 60;
        if (totalDays >= 5475) healthImprovement = 80;
        if (totalDays >= 7300) healthImprovement = 100;

        const newProgress: ProgressData = {
          months: months,
          days: days,
          hours: hours,
          minutes: minutes,
          totalDays: totalDays,
          totalHours: totalHours,
          cigarettesAvoided: cigarettesAvoided,
          packsNotSmoked: Math.floor(packsNotSmoked),
          daysLifeSaved: lifeSavedDays,
          moneySaved: moneySaved,
          healthImprovement: healthImprovement,
          currentLevel: 0, // Will be calculated next
        };

        const currentLevel = getCurrentLevel(newProgress);
        newProgress.currentLevel = currentLevel;

        setProgress(newProgress);
        setNextChallenge(getNextChallenge(currentLevel));

        // Persist the full progress object
        await AsyncStorage.setItem('userProgress', JSON.stringify(newProgress));

      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quitDate]);

  const handleRecordCigarette = async () => {
    Alert.alert(
      "You slipped up?",
      "It's okay. One cigarette doesn't erase your progress. Keep going, you can do this!",
      [{ text: "OK" }]
    );
    try {
      const newCount = cigarettesSmoked + 1;
      setCigarettesSmoked(newCount);
      await AsyncStorage.setItem('cigarettesSmoked', newCount.toString());
    } catch (error) {
      console.error('Failed to save cigarette count:', error);
    }
  };

  const userName = 'Petter';
  
  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} contentContainerStyle={{ paddingBottom: insets.bottom }}>
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText type="title" style={styles.headerText}>Hello! {userName}</ThemedText>

        <View style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
          <View style={styles.dailyChallengeHeader}>
            <ThemedText type="subtitle">Next Challenge: {nextChallenge?.title ?? 'All completed!'}</ThemedText>
            <IconSymbol name={nextChallenge?.icon ?? 'star.fill'} size={30} color={accentColor} />
          </View>
          <ThemedText style={styles.levelText}>Your Level {progress.currentLevel}/{challenges.length}</ThemedText>
          <AnimatedProgress
            progress={(progress.currentLevel / challenges.length) * 100}
            barColor={accentColor}
            backgroundColor={progressRingSecondaryColor}
          />
        </View>

        <ThemedText type="subtitle" style={styles.myProgressTitle}>My Progress</ThemedText>

        <View style={styles.progressGrid}>
          <View style={[styles.progressCard, styles.timeProgressCard, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={[styles.progressValue, { color: textColor }]}>{String(progress.months).padStart(2, '0')}</ThemedText>
            <ThemedText style={[styles.progressLabel, { color: secondaryTextColor }]}>Month</ThemedText>
          </View>
          <View style={[styles.progressCard, styles.timeProgressCard, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={[styles.progressValue, { color: textColor }]}>{String(progress.days).padStart(2, '0')}</ThemedText>
            <ThemedText style={[styles.progressLabel, { color: secondaryTextColor }]}>Days</ThemedText>
          </View>
          <View style={[styles.progressCard, styles.timeProgressCard, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={[styles.progressValue, { color: textColor }]}>{String(progress.hours).padStart(2, '0')}</ThemedText>
            <ThemedText style={[styles.progressLabel, { color: secondaryTextColor }]}>Hours</ThemedText>
          </View>
          <View style={[styles.progressCard, styles.timeProgressCard, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={[styles.progressValue, { color: textColor }]}>{String(progress.minutes).padStart(2, '0')}</ThemedText>
            <ThemedText style={[styles.progressLabel, { color: secondaryTextColor }]}>Minutes</ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.timeWithoutLabel, { color: secondaryTextColor}]}>Time without a cigarette</ThemedText>

        <View style={styles.progressGrid}>
          <View style={[styles.progressCard, { backgroundColor: '#e7d4ff' }]}>
            <IconSymbol name="nosign" size={24} color="#6c00ff" style={styles.progressIcon} />
            <ThemedText style={[styles.progressValueAlt, { color: '#6c00ff' }]}>{progress.packsNotSmoked} Packs</ThemedText>
            <ThemedText style={[styles.progressLabelAlt, { color: '#6c00ff' }]}>Not Smoked</ThemedText>
          </View>
          <View style={[styles.progressCard, { backgroundColor: '#d4f0ff' }]}>
            <IconSymbol name="heart.circle.fill" size={24} color="#007aff" style={styles.progressIcon} />
            <ThemedText style={[styles.progressValueAlt, { color: '#007aff' }]}>{progress.daysLifeSaved} Days</ThemedText>
            <ThemedText style={[styles.progressLabelAlt, { color: '#007aff' }]}>Life Saved</ThemedText>
          </View>
          <View style={[styles.progressCard, { backgroundColor: '#fff3d4' }]}>
            <IconSymbol name="dollarsign.circle.fill" size={24} color="#ff9500" style={styles.progressIcon} />
            <ThemedText style={[styles.progressValueAlt, { color: '#ff9500' }]}>${progress.moneySaved.toFixed(2)}</ThemedText>
            <ThemedText style={[styles.progressLabelAlt, { color: '#ff9500' }]}>Money Saved</ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBackgroundColor, marginTop: 15 }]}>
          <View style={styles.healthImproveHeader}>
            <IconSymbol name="lungs.fill" size={30} color={accentColor} />
            <ThemedText type="subtitle" style={{ marginLeft: 10 }}>Health Improve</ThemedText>
            <ThemedText style={[styles.healthImprovePercent, { color: accentColor }]}>{progress.healthImprovement}%</ThemedText>
          </View>
          <AnimatedProgress
            progress={progress.healthImprovement}
            barColor={accentColor}
            backgroundColor={progressRingSecondaryColor}
          />
        </View>

        <ThemedText style={{ marginTop: 20, fontSize: 18 }}>Cigarettes Smoked Today: {cigarettesSmoked}</ThemedText>

        <TouchableOpacity style={[styles.recordButton, { backgroundColor: accentColor }]} onPress={handleRecordCigarette}>
          <ThemedText style={[styles.recordButtonText, { color: Colors.dark.text }]}>Record Cigarette Smoked</ThemedText>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: cardBackgroundColor, marginTop: 20 }]}>
          <ThemedText type="subtitle" style={{ marginBottom: 10, textAlign: 'center' }}>Motivational Tip</ThemedText>
          <ThemedText style={{ fontSize: 16, textAlign: "center", fontStyle: 'italic' }}>{tip}</ThemedText>
        </View>

      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerText: {
    marginBottom: 25,
  },
  card: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 3px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  dailyChallengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelText: {
    fontSize: 16,
    marginBottom: 8,
  },
  levelProgressBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  levelProgressBar: {
    height: '100%',
    borderRadius: 6,
  },
  myProgressTitle: {
    marginTop: 15,
    marginBottom: 20,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressCard: {
    width: '48%',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 3px rgba(0,0,0,0.1)',
    elevation: 3,
  },
  timeProgressCard: {
    width: '23%',
    paddingVertical: 10,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  timeWithoutLabel: {
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 15,
    fontSize: 14,
  },
  progressIcon: {
    marginBottom: 5,
  },
  progressValueAlt: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressLabelAlt: {
    fontSize: 12,
    textAlign: 'center',
  },
  healthImproveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthImprovePercent: {
    marginLeft: 'auto',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  cigaretteTracker: {
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
    marginHorizontal: 15,
  },
});