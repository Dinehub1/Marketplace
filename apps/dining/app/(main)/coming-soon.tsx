import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { useLocation } from '../../contexts/LocationContext';

const { width, height } = Dimensions.get('window');

export default function ComingSoonScreen() {
  const { currentLocation, locationSubtitle, contentAvailability } = useLocation();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLocationChange = () => {
    router.push('/location-search');
  };

  const handleGoBack = () => {
    // Don't use router.back() as there might not be a previous screen
    // Instead, go to location search to select a different city
    router.push('/location-search' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coming Soon</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Main Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="rocket" size={80} color={PremiumColors.accent.secondary} />
            </View>
            <View style={styles.iconGlow} />
          </View>

          {/* Main Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.mainTitle}>We're Coming Soon!</Text>
            <Text style={styles.subtitle}>
              We're not available in{' '}
              <Text style={styles.cityName}>{currentLocation}</Text>
              {locationSubtitle && (
                <>
                  {', '}
                  <Text style={styles.stateName}>{locationSubtitle}</Text>
                </>
              )}
              {' '}yet, but we're working hard to bring DropBy to your city.
            </Text>
          </View>

          {/* Features Coming */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What's Coming to Your City</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="restaurant" size={24} color={PremiumColors.accent.secondary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Premium Dining</Text>
                  <Text style={styles.featureDescription}>
                    Discover and book the best restaurants in your city
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="calendar" size={24} color={PremiumColors.accent.secondary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Exciting Events</Text>
                  <Text style={styles.featureDescription}>
                    Book tickets for concerts, shows, and exclusive events
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="bicycle" size={24} color={PremiumColors.accent.secondary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Fun Activities</Text>
                  <Text style={styles.featureDescription}>
                    Explore unique experiences and activities near you
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLocationChange}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={20} color={PremiumColors.text.primary} />
              <Text style={styles.primaryButtonText}>Try Different Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                // TODO: Add notification signup functionality
                console.log('Notify me when available');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={20} color={PremiumColors.accent.secondary} />
              <Text style={styles.secondaryButtonText}>Notify Me When Available</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          {contentAvailability && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Current Coverage</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>1+</Text>
                  <Text style={styles.statLabel}>Cities</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>25+</Text>
                  <Text style={styles.statLabel}>Restaurants</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>10+</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.8,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    top: -10,
    left: -10,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cityName: {
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  stateName: {
    fontWeight: '500',
    color: PremiumColors.text.primary,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.accent.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: PremiumColors.accent.secondary,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
});
