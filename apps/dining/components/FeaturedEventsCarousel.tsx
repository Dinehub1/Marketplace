import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../constants/Colors';
import { EventVideoPlayer } from './EventVideoPlayer';
import { OptimizedImage } from './ui/OptimizedImage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const CARD_SPACING = 12;
const SIDE_SCALE = 0.88;
const AUTO_SLIDE_INTERVAL = 4000; // Auto-slide every 4 seconds
const DUPLICATE_COUNT = 3; // Triple the data

interface FeaturedEvent {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  cover_video_url?: string;
  event_date: string;
  start_time: string;
  venue_name?: string;
  event_venue?: any[];
  restaurants?: any;
  city?: string;
  ticket_type?: string;
  price_display_string?: string;
  is_free?: boolean;
  event_categories?: {
    id: string;
    name: string;
    icon?: string;
  };
}

interface Props {
  events: FeaturedEvent[];
}

const FeaturedEventsCarouselComponent: React.FC<Props> = ({ events }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoSlideTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const userInteracting = useRef(false);
  const isJumping = useRef(false);
  const currentScrollOffset = useRef(0);
  const eventCount = events?.length || 0;

  // Memoized: Triple the events for infinite loop effect
  const infiniteEvents = useMemo(() => {
    if (eventCount === 0) return [];
    // Create tripled array with unique keys
    const tripled: any[] = [];
    for (let i = 0; i < DUPLICATE_COUNT; i++) {
      events.forEach((event, idx) => {
        tripled.push({
          ...event,
          _key: `${i}-${idx}`,
          _index: i * eventCount + idx,
          _originalIndex: idx,
        });
      });
    }
    return tripled;
  }, [events, eventCount]);

  // Memoized: Format date function (same as EventCard)
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Format time function (same as EventCard)
  const formatTime = useCallback((timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  }, []);

  // Format price function (same as EventCard)
  const formatPrice = useCallback((event: any) => {
    // Use price_display_string from database if available
    if (event.price_display_string !== undefined && event.price_display_string !== null) {
      const priceValue = parseFloat(event.price_display_string);
      if (priceValue === 0 || event.price_display_string === '0') {
        return 'Free';
      }
      return `₹${event.price_display_string} Onwards`;
    }
    
    // Fallback to old logic if price_display_string is not available
    if (event.is_free || event.ticket_type === 'free') {
      return 'Free';
    }
    
    return 'Free';
  }, []);

  // Get venue display text (same logic as showtime page)
  const getVenueDisplay = useCallback((event: any) => {
    let venueName = '';
    let venueCity = '';
    
    // Check if event has venue_name directly (old format)
    if (event.venue_name) {
      return event.venue_name;
    }
    
    // Check event_venue array (new format)
    if (event.event_venue?.[0]) {
      const eventVenue = event.event_venue[0];
      if (eventVenue.restaurant_id && eventVenue.restaurants) {
        venueName = eventVenue.restaurants.name;
        venueCity = eventVenue.restaurants.city || event.city || '';
      } else if (eventVenue.venue_data) {
        try {
          const venueData = typeof eventVenue.venue_data === 'string' 
            ? JSON.parse(eventVenue.venue_data) 
            : eventVenue.venue_data;
          venueName = venueData.name || '';
          venueCity = event.city || '';
        } catch (e) {
          venueName = '';
        }
      }
    }
    
    // Check restaurants directly (fallback)
    if (!venueName && event.restaurants) {
      venueName = event.restaurants.name;
      venueCity = event.restaurants.address || event.city || '';
    }

    // Format venue display
    if (venueName && venueCity) {
      return `${venueName}, ${venueCity}`;
    } else if (venueName) {
      return venueName;
    }
    
    return 'Venue TBA';
  }, []);

  // Set initial scroll position to middle dataset on mount
  useEffect(() => {
    if (flatListRef.current && eventCount > 0) {
      // Start at middle set
      const initialIndex = eventCount;
      const initialOffset = initialIndex * (CARD_WIDTH + CARD_SPACING);
      
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialOffset,
          animated: false,
        });
        currentScrollOffset.current = initialOffset;
        setActiveIndex(0);
      }, 50);
    }
  }, [eventCount]);

  // Handle infinite loop - seamless jumping (only on scroll end)
  const handleInfiniteLoop = useCallback(() => {
    if (isJumping.current || eventCount === 0) return;

    const itemWidth = CARD_WIDTH + CARD_SPACING;
    const currentIndex = Math.round(currentScrollOffset.current / itemWidth);
    
    // Only jump when we're clearly in the cloned sections
    if (currentIndex <= 0) {
      // At or before first item, jump to middle set
      const targetIndex = eventCount;
      const targetOffset = targetIndex * itemWidth;
      
      isJumping.current = true;
      flatListRef.current?.scrollToOffset({
        offset: targetOffset,
        animated: false,
      });
      currentScrollOffset.current = targetOffset;
      
      setTimeout(() => {
        isJumping.current = false;
      }, 100);
    } else if (currentIndex >= eventCount * 2 - 1) {
      // At or after last item in second set, jump to middle set
      const realIndex = currentIndex % eventCount;
      const targetIndex = eventCount + realIndex;
      const targetOffset = targetIndex * itemWidth;
      
      isJumping.current = true;
      flatListRef.current?.scrollToOffset({
        offset: targetOffset,
        animated: false,
      });
      currentScrollOffset.current = targetOffset;
      
      setTimeout(() => {
        isJumping.current = false;
      }, 100);
    }
  }, [eventCount]);

  // Auto-slide functionality with infinite loop support
  useEffect(() => {
    if (eventCount === 0) return;

    const startAutoSlide = () => {
      if (autoSlideTimer.current) {
        clearInterval(autoSlideTimer.current);
      }

      autoSlideTimer.current = setInterval(() => {
        if (!userInteracting.current && flatListRef.current && !isJumping.current) {
          const currentOffset = currentScrollOffset.current;
          const nextOffset = currentOffset + (CARD_WIDTH + CARD_SPACING);
          
          flatListRef.current.scrollToOffset({
            offset: nextOffset,
            animated: true,
          });
        }
      }, AUTO_SLIDE_INTERVAL);
    };

    startAutoSlide();

    return () => {
      if (autoSlideTimer.current) {
        clearInterval(autoSlideTimer.current);
      }
    };
  }, [eventCount]);

  // Optimized: Using useNativeDriver for smooth 60 FPS scroll
  // Separated animation from state updates for better performance
  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
          useNativeDriver: true, // ✅ Native driver for animations
          listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offset = e.nativeEvent.contentOffset.x;
            currentScrollOffset.current = offset;
            
            const itemWidth = CARD_WIDTH + CARD_SPACING;
            const currentIndex = Math.round(offset / itemWidth);
            
            // Calculate real active index (map back to original events)
            const realIndex = currentIndex % eventCount;
            setActiveIndex(realIndex);
          },
        }
      ),
    [scrollX, eventCount]
  );

  // Memoized: Scroll begin handler
  const onScrollBeginDrag = useCallback(() => {
    userInteracting.current = true;
    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
    }
  }, []);

  // Memoized: Scroll end handler - Handle loop jump here
  const onMomentumScrollEnd = useCallback(() => {
    handleInfiniteLoop();
  }, [handleInfiniteLoop]);

  const onScrollEndDrag = useCallback(() => {
    userInteracting.current = false;
  }, []);

  // Optimized: Simplified parallax effects - removed translateY for better performance
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_SCALE, 1, SIDE_SCALE],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8], // Less aggressive opacity change
      extrapolate: 'clamp',
    });

    // Removed translateY interpolation for better performance

    const venueDisplay = getVenueDisplay(item);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/events/${item.id}`)}
      >
         <Animated.View
           style={[
             styles.card,
             {
               transform: [{ scale }], // Removed translateY for 60 FPS
               opacity,
             },
           ]}
         >
           {/* Image / Video - 4:5 Ratio (same as EventCard) */}
           <View style={styles.imageContainer}>
             {item.cover_video_url ? (
               <EventVideoPlayer
                 videoUrl={item.cover_video_url}
                 coverImageUrl={item.cover_image_url}
                 aspectRatio="4:5"
                 style={styles.image}
               />
             ) : (
               <OptimizedImage
                 source={{ uri: item.cover_image_url }}
                 style={styles.image}
                 contentFit="cover"
                 priority="high"
                 transition={300}
                 cachePolicy="memory-disk"
                 fallbackSource={require('../assets/default-image.jpg')}
               />
             )}
           </View>

           {/* Content - Same layout as EventCard */}
           <View style={styles.content}>
             {/* Date and Time - Highlighted (same as EventCard) */}
             <View style={styles.dateTimeContainer}>
               <Text style={styles.eventDate}>{formatDate(item.event_date)}</Text>
               <Text style={styles.dateSeparator}> • </Text>
               <Text style={styles.eventTime}>{formatTime(item.start_time)}</Text>
             </View>

             {/* Title */}
             <Text style={styles.title} numberOfLines={2}>
               {item.title}
             </Text>

             {/* Venue with City - Only show if available */}
             {venueDisplay && venueDisplay !== 'Venue TBA' && (
               <Text style={styles.venueText} numberOfLines={1}>
                 {venueDisplay}
               </Text>
             )}

             {/* Ticket Price */}
             <Text style={styles.priceText}>{formatPrice(item)}</Text>

             {/* Description - 2 lines max (same as EventCard) */}
             {item.description && (
               <Text style={styles.eventDescription} numberOfLines={2}>
                 {item.description}
               </Text>
             )}
           </View>
         </Animated.View>
      </TouchableOpacity>
    );
  }, [scrollX, formatDate, formatTime, formatPrice, getVenueDisplay]);

  if (!events || events.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="star" size={22} color={PremiumColors.accent.primary} />
          <Text style={styles.headerTitle}>Featured Events</Text>
        </View>
      </View>
       {/* Carousel */}
       <Animated.FlatList
         ref={flatListRef}
         horizontal
         data={infiniteEvents}
         renderItem={renderItem}
         keyExtractor={(item) => item._key}
         showsHorizontalScrollIndicator={false}
         snapToInterval={CARD_WIDTH + CARD_SPACING}
         decelerationRate="fast"
         bounces={false}
         onScroll={onScroll}
         onScrollBeginDrag={onScrollBeginDrag}
         onScrollEndDrag={onScrollEndDrag}
         onMomentumScrollEnd={onMomentumScrollEnd}
         scrollEventThrottle={8} // Optimized: Reduced from 16 to 8 for better performance
         contentContainerStyle={{
           paddingHorizontal: (width - CARD_WIDTH) / 2,
         }}
         ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
         // Optimized performance settings for 60 FPS
         removeClippedSubviews={true} // ✅ Enable on Android for memory savings
         maxToRenderPerBatch={5} // Reduced from 7
         windowSize={5} // Reduced from 7
         initialNumToRender={3} // Reduced from 5
         updateCellsBatchingPeriod={50} // Reduced from 100
         getItemLayout={(data, index) => ({
           length: CARD_WIDTH + CARD_SPACING,
           offset: (CARD_WIDTH + CARD_SPACING) * index,
           index,
         })}
       />

      {/* Pagination - Shows only original event count */}
      <View style={styles.pagination}>
        {events.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              activeIndex === i && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// Memoized export to prevent unnecessary re-renders
export const FeaturedEventsCarousel = React.memo(FeaturedEventsCarouselComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 24,
    marginTop: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: PremiumColors.accent.primary,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: PremiumColors.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 5, // Same as EventCard - 4:5 ratio
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16, // Same as EventCard
  },
  // Date and Time styles (same as EventCard)
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  dateSeparator: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  // Title style (same as EventCard)
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 10,
    lineHeight: 24,
  },
  // Venue text style (same as EventCard)
  venueText: {
    fontSize: 13,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
    marginBottom: 8,
  },
  // Price text style (same as EventCard)
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: PremiumColors.accent.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Description style (same as EventCard)
  eventDescription: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    lineHeight: 18,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PremiumColors.background.tertiary,
  },
  dotActive: {
    width: 18,
    backgroundColor: PremiumColors.accent.primary,
  },
});
