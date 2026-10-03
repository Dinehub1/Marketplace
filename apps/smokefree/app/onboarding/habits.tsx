import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function SmokingHabits() {
  const router = useRouter();
  const buttonColor = useThemeColor({ light: '#3498db', dark: '#2980b9' }, 'tint');
  const inputBackground = useThemeColor({ light: '#f0f0f0', dark: '#333' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  
  const [cigarettesPerDay, setCigarettesPerDay] = useState('');
  const [yearsSmoked, setYearsSmoked] = useState('');
  const [costPerPack, setCostPerPack] = useState('');
  const [cigarettesPerPack, setCigarettesPerPack] = useState('20');
  
  const handleContinue = async () => {
    try {
      // Calculate initial values for progress metrics
      const cpdNum = parseInt(cigarettesPerDay) || 0;
      const yearsNum = parseInt(yearsSmoked) || 0;
      const costNum = parseFloat(costPerPack) || 0;
      const cppNum = parseInt(cigarettesPerPack) || 20;
      
      // Store smoking habits data
      const smokingData = {
        cigarettesPerDay: cpdNum,
        yearsSmoked: yearsNum,
        costPerPack: costNum,
        cigarettesPerPack: cppNum,
      };
      
      await AsyncStorage.setItem('smokingHabits', JSON.stringify(smokingData));
      
      // Initialize progress data
      const initialProgress = {
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        packsNotSmoked: 0,
        daysLifeSaved: 0,
        moneySaved: 0,
        healthImprovement: 0,
        cigaretteCount: 0
      };
      
      await AsyncStorage.setItem('progressData', JSON.stringify(initialProgress));
      
      // Navigate to the next onboarding screen
      router.push('/onboarding/goals');
    } catch (error) {
      console.error('Error saving smoking habits:', error);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        headerTitle: 'Your Smoking Habits',
        headerBackTitle: 'Welcome'
      }} />
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>Tell us about your smoking habits</ThemedText>
        <ThemedText style={styles.description}>
          This information helps us personalize your journey and track your progress accurately.
        </ThemedText>
        
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>How many cigarettes do you smoke per day?</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBackground, color: textColor }]}
            value={cigarettesPerDay}
            onChangeText={setCigarettesPerDay}
            placeholder="e.g., 10"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>How many years have you been smoking?</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBackground, color: textColor }]}
            value={yearsSmoked}
            onChangeText={setYearsSmoked}
            placeholder="e.g., 5"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>How much does a pack of cigarettes cost?</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBackground, color: textColor }]}
            value={costPerPack}
            onChangeText={setCostPerPack}
            placeholder="e.g., 8.50"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>How many cigarettes are in a pack?</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBackground, color: textColor }]}
            value={cigarettesPerPack}
            onChangeText={setCigarettesPerPack}
            placeholder="e.g., 20"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={handleContinue}
        >
          <ThemedText style={styles.buttonText}>Continue</ThemedText>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  buttonContainer: {
    padding: 20,
    width: '100%',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});