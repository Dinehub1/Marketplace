import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../constants/Colors';
import { useLocation } from '../contexts/LocationContext';

// Performance: Disable BlurView on Android for better performance
const USE_BLUR_ON_ANDROID = false;

const { width } = Dimensions.get('window');

export interface TabItem {
  id: string;
  title: string;
  label: string;
  icon: any;
}

interface PremiumAppHeaderProps {
  currentLocation: string;
  onLocationChange: (location: string) => void;
  tabs?: TabItem[]; // Made optional - will use dynamic tabs from location context
  activeTab: string;
  onTabChange: (tabId: string) => void;
  searchPlaceholder?: string;
  scrollY?: Animated.Value;
}

export const PremiumAppHeader: React.FC<PremiumAppHeaderProps> = ({
  currentLocation,
  onLocationChange,
  tabs: propTabs,
  activeTab,
  onTabChange,
  searchPlaceholder = 'Search for events, movies, restaurants...',
  scrollY,
}) => {
  const { 
    contentSections, 
    availableTabs, 
    contentLoading,
    contentAvailability 
  } = useLocation();

  // Navigate to location search screen
  const handleLocationPress = () => {
    router.push('/location-search');
  };

  // Navigate to coming soon page if no content available
  const handleComingSoonNavigation = () => {
    router.push('/coming-soon' as any);
  };

  // Use dynamic tabs from location context or fallback to prop tabs
  const tabs = propTabs || availableTabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    label: tab.title,
    icon: tab.icon as any,
  }));

  // Calculate tab width based on number of tabs
  const tabCount = tabs.length;
  
  // Dynamic tab sizing:
  // 2 tabs: Each takes ~48% width (fits perfectly, no scroll)
  // 3 tabs: Each takes ~32% width (fits perfectly, no scroll)
  // 4 tabs: Each takes fixed width (enables horizontal scroll)
  const getTabWidth = () => {
    if (tabCount === 2) return (width - 48) / 2.1; // Slight padding
    if (tabCount === 3) return (width - 48) / 3.1; // Slight padding
    return 100; // Fixed width for 4+ tabs (enables scrolling)
  };
  
  const tabWidth = getTabWidth();

  // Check if we should show coming soon
  const shouldShowComingSoon = contentSections?.showComingSoon || 
    (contentAvailability && contentAvailability.totalContent === 0);

  // Optimized: Smooth slide-up animation - entire container shrinks
  // When scrolling, header content slides up and container height reduces
  const HEADER_CONTENT_HEIGHT = 102; // Height of location + search bar
  
  // Header content slides up
  const headerTranslateY = scrollY ? scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -HEADER_CONTENT_HEIGHT],
    extrapolate: 'clamp',
  }) : new Animated.Value(0);

  // Container top margin reduces to compensate
  const containerMarginTop = scrollY ? scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -HEADER_CONTENT_HEIGHT],
    extrapolate: 'clamp',
  }) : new Animated.Value(0);

  const HeaderContent = () => (
    <Animated.View 
      style={[
        styles.headerContent,
        {
          transform: [{ translateY: headerTranslateY }],
          opacity: scrollY ? scrollY.interpolate({
            inputRange: [0, 100, 150],
            outputRange: [1, 0.5, 0],
            extrapolate: 'clamp',
          }) : 1,
        }
      ]}
    >
      {/* Top Bar - Location + Icons */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={handleLocationPress}
          activeOpacity={0.7}
        >
          <View style={styles.locationWithIcon}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location-sharp" size={18} color={PremiumColors.accent.secondary} />
            </View>
            <View style={styles.locationTextContainer}>
              <View style={styles.locationTitleRow}>
                <Text style={styles.locationTitle} numberOfLines={1}>
                  {currentLocation.split(',')[0]}
                </Text>
                <Ionicons name="chevron-down" size={14} color={PremiumColors.accent.secondary} style={styles.chevronIcon} />
              </View>
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {currentLocation.split(',').slice(1).join(',').trim() || 'Madhya Pradesh, India'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={PremiumColors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/favorites')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={24} color={PremiumColors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              // Navigate to account page (standalone, not in tabs)
              router.push('/account');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={24} color={PremiumColors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar or Coming Soon Message */}
      {shouldShowComingSoon ? (
        <TouchableOpacity 
          style={[styles.searchBar, styles.comingSoonBar]}
          onPress={handleComingSoonNavigation}
          activeOpacity={0.7}
        >
          <Ionicons name="rocket" size={20} color={PremiumColors.accent.secondary} />
          <Text style={[styles.searchPlaceholder, styles.comingSoonText]} numberOfLines={1}>
            We're coming to {currentLocation.split(',')[0]} soon! 🚀
          </Text>
          <Ionicons name="chevron-forward" size={16} color={PremiumColors.accent.secondary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => {
            // Navigate to centralized search page
            router.push('/search');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={PremiumColors.text.tertiary} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            {searchPlaceholder}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  // Premium Glassmorphic Tab Component with Smart Scrolling
  const PremiumTabs = () => {
    const scrollViewRef = React.useRef<ScrollView>(null);
    const needsScroll = tabCount >= 4;
    
    // Animation values for each tab
    const tabAnimations = React.useRef(
      tabs.reduce((acc, tab) => {
        acc[tab.id] = new Animated.Value(activeTab === tab.id ? 1 : 0);
        return acc;
      }, {} as Record<string, Animated.Value>)
    ).current;

    // Auto-scroll to active tab when it changes
    React.useEffect(() => {
      if (needsScroll && scrollViewRef.current) {
        const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
        if (activeIndex !== -1) {
          scrollViewRef.current.scrollTo({
            x: activeIndex * (tabWidth + 6) - 50, // Scroll to center active tab
            animated: true,
          });
        }
      }
    }, [activeTab, needsScroll]);

    // Optimized: Using timing instead of spring for better performance
    // Removed tab animations - using static styles instead for 60 FPS
    React.useEffect(() => {
      // Tab animations removed for performance
      // Active tab styling now handled by static styles
    }, [activeTab]);

    return (
      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.tabsScrollContent,
              !needsScroll && styles.tabsNoScroll,
            ]}
            scrollEnabled={needsScroll}
            decelerationRate="fast"
            snapToInterval={needsScroll ? tabWidth + 6 : undefined}
            snapToAlignment="center"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabButton,
                    { width: tabWidth },
                    !needsScroll && styles.tabButtonFlex,
                  ]}
                  onPress={() => onTabChange(tab.id)}
                  activeOpacity={0.8}
                >
                  {Platform.OS === 'ios' && isActive && USE_BLUR_ON_ANDROID ? (
                    // Optimized: BlurView only on iOS for better Android performance
                    <BlurView intensity={70} tint="light" style={styles.activeTabBlur}>
                      <LinearGradient
                        colors={['rgba(0, 53, 16, 0.85)', 'rgba(0, 177, 44, 0.5)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activeTabGradient}
                      >
                        <View style={styles.tabContent}>
                          <Ionicons 
                            name={tab.icon} 
                            size={18} 
                            color={'rgb(220, 255, 220)'} 
                          />
                          <Text style={[styles.tabText, styles.activeTabText]} numberOfLines={1}>
                            {tab.label}
                          </Text>
                        </View>
                      </LinearGradient>
                    </BlurView>
                  ) : (
                    // Optimized: Removed LinearGradient for non-iOS, using solid colors
                    <View style={[
                      styles.tabContentWrapper,
                      isActive && styles.activeTabWrapper
                    ]}>
                      <View style={styles.tabContent}>
                        <Ionicons 
                          name={tab.icon} 
                          size={18} 
                          color={isActive ? 'rgb(220, 255, 220)' : PremiumColors.text.tertiary}
                        />
                        <Text style={[
                          styles.tabText,
                          isActive && styles.activeTabText
                        ]} numberOfLines={1}>
                          {tab.label}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  // Optimized: Use solid background on all platforms for better performance
  // BlurView causes 30-40% FPS drop on Android
  return (
    <Animated.View 
      style={[
        styles.container, 
        styles.androidContainer,
        {
          marginTop: containerMarginTop,
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(26, 26, 29, 0.98)', 'rgba(18, 18, 20, 0.99)']}
        style={styles.gradientOverlay}
      />
      {/* Wrapper to prevent empty space when header slides up */}
      <View style={styles.headerWrapper}>
        <HeaderContent />
      </View>
      {!shouldShowComingSoon && tabs.length > 0 && <PremiumTabs />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // Prevents header from showing when sliding up
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  androidContainer: {
    backgroundColor: 'rgba(26, 26, 29, 0.98)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerWrapper: {
    overflow: 'hidden', // Clips the sliding header
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    position: 'relative',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationButton: {
    flex: 1,
    marginRight: 8,
  },
  locationWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    marginTop: 2,
    marginRight: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    lineHeight: 18,
    letterSpacing: -0.2,
    flexShrink: 1, // Changed from flex: 1 to allow text to take only needed space
  },
  chevronIcon: {
    marginLeft: 2, // Reduced from 4 to 2 for closer spacing
  },
  locationSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: PremiumColors.text.tertiary,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileButton: {
    padding: 0,
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(187, 205, 189, 0.18)',
    borderWidth: 1.5,
    borderColor: PremiumColors.accent.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PremiumColors.accent.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 46, 53, 0.75)',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(187, 205, 189, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: PremiumColors.text.tertiary,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  comingSoonBar: {
    backgroundColor: 'rgba(187, 205, 189, 0.12)',
    borderColor: PremiumColors.accent.secondary,
    justifyContent: 'space-between',
  },
  comingSoonText: {
    color: PremiumColors.accent.secondary,
    fontWeight: '600',
  },
  
  // ====== PREMIUM GLASSMORPHIC TABS ======
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    position: 'relative',
    zIndex: 5,
  },
  tabsWrapper: {
    backgroundColor: 'rgba(46, 46, 53, 0.38)',
    borderRadius: 14,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 85, 16, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  tabsScrollContent: {
    gap: 6,
    paddingHorizontal: 2,
  },
  tabsNoScroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  tabButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabButtonFlex: {
    flex: 1,
  },
  activeTabBlur: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 76, 0.6)',
    shadowColor: 'rgb(0, 255, 76)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  activeTabGradient: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tabContentWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  activeTabWrapper: {
    backgroundColor: 'rgba(0, 53, 16, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 76, 0.5)',
    shadowColor: 'rgb(0, 255, 76)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PremiumColors.text.tertiary,
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: 'rgb(220, 255, 220)',
    fontWeight: '700',
    fontSize: 13,
    textShadowColor: 'rgba(0, 255, 76, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

