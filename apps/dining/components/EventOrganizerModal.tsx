import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getEventsByOrganizerId, getUserById } from '../config/supabase';
import { AppColors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

interface EventOrganizerModalProps {
  visible: boolean;
  organizerId: string;
  onClose: () => void;
}

const EventOrganizerModal: React.FC<EventOrganizerModalProps> = ({ 
  visible, 
  organizerId, 
  onClose 
}) => {
  const [organizer, setOrganizer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && organizerId) {
      loadOrganizerData();
    }
  }, [visible, organizerId]);

  const loadOrganizerData = async () => {
    try {
      setLoading(true);
      
      // Load organizer details and their events
      const [organizerResult, eventsResult] = await Promise.all([
        getUserById(organizerId),
        getEventsByOrganizerId(organizerId)
      ]);

      if (organizerResult.data) {
        setOrganizer(organizerResult.data);
      }

      if (eventsResult.data) {
        setEvents(eventsResult.data);
      }
    } catch (error) {
      console.error('Error loading organizer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTimeRange = (startTime: string, endTime?: string) => {
    const formatTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    if (endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
    return formatTime(startTime);
  };

  const getOngoingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.event_date >= today);
  };

  const getPreviousEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.event_date < today);
  };

  const getModalHeight = () => {
    const totalEvents = events.length;
    if (totalEvents <= 2) {
      return height * 0.4; // Smaller popup for few events
    } else if (totalEvents <= 4) {
      return height * 0.6; // Medium popup
    } else {
      return height * 0.8; // Large popup for many events
    }
  };

  const getVenueText = (item: any) => {
    if (item.event_venue?.venue_data) {
      try {
        const venueData = JSON.parse(item.event_venue.venue_data);
        return venueData.name || venueData.address || 'Venue TBA';
      } catch (e) {
        return 'Venue TBA';
      }
    }
    if (item.restaurants) {
      return item.restaurants.name || item.restaurants.address || 'Venue TBA';
    }
    return 'Venue TBA';
  };

  const renderEventCard = (item: any, isPrevious: boolean = false) => {
    return (
      <View key={item.id} style={[styles.eventCard, isPrevious && styles.previousEventCard]}>
        <View style={styles.eventImageContainer}>
          {item.cover_image_url ? (
            <Image 
              source={{ uri: item.cover_image_url }} 
              style={[styles.eventImage, isPrevious && styles.previousEventImage]}
            />
          ) : (
            <View style={[styles.eventImagePlaceholder, isPrevious && styles.previousEventImagePlaceholder]}>
              <Ionicons name="calendar-outline" size={20} color={isPrevious ? AppColors.gray[300] : AppColors.gray[400]} />
            </View>
          )}
        </View>
        
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, isPrevious && styles.previousEventTitle]} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaItem}>
              <Ionicons name="calendar-outline" size={12} color={isPrevious ? AppColors.gray[400] : AppColors.gray[500]} />
              <Text style={[styles.eventMetaText, isPrevious && styles.previousEventMetaText]}>
                {formatDate(item.event_date)}
              </Text>
            </View>
            
            <View style={styles.eventMetaItem}>
              <Ionicons name="time-outline" size={12} color={isPrevious ? AppColors.gray[400] : AppColors.gray[500]} />
              <Text style={[styles.eventMetaText, isPrevious && styles.previousEventMetaText]}>
                {formatTimeRange(item.start_time, item.end_time)}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.eventLocation, isPrevious && styles.previousEventLocation]} numberOfLines={1}>
            {getVenueText(item)}
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    const ongoingEvents = getOngoingEvents();
    const previousEvents = getPreviousEvents();

    return (
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Ongoing Events Section */}
        {ongoingEvents.length > 0 && (
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ONGOING EVENTS</Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.eventsContainer}>
              {ongoingEvents.map((event) => renderEventCard(event, false))}
            </View>
          </View>
        )}
        
        {/* Previous Events Section */}
        {previousEvents.length > 0 && (
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PREVIOUS EVENTS</Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.eventsContainer}>
              {previousEvents.map((event) => renderEventCard(event, true))}
            </View>
          </View>
        )}
        
        {/* Empty State */}
        {ongoingEvents.length === 0 && previousEvents.length === 0 && !loading && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons 
                name="calendar-outline" 
                size={48} 
                color={AppColors.gray[300]} 
              />
            </View>
            <Text style={styles.emptyStateTitle}>No Events Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              This organizer hasn't created any events yet.
            </Text>
          </View>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdropTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={[styles.modalContainer, { height: getModalHeight() }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.dragIndicator} />
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>About Organiser</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={AppColors.gray[600]} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Organizer Profile */}
          {organizer && !loading && (
            <View style={styles.organizerSection}>
              <View style={styles.organizerProfile}>
                <View style={styles.avatarContainer}>
                  {organizer.profile_image_url ? (
                    <Image 
                      source={{ uri: organizer.profile_image_url }} 
                      style={styles.organizerAvatar}
                    />
                  ) : (
                    <View style={styles.organizerAvatarPlaceholder}>
                      <Ionicons name="person" size={32} color={AppColors.white} />
                    </View>
                  )}
                </View>
                
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>
                    {organizer.full_name || organizer.name || 'Event Organizer'}
                  </Text>
                  <View style={styles.organizerStats}>
                    <View style={styles.eventCountChip}>
                      <Ionicons name="calendar-outline" size={12} color={AppColors.primary} />
                      <Text style={styles.eventCountText}>
                        {events.length} event{events.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
          
          {/* Events Content */}
          <View style={styles.contentContainer}>
            {renderContent()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: AppColors.gray[50],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    shadowColor: AppColors.black,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },

  // Modal Header
  modalHeader: {
    paddingTop: 12,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: AppColors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.black,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Organizer Section
  organizerSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  organizerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  organizerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: AppColors.gray[200],
  },
  organizerAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.white,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.black,
    marginBottom: 6,
    lineHeight: 24,
  },
  organizerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  eventCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },

  // Content Container
  contentContainer: {
    flex: 1,
    backgroundColor: AppColors.gray[50],
  },
  scrollView: {
    flex: 1,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.gray[500],
  },

  // Events Sections
  eventsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.black,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: AppColors.primary,
    width: 32,
    borderRadius: 1,
  },

  // Events Container
  eventsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },

  // Event Cards
  eventCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    borderRadius: 12,
    shadowColor: AppColors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  eventImageContainer: {
    width: 80,
    height: 80,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: AppColors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.black,
    marginBottom: 4,
    lineHeight: 18,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 11,
    color: AppColors.gray[600],
    fontWeight: '500',
  },
  eventLocation: {
    fontSize: 11,
    color: AppColors.gray[500],
    fontStyle: 'italic',
  },

  // Previous Event Styles
  previousEventCard: {
    opacity: 0.6,
  },
  previousEventImage: {
    opacity: 0.7,
  },
  previousEventImagePlaceholder: {
    backgroundColor: AppColors.gray[200],
  },
  previousEventTitle: {
    color: AppColors.gray[500],
  },
  previousEventMetaText: {
    color: AppColors.gray[400],
  },
  previousEventLocation: {
    color: AppColors.gray[400],
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.gray[700],
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: AppColors.gray[500],
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 200,
  },

  // Bottom Spacing
  bottomSpacer: {
    height: 20,
  },
});

export default EventOrganizerModal;