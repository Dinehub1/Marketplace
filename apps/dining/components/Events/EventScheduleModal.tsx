import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

const { height } = Dimensions.get('window');

interface EventScheduleModalProps {
  visible: boolean;
  eventDate: string;
  eventEndDate?: string;
  startTime?: string;
  endTime?: string;
  gateOpenTime?: string;
  eventType?: string;
  onClose: () => void;
}

export const EventScheduleModal: React.FC<EventScheduleModalProps> = ({
  visible,
  eventDate,
  eventEndDate,
  startTime,
  endTime,
  gateOpenTime,
  eventType,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'TBD';
    
    if (timeString.includes(':') && !timeString.includes('AM') && !timeString.includes('PM')) {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    }
    
    return timeString;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = () => {
    if (eventType === 'multi_day' && eventEndDate) {
      return `${formatDate(eventDate)} - ${formatDate(eventEndDate)}`;
    }
    return formatDate(eventDate);
  };

  const modalTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={onClose}
          />
        </Animated.View>

        {/* Bottom Sheet Content */}
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: modalTranslateY }]
            }
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={PremiumColors.text.primary} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="time" size={32} color={PremiumColors.accent.secondary} />
              </View>
              <Text style={styles.title}>Schedule & Timeline</Text>
            </View>

            {/* Event Date */}
            <View style={styles.dateSection}>
              <View style={styles.dateLabelContainer}>
                <Ionicons name="calendar" size={20} color={PremiumColors.accent.secondary} />
                <Text style={styles.dateLabel}>Event Date</Text>
              </View>
              <Text style={styles.dateText}>{formatDateRange()}</Text>
            </View>

            {/* Timeline */}
            <View style={styles.timelineContainer}>
              {/* Gate Opens */}
              {gateOpenTime && (
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Ionicons name="lock-open" size={22} color={PremiumColors.text.primary} />
                      <Text style={styles.timelineTitle}>Gates Open</Text>
                    </View>
                    <Text style={styles.timelineTime}>{formatTime(gateOpenTime)}</Text>
                  </View>
                </View>
              )}

              {/* Show Start */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={styles.timelineDot} />
                  {endTime && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Ionicons name="play-circle" size={22} color={PremiumColors.accent.secondary} />
                    <Text style={[styles.timelineTitle, styles.activeTimelineTitle]}>Show Starts</Text>
                  </View>
                  <Text style={styles.timelineTime}>{formatTime(startTime)}</Text>
                </View>
              </View>

              {/* Show End */}
              {endTime && (
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <View style={styles.timelineDot} />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Ionicons name="stop-circle" size={22} color={PremiumColors.text.primary} />
                      <Text style={styles.timelineTitle}>Show Ends</Text>
                    </View>
                    <Text style={styles.timelineTime}>{formatTime(endTime)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: PremiumColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: PremiumColors.text.muted,
    borderRadius: 2,
    opacity: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PremiumColors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    textAlign: 'center',
  },
  dateSection: {
    backgroundColor: PremiumColors.background.secondary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  dateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    lineHeight: 22,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PremiumColors.accent.secondary,
    borderWidth: 3,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: PremiumColors.border,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
    paddingTop: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  activeTimelineTitle: {
    color: PremiumColors.accent.secondary,
    fontWeight: '700',
  },
  timelineTime: {
    fontSize: 15,
    color: PremiumColors.text.secondary,
    marginLeft: 32,
    fontWeight: '500',
  },
});

