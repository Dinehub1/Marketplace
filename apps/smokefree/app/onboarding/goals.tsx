import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function GoalSetting() {
  const router = useRouter();
  const successColor = useThemeColor({ light: '#27ae60', dark: '#2ecc71' }, 'tint');
  
  const [selectedGoal, setSelectedGoal] = useState('quit');
  
  const goals = [
    { id: 'quit', title: 'Quit Completely', description: 'Stop smoking entirely' },
    { id: 'reduce', title: 'Reduce Gradually', description: 'Cut down on cigarettes over time' },
    { id: 'health', title: 'Improve Health', description: 'Focus on health benefits' },
    { id: 'money', title: 'Save Money', description: 'Track financial benefits of quitting' },
  ];
  
  const handleFinish = async () => {
    if (selectedGoal) {
      await AsyncStorage.setItem('userGoal', selectedGoal);
      await AsyncStorage.setItem('quitDate', new Date().toISOString());
      router.replace('/(tabs)/dashboard');
    } else {
      // Optional: Add some feedback to the user
      alert('Please select a goal to start your journey.');
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerTitle: 'Set Your Goals',
        headerBackTitle: 'Habits'
      }} />
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>What&apos;s your main goal?</ThemedText>
        <ThemedText style={styles.description}>
          Select the primary reason you want to quit smoking. This will help us personalize your experience.
        </ThemedText>
        
        {goals.map((goal) => (
          <ThemedView 
            key={goal.id}
            style={[
              styles.goalCard,
              selectedGoal === goal.id && { borderColor: successColor, borderWidth: 2 }
            ]}
            onTouchEnd={() => setSelectedGoal(goal.id)}
          >
            <View style={styles.goalContent}>
              <ThemedText style={styles.goalTitle}>{goal.title}</ThemedText>
              <ThemedText style={styles.goalDescription}>{goal.description}</ThemedText>
            </View>
            <View style={[
              styles.radioButton,
              selectedGoal === goal.id && { backgroundColor: successColor }
            ]} />
          </ThemedView>
        ))}
        
        <ThemedText style={styles.note}>
          Remember, you can always adjust your goals later in the app settings.
        </ThemedText>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: successColor }]}
          onPress={handleFinish}
        >
          <ThemedText style={styles.startButtonText}>Start My Journey</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 22,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  goalDescription: {
    fontSize: 14,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 20,
    width: '100%',
  },
  startButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});