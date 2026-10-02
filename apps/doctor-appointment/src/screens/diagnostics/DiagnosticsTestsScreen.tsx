import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Colors, Fonts, Spacing } from '../../constants';

export const DiagnosticsTestsScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBookNow = () => {
    // Navigate to test booking flow
    navigation.navigate('DiagnosticsBooking' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Diagnostics Tests" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        {/* Empty State Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <Text style={styles.illustrationIcon}>🩺</Text>
            <View style={styles.heartbeat}>
              <Text style={styles.heartbeatLine}>___/\___/\___</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.title}>You haven't booked any tests yet</Text>
        <Text style={styles.description}>Get started with your first health checkup</Text>

        {/* Action Button */}
        <Button
          title="Book Now"
          onPress={handleBookNow}
          style={styles.bookButton}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  illustrationContainer: {
    marginBottom: Spacing['4xl'],
  },
  illustration: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  illustrationIcon: {
    fontSize: 50,
    marginBottom: Spacing.sm,
  },
  heartbeat: {
    position: 'absolute',
    bottom: 25,
  },
  heartbeatLine: {
    fontSize: 10,
    color: Colors.success,
    fontFamily: 'monospace',
  },
  title: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['4xl'],
  },
  bookButton: {
    width: '100%',
    maxWidth: 300,
  },
});
