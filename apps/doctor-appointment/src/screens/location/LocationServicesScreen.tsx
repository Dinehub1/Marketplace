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

export const LocationServicesScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleEnableLocation = () => {
    // Request location permission
    console.log('Enable location pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Enable Location Services" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        {/* Location Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <View style={styles.locationMarkers}>
              <View style={[styles.locationMarker, styles.marker1]}>
                <Text style={styles.markerIcon}>📍</Text>
              </View>
              <View style={[styles.locationMarker, styles.marker2]}>
                <Text style={styles.markerIcon}>📍</Text>
              </View>
              <View style={styles.pathLine} />
            </View>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.title}>Location</Text>
        <Text style={styles.description}>
          Your location services are switched off. Please enable location, to help us serve better.
        </Text>

        {/* Action Button */}
        <Button
          title="Enable Location"
          onPress={handleEnableLocation}
          style={styles.enableButton}
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
  locationMarkers: {
    position: 'relative',
    width: 80,
    height: 60,
  },
  locationMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker1: {
    top: 0,
    left: 10,
  },
  marker2: {
    bottom: 0,
    right: 10,
  },
  markerIcon: {
    fontSize: 16,
  },
  pathLine: {
    position: 'absolute',
    top: 25,
    left: 25,
    right: 25,
    height: 2,
    backgroundColor: Colors.textSecondary,
    borderStyle: 'dashed',
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
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
    marginBottom: Spacing['4xl'],
  },
  enableButton: {
    width: '100%',
    maxWidth: 300,
  },
});
