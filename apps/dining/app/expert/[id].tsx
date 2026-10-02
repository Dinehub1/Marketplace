import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getExpertById, getExpertRecommendations } from '../../config/supabase';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

// App Colors
const AppColors = {
  primary: '#FF6B35',
  secondary: '#004E89',
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

interface Expert {
  id: string;
  name: string;
  description: string;
  tag: string;
  city: string;
  cover_image_url: string;
  is_verified: boolean;
  social_links: any;
}

interface Recommendation {
  id: string;
  title: string;
  sub_title: string;
  description: string;
  cover_image_url: string;
  scope: string[];
  restaurant_id: string | null;
  event_id: string | null;
  city: string;
}

export default function ExpertProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpertData();
  }, [id]);

  const fetchExpertData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch expert details
      const { data: expertData, error: expertError } = await getExpertById(id as string);
      if (expertError) throw expertError;
      setExpert(expertData);

      // Fetch expert recommendations
      const { data: recsData, error: recsError } = await getExpertRecommendations(id as string);
      if (recsError) throw recsError;
      setRecommendations(recsData || []);
    } catch (err: any) {
      console.error('Error fetching expert data:', err);
      setError(err.message || 'Failed to load expert data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationPress = (recommendation: Recommendation) => {
    // Redirect based on scope
    if (recommendation.event_id && recommendation.scope.includes('event')) {
      router.push(`/events/${recommendation.event_id}`);
    } else if (recommendation.restaurant_id) {
      router.push(`/restaurant/${recommendation.restaurant_id}`);
    }
  };

  const filterByScope = (scope: string) => {
    return recommendations.filter((rec) => rec.scope.includes(scope));
  };

  const topRecommendations = filterByScope('recommendation');
  const mustTryDishes = filterByScope('must_try');
  const nostalgiaList = filterByScope('nostalgia');
  const myEvents = filterByScope('event');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading expert profile...</Text>
      </View>
    );
  }

  if (error || !expert) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={AppColors.error} />
        <Text style={styles.errorText}>{error || 'Expert not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpertData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={AppColors.black} />
          </TouchableOpacity>
        </View>

        {/* Square Cover Image */}
        <View style={styles.coverImageContainer}>
          <Image 
            source={{ uri: expert.cover_image_url }} 
            style={styles.coverImage}
          />
          {expert.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={AppColors.primary} />
            </View>
          )}
        </View>

        {/* Expert Info */}
        <View style={styles.expertInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.expertName}>{expert.name}</Text>
            {expert.tag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{expert.tag}</Text>
              </View>
            )}
          </View>
          
          {expert.city && (
            <View style={styles.cityContainer}>
              <Ionicons name="location" size={16} color={AppColors.gray[600]} />
              <Text style={styles.cityText}>{expert.city}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {expert.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{expert.description}</Text>
          </View>
        )}

        {/* Top Recommendations Section */}
        {topRecommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color={AppColors.primary} />
              <Text style={styles.sectionTitle}>Top Recommendations</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsContainer}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {topRecommendations.map((rec) => (
                <RecommendationCard 
                  key={rec.id} 
                  recommendation={rec} 
                  onPress={() => handleRecommendationPress(rec)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Must Try Dishes Section */}
        {mustTryDishes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="restaurant" size={24} color={AppColors.primary} />
              <Text style={styles.sectionTitle}>Dishes Must Try</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsContainer}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {mustTryDishes.map((rec) => (
                <RecommendationCard 
                  key={rec.id} 
                  recommendation={rec} 
                  onPress={() => handleRecommendationPress(rec)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Nostalgia List Section */}
        {nostalgiaList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={24} color={AppColors.primary} />
              <Text style={styles.sectionTitle}>My Nostalgia List</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsContainer}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {nostalgiaList.map((rec) => (
                <RecommendationCard 
                  key={rec.id} 
                  recommendation={rec} 
                  onPress={() => handleRecommendationPress(rec)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* My Events Section */}
        {myEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={24} color={AppColors.primary} />
              <Text style={styles.sectionTitle}>My Events</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsContainer}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {myEvents.map((rec) => (
                <RecommendationCard 
                  key={rec.id} 
                  recommendation={rec} 
                  onPress={() => handleRecommendationPress(rec)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty State */}
        {topRecommendations.length === 0 && 
         mustTryDishes.length === 0 && 
         nostalgiaList.length === 0 && 
         myEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={AppColors.gray[400]} />
            <Text style={styles.emptyStateText}>No recommendations yet</Text>
            <Text style={styles.emptyStateSubtext}>Check back soon for expert picks!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Recommendation Card Component
function RecommendationCard({ recommendation, onPress }: { recommendation: Recommendation; onPress: () => void }) {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        <Image 
          source={{ 
            uri: recommendation.cover_image_url || 
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'
          }} 
          style={styles.cardImage}
        />
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {recommendation.title}
        </Text>
        
        {recommendation.sub_title && (
          <View style={styles.subTitleContainer}>
            <Ionicons name="location" size={14} color={AppColors.primary} />
            <Text style={styles.cardSubTitle} numberOfLines={1}>
              {recommendation.sub_title}
            </Text>
          </View>
        )}
        
        {recommendation.description && (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {recommendation.description}
          </Text>
        )}

        {recommendation.city && (
          <View style={styles.cardFooter}>
            <View style={styles.cityBadge}>
              <Ionicons name="pin" size={12} color={AppColors.gray[600]} />
              <Text style={styles.cityBadgeText}>{recommendation.city}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.gray[700],
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageContainer: {
    width: width,
    height: width,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: AppColors.white,
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  expertInfo: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  expertName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.black,
    marginRight: 12,
  },
  tagBadge: {
    backgroundColor: AppColors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityText: {
    fontSize: 16,
    color: AppColors.gray[600],
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.gray[700],
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.black,
  },
  cardsContainer: {
    paddingLeft: 20,
    paddingRight: 4,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: 16,
    backgroundColor: AppColors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.black,
    marginBottom: 8,
    lineHeight: 26,
  },
  subTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
    flex: 1,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.gray[600],
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  cityBadgeText: {
    fontSize: 13,
    color: AppColors.gray[600],
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.gray[700],
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: AppColors.gray[500],
    textAlign: 'center',
  },
});
