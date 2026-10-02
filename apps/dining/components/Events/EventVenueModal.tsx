import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

interface VenueData {
  name?: string;
  address?: string;
  contact?: {
    email?: string;
    phone?: string;
    latitude?: string;
    longitude?: string;
  };
  google_maps_place_id?: string;
}

interface EventVenueModalProps {
  visible: boolean;
  venueData: VenueData;
  distance?: number;
  onClose: () => void;
}

export const EventVenueModal: React.FC<EventVenueModalProps> = ({
  visible,
  venueData,
  distance,
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

  const handleGetDirections = async () => {
    if (!venueData) return;
    
    let mapUrl = '';
    let deepLinkUrl = '';
    
    const venueLat = venueData.contact?.latitude;
    const venueLng = venueData.contact?.longitude;
    
    if (venueData.google_maps_place_id) {
      const venueName = encodeURIComponent(venueData.name || 'Venue');
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${venueName}&query_place_id=${venueData.google_maps_place_id}`;
      deepLinkUrl = `comgooglemaps://?q=${venueName}&query_place_id=${venueData.google_maps_place_id}`;
    } else if (venueLat && venueLng) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${venueLat},${venueLng}`;
      deepLinkUrl = `comgooglemaps://?center=${venueLat},${venueLng}&q=${venueLat},${venueLng}`;
    } else if (venueData.address) {
      const encodedAddress = encodeURIComponent(venueData.address);
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      deepLinkUrl = `comgooglemaps://?q=${encodedAddress}`;
    }
    
    try {
      const canOpen = await Linking.canOpenURL(deepLinkUrl);
      if (canOpen) {
        await Linking.openURL(deepLinkUrl);
      } else {
        await Linking.openURL(mapUrl);
      }
    } catch (error) {
      Linking.openURL(mapUrl).catch((err) => 
        console.error('Error opening maps:', err)
      );
    }
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
            {/* Venue Name & Distance */}
            <View style={styles.headerSection}>
              <Text style={styles.venueName}>{venueData.name || 'Venue'}</Text>
              {distance !== undefined && distance > 0 && (
                <View style={styles.distanceChip}>
                  <Ionicons name="navigate" size={14} color={PremiumColors.text.secondary} />
                  <Text style={styles.distanceText}>
                    {distance < 1 
                      ? `${(distance * 1000).toFixed(0)}m` 
                      : `${distance.toFixed(1)}km`}
                  </Text>
                </View>
              )}
            </View>

            {/* Address */}
            {venueData.address && (
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={18} color={PremiumColors.text.tertiary} />
                <Text style={styles.addressText}>{venueData.address}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {/* Call Button (if phone available) */}
              {venueData.contact?.phone && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.callButton]}
                  onPress={() => {
                    const phoneNumber = venueData.contact?.phone?.replace(/[^0-9+]/g, '');
                    if (phoneNumber) {
                      Linking.openURL(`tel:${phoneNumber}`);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={18} color={PremiumColors.accent.primary} />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              )}

              {/* Get Directions Button */}
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  styles.directionsButton,
                  !venueData.contact?.phone && styles.fullWidthButton
                ]}
                onPress={handleGetDirections}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerSection: {
    marginBottom: 16,
  },
  venueName: {
    fontSize: 22,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 8,
    lineHeight: 28,
  },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  callButton: {
    backgroundColor: '#ffffff',
  },
  directionsButton: {
    backgroundColor: PremiumColors.accent.primary,
  },
  fullWidthButton: {
    flex: 1,
  },
  callButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.accent.primary,
  },
  directionsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

