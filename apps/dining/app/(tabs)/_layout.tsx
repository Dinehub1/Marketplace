import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { TabItem } from '../../components/HorizontalTabBar';
import { PremiumAppHeader } from '../../components/PremiumAppHeader';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';

// Import tab screens
import ActivitiesScreen from './activities';
import ComingSoonTabScreen from './coming-soon';
import ForYouScreen from './for-you';
import DiningScreen from './index';
import ShowtimeScreen from './showtime';
const TABS: TabItem[] = [
  { id: 'for-you', label: 'For You', icon: 'sparkles' },
  { id: 'dining', label: 'Dining', icon: 'restaurant' },
  { id: 'showtime', label: 'Events', icon: 'calendar' },
  { id: 'activities', label: 'Activities', icon: 'fitness' },
];

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { 
    currentLocation, 
    locationSubtitle, 
    contentSections, 
    availableTabs,
    contentLoading 
  } = useLocation();
  const [activeTab, setActiveTab] = useState('for-you');
  
  // Format location for header display
  const headerLocation = locationSubtitle 
    ? `${currentLocation}, ${locationSubtitle}` 
    : currentLocation;
  
  // Scroll position for header animation
  const scrollY = useRef(new Animated.Value(0)).current;

  // Show loading while checking auth state or content availability
  if (loading || contentLoading) {
    console.log('🔄 TabLayout: Loading auth state or content...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PremiumColors.accent.primary} />
        <Text style={styles.loadingText}>
          {loading ? 'Loading...' : 'Checking availability...'}
        </Text>
      </View>
    );
  }

  // If not authenticated, don't show tabs (navigation is handled by index.tsx)
  if (!user) {
    console.log('❌ No authenticated user found in TabLayout');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PremiumColors.accent.primary} />
        <Text style={styles.loadingText}>Please complete authentication...</Text>
      </View>
    );
  }

  console.log('✅ User found in TabLayout, showing tabs:', user.id);

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'for-you':
        return 'Search for events, movies, restaurants...';
      case 'dining':
        return "Search for 'South Indian Spots'";
      case 'showtime':
        return "Search for 'Gurinder Gill'";
      case 'activities':
        return "Search for 'Fitness & Wellness'";
      default:
        return 'Search for events, movies, restaurants...';
    }
  };

  const renderActiveScreen = () => {
    // If no content available, show coming soon tab
    if (contentSections?.showComingSoon) {
      return <ComingSoonTabScreen scrollY={scrollY} />;
    }
    
    switch (activeTab) {
      case 'for-you':
        return <ForYouScreen scrollY={scrollY} />;
      case 'dining':
        return <DiningScreen scrollY={scrollY} />;
      case 'showtime':
        return <ShowtimeScreen scrollY={scrollY} />;
      case 'activities':
        return <ActivitiesScreen scrollY={scrollY} />;
      default:
        return <ForYouScreen scrollY={scrollY} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Premium App Header with Dynamic Tabs */}
      <PremiumAppHeader
        currentLocation={headerLocation}
        onLocationChange={(loc) => {}}
        // Don't pass tabs prop - let PremiumAppHeader use dynamic tabs from location context
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder={getSearchPlaceholder()}
        scrollY={scrollY}
      />

      {/* Active Tab Screen */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  screenContainer: {
    flex: 1,
  },
});
