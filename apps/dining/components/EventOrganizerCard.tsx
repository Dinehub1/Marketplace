import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getOrganizerEventCount, getUserById } from '../config/supabase';
import { AppColors, PremiumColors } from '../constants/Colors';

interface EventOrganizerCardProps {
  organizerId: string;
  onPress: () => void;
}

const EventOrganizerCard: React.FC<EventOrganizerCardProps> = ({ organizerId, onPress }) => {
  const [organizer, setOrganizer] = useState<any>(null);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizerData();
  }, [organizerId]);

  const loadOrganizerData = async () => {
    try {
      setLoading(true);
      
      // Load organizer details and event count in parallel
      const [organizerResult, countResult] = await Promise.all([
        getUserById(organizerId),
        getOrganizerEventCount(organizerId)
      ]);

      if (organizerResult.data) {
        setOrganizer(organizerResult.data);
      }

      if (countResult.count !== undefined) {
        setEventCount(countResult.count);
      }
    } catch (error) {
      console.error('Error loading organizer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !organizer) {
    return (
      <View style={styles.loadingCard}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingAvatar} />
          <View style={styles.loadingTextContainer}>
            <View style={styles.loadingText} />
            <View style={styles.loadingSubtext} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ORGANISED BY</Text>
      
      <TouchableOpacity 
        style={styles.organizerCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.organizerContent}>
          <View style={styles.avatarContainer}>
            {organizer.profile_image_url ? (
              <Image 
                source={{ uri: organizer.profile_image_url }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={AppColors.white} />
              </View>
            )}
          </View>
          
          <View style={styles.organizerInfo}>
            <Text style={styles.organizerName} numberOfLines={1}>
              {organizer.full_name || organizer.name || 'Event Organizer'}
            </Text>
            <View style={styles.eventCountContainer}>
              <Text style={styles.eventCountText}>
                {eventCount} event{eventCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color={PremiumColors.text.tertiary} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PremiumColors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  organizerCard: {
    backgroundColor: PremiumColors.background.glass,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    overflow: 'hidden',
  },
  organizerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: PremiumColors.accent.secondary,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PremiumColors.accent.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PremiumColors.accent.secondary,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 6,
  },
  eventCountContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  eventCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  
  // Loading states
  loadingCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  loadingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PremiumColors.background.tertiary,
    marginRight: 12,
  },
  loadingTextContainer: {
    flex: 1,
  },
  loadingText: {
    height: 16,
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 8,
    marginBottom: 8,
    width: '60%',
  },
  loadingSubtext: {
    height: 12,
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 6,
    width: '40%',
  },
});

export default EventOrganizerCard;
