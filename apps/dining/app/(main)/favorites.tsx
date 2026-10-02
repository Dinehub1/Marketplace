import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { EventVideoPlayer } from '../../components/EventVideoPlayer';
import { FadeInView } from '../../components/FadeInView';
import { getUserFavorites } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'events' | 'restaurants' | 'artists' | 'experts'>('all');

  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    }
  }, [user?.id]);

  const loadFavorites = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔍 Loading favorites for user:', user.id);
      const { data, error } = await getUserFavorites(user.id);

      if (error) {
        console.error('❌ Error loading favorites:', error);
        return;
      }

      console.log('✅ Favorites loaded:', data?.length || 0, 'items');
      console.log('📊 Favorites data:', JSON.stringify(data, null, 2));
      setFavorites(data || []);
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get counts for each category
  const getCategoryCounts = () => {
    const counts = {
      all: favorites.length,
      events: 0,
      restaurants: 0,
      artists: 0,
      experts: 0
    };

    favorites.forEach(fav => {
      if (fav.events || fav.type === 'event') counts.events++;
      if (fav.restaurants || fav.type === 'restaurant') counts.restaurants++;
      if (fav.artists || fav.type === 'artist') counts.artists++;
      if (fav.experts || fav.type === 'expert') counts.experts++;
    });

    return counts;
  };

  const categoryCounts = getCategoryCounts();

  const filteredFavorites = selectedTab === 'all' 
    ? favorites 
    : favorites.filter(fav => {
        // Handle plural to singular conversion and null types
        const singularType = selectedTab === 'events' ? 'event' 
          : selectedTab === 'restaurants' ? 'restaurant'
          : selectedTab === 'artists' ? 'artist'
          : selectedTab === 'experts' ? 'expert'
          : selectedTab;
        
        // If type is null, check which data exists
        if (!fav.type) {
          if (singularType === 'event' && fav.events) return true;
          if (singularType === 'restaurant' && fav.restaurants) return true;
          if (singularType === 'artist' && fav.artists) return true;
          if (singularType === 'expert' && fav.experts) return true;
          return false;
        }
        
        return fav.type === singularType;
      });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Vertical Event Card (3:4 aspect ratio)
  const EventCard = ({ item }: { item: any }) => {
    const data = item.events || item;
    
    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => router.push(`/events/${data.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.eventImageContainer}>
          {data.cover_video_url ? (
            <EventVideoPlayer 
              videoUrl={data.cover_video_url}
              coverImageUrl={data.cover_image_url}
              aspectRatio="4:5"
              style={styles.eventImage}
            />
          ) : (
            <Image 
              source={{ uri: data.cover_image_url || 'https://via.placeholder.com/300x400' }} 
              style={styles.eventImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>EVENT</Text>
          </View>
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {data.title}
          </Text>
          <View style={styles.eventMeta}>
            <Ionicons name="calendar-outline" size={12} color={PremiumColors.text.secondary} />
            <Text style={styles.eventMetaText}>{formatDate(data.event_date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Landscape Restaurant Card
  const RestaurantCard = ({ item }: { item: any }) => {
    const data = item.restaurants || item;
    
    return (
      <TouchableOpacity 
        style={styles.restaurantCard}
        onPress={() => router.push(`/restaurant/${data.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.restaurantImageContainer}>
          <Image 
            source={{ uri: data.cover_image_url || 'https://via.placeholder.com/400x200' }} 
            style={styles.restaurantImage}
            resizeMode="cover"
          />
          <View style={styles.restaurantBadge}>
            <Text style={styles.restaurantBadgeText}>RESTAURANT</Text>
          </View>
        </View>

        <View style={styles.restaurantContent}>
          <Text style={styles.restaurantTitle} numberOfLines={1}>
            {data.name}
          </Text>
          <View style={styles.restaurantMeta}>
            <View style={styles.restaurantMetaItem}>
              <Ionicons name="location-outline" size={12} color={PremiumColors.text.secondary} />
              <Text style={styles.restaurantMetaText} numberOfLines={1}>{data.city || data.address?.split(',')[0]}</Text>
            </View>
            {data.rating && (
              <View style={styles.restaurantMetaItem}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.restaurantRating}>{data.rating}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Artist/Expert Card (can keep similar to current or customize)
  const GenericCard = ({ item }: { item: any }) => {
    const getItemData = () => {
      if (item.artists) return { ...item.artists, type: 'artist' };
      if (item.experts) return { ...item.experts, type: 'expert' };
      return null;
    };

    const data = getItemData();
    if (!data) return null;

    const handlePress = () => {
      if (data.type === 'artist') {
        router.push(`/artist/${data.id}`);
      } else if (data.type === 'expert') {
        router.push(`/expert/${data.id}`);
      }
    };

    return (
      <TouchableOpacity 
        style={styles.genericCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.genericImageContainer}>
          <Image 
            source={{ uri: data.cover_image_url || data.profile_image_url || 'https://via.placeholder.com/400x200' }} 
            style={styles.genericImage}
            resizeMode="cover"
          />
          <View style={styles.genericBadge}>
            <Text style={styles.genericBadgeText}>{data.type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.genericContent}>
          <Text style={styles.genericTitle} numberOfLines={1}>
            {data.name}
          </Text>
          <View style={styles.genericMeta}>
            {data.type === 'artist' && data.genre && (
              <>
                <Ionicons name="musical-notes-outline" size={12} color={PremiumColors.text.secondary} />
                <Text style={styles.genericMetaText}>{data.genre}</Text>
              </>
            )}
            {data.type === 'expert' && data.tag && (
              <View style={styles.expertTagSmall}>
                <Text style={styles.expertTagSmallText}>{data.tag}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCard = (item: any) => {
    if (item.events || item.type === 'event') {
      return <EventCard item={item} />;
    } else if (item.restaurants || item.type === 'restaurant') {
      return <RestaurantCard item={item} />;
    } else {
      return <GenericCard item={item} />;
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="log-in-outline" size={64} color={PremiumColors.text.secondary} />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySubtitle}>Please login to view your favorites</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs - Only show buttons with items */}
      {favorites.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {/* Always show All if there are any favorites */}
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All ({categoryCounts.all})
            </Text>
          </TouchableOpacity>

          {/* Only show category buttons if they have items */}
          {categoryCounts.events > 0 && (
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'events' && styles.tabActive]}
              onPress={() => setSelectedTab('events')}
            >
              <Text style={[styles.tabText, selectedTab === 'events' && styles.tabTextActive]}>
                Events ({categoryCounts.events})
              </Text>
            </TouchableOpacity>
          )}

          {categoryCounts.restaurants > 0 && (
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'restaurants' && styles.tabActive]}
              onPress={() => setSelectedTab('restaurants')}
            >
              <Text style={[styles.tabText, selectedTab === 'restaurants' && styles.tabTextActive]}>
                Restaurants ({categoryCounts.restaurants})
              </Text>
            </TouchableOpacity>
          )}

          {categoryCounts.artists > 0 && (
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'artists' && styles.tabActive]}
              onPress={() => setSelectedTab('artists')}
            >
              <Text style={[styles.tabText, selectedTab === 'artists' && styles.tabTextActive]}>
                Artists ({categoryCounts.artists})
              </Text>
            </TouchableOpacity>
          )}

          {categoryCounts.experts > 0 && (
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'experts' && styles.tabActive]}
              onPress={() => setSelectedTab('experts')}
            >
              <Text style={[styles.tabText, selectedTab === 'experts' && styles.tabTextActive]}>
                Experts ({categoryCounts.experts})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        ) : filteredFavorites.length > 0 ? (
          <FadeInView>
            <View style={[
              styles.cardsContainer,
              selectedTab === 'events' && styles.cardsContainerGrid
            ]}>
              {filteredFavorites.map((item, index) => (
                <FadeInView key={item.id} delay={index * 50}>
                  {renderCard(item)}
                </FadeInView>
              ))}
            </View>
          </FadeInView>
        ) : (
          <FadeInView>
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color={PremiumColors.text.secondary} />
              <Text style={styles.emptyTitle}>No Favorites Yet</Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === 'all' 
                  ? 'Start adding your favorite events, restaurants, artists, and experts!' 
                  : `No ${selectedTab} in your favorites yet`}
              </Text>
            </View>
          </FadeInView>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: PremiumColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 48,
  },
  tabsContainer: {
    backgroundColor: PremiumColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabActive: {
    backgroundColor: PremiumColors.accent.secondary,
    borderColor: PremiumColors.accent.secondary,
    shadowColor: PremiumColors.accent.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
  },
  cardsContainerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  // Event Card Styles (Vertical - 3:4 ratio)
  eventCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  eventImageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: ((width - 48) / 2) * (4 / 3), // 3:4 aspect ratio
    backgroundColor: PremiumColors.background.tertiary,
  },
  eventBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  eventContent: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 6,
    lineHeight: 18,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 11,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },

  // Restaurant Card Styles (Landscape)
  restaurantCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PremiumColors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  restaurantImageContainer: {
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: 160,
    backgroundColor: PremiumColors.background.tertiary,
  },
  restaurantBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  restaurantBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  restaurantContent: {
    padding: 12,
  },
  restaurantTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 6,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  restaurantMetaText: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  restaurantRating: {
    fontSize: 12,
    color: PremiumColors.text.primary,
    fontWeight: '700',
  },

  // Generic Card Styles (Artists/Experts)
  genericCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PremiumColors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  genericImageContainer: {
    position: 'relative',
  },
  genericImage: {
    width: '100%',
    height: 160,
    backgroundColor: PremiumColors.background.tertiary,
  },
  genericBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genericBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  genericContent: {
    padding: 12,
  },
  genericTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 6,
  },
  genericMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genericMetaText: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  expertTagSmall: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expertTagSmallText: {
    fontSize: 10,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: PremiumColors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

