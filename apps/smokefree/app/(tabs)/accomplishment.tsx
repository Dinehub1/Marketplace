import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { challenges, ProgressData } from '@/constants/Challenges';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

export default function AccomplishmentScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const certificateRef = useRef<ViewShot>(null);

  const cardBackgroundColor = Colors[colorScheme ?? 'light'].surface;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const accentColor = Colors[colorScheme ?? 'light'].tint;
  const buttonTextColor = Colors.dark.text;

  const [userName] = useState('User'); // Placeholder
  const [achievement, setAchievement] = useState('a smoke-free life');
  const [completionDate, setCompletionDate] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const progressJson = await AsyncStorage.getItem('userProgress');
        const goal = await AsyncStorage.getItem('userGoal');
        const quitDate = await AsyncStorage.getItem('quitDate');

        if (progressJson) {
          const progress: ProgressData = JSON.parse(progressJson);
          const highestChallenge = challenges
            .filter(c => c.isUnlocked(progress))
            .sort((a, b) => b.level - a.level)[0];
          
          if (highestChallenge) {
            setAchievement(highestChallenge.title);
          } else if (goal) {
            setAchievement(goal);
          }
        } else if (goal) {
          setAchievement(goal);
        }

        if (quitDate) {
          setCompletionDate(new Date(quitDate).toLocaleDateString());
        }
      };
      loadData();
    }, [])
  );

  const handleShare = async () => {
    try {
      if (certificateRef.current) {
        const uri = await certificateRef.current.capture?.();
        await Sharing.shareAsync(uri!);
      }
    } catch (error) {
      console.error('Error sharing certificate:', error);
    }
  };

  const handleDownload = async () => {
    try {
      if (certificateRef.current) {
        const uri = await certificateRef.current.capture?.();
        const html = `
          <html>
            <body style="display: flex; justify-content: center; align-items: center; height: 100%;">
              <img src="${uri}" style="width: 90%; max-width: 800px; object-fit: contain;" />
            </body>
          </html>
        `;
        const { uri: pdfUri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf', dialogTitle: 'Download Certificate' });
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom }}>
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText type="title" style={styles.headerText}>Your Accomplishment</ThemedText>

        <ViewShot ref={certificateRef} options={{ fileName: "quit-now-certificate", format: "png", quality: 0.9 }}>
          <View style={[styles.certificateCard, { backgroundColor: cardBackgroundColor }]}>
            <Image source={require('@/assets/images/certificate-bg.png')} style={styles.certificateImage} resizeMode="cover" />
            <ThemedText style={styles.certificateBadgeText}>Certificate of Achievement</ThemedText>
            <ThemedText style={styles.certificateName}>{userName}</ThemedText>
            <ThemedText style={styles.certificateDetails}>
              This is to certify that {userName} has successfully achieved the goal of
            </ThemedText>
            <ThemedText style={styles.certificateAchievement}>{achievement}</ThemedText>
            <ThemedText style={styles.certificateDate}>On {completionDate || new Date().toLocaleDateString()}</ThemedText>
          </View>
        </ViewShot>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, { backgroundColor: accentColor }]} onPress={handleShare}>
            <IconSymbol name="square.and.arrow.up" color={buttonTextColor} size={18} />
            <ThemedText style={[styles.buttonText, { color: buttonTextColor, marginLeft: 8 }]}>Share</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].secondaryButton }]} onPress={handleDownload}>
            <IconSymbol name="arrow.down.to.line" color={textColor} size={18} />
            <ThemedText style={[styles.buttonText, { color: textColor, marginLeft: 8 }]}>Download</ThemedText>
          </TouchableOpacity>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  certificateCard: {
    borderRadius: 15,
    marginBottom: 30,
    alignItems: 'center',
    padding: 25,
    minHeight: 380,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  certificateImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.1,
  },
  certificateBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B08D57',
    borderWidth: 1,
    borderColor: '#B08D57',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 25,
    textTransform: 'uppercase',
  },
  certificateName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  certificateDetails: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  certificateAchievement: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B08D57',
    textAlign: 'center',
    marginBottom: 20,
  },
  certificateDate: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    elevation: 3,
    boxShadow: '0 2px 3px rgba(0,0,0,0.1)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});