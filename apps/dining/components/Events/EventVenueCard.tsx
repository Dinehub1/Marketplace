import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

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

interface EventVenueCardProps {
  venueData: VenueData;
  distance?: number;
  onPress: () => void;
}

export const EventVenueCard: React.FC<EventVenueCardProps> = ({
  venueData,
  distance,
  onPress,
}) => {
  const handleGetDirections = async (e: any) => {
    e.stopPropagation();
    
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

  return (
    <TouchableOpacity 
      style={styles.venueCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Icon Section */}
      <View style={styles.iconContainer}>
        <Ionicons 
          name="location-sharp" 
          size={20} 
          color={PremiumColors.text.primary} 
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Venue Name - Prominent */}
        <Text style={styles.venueName} numberOfLines={1}>
          {venueData.name || 'Event Venue'}
        </Text>

        {/* Address - Subtle with ellipsis */}
        {venueData.address && (
          <Text style={styles.addressText} numberOfLines={1}>
            {venueData.address}
          </Text>
        )}

        {/* Distance */}
        {distance !== undefined && distance > 0 && (
          <Text style={styles.distanceText}>
            {distance < 1 
              ? `${(distance * 1000).toFixed(0)}m away` 
              : `${distance.toFixed(1)}km away`}
          </Text>
        )}
      </View>

      {/* Get Directions Button */}
      <TouchableOpacity 
        style={styles.directionsButton}
        onPress={handleGetDirections}
        activeOpacity={0.7}
      >
        <Ionicons name="navigate" size={14} color={PremiumColors.text.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  addressText: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
    lineHeight: 18,
    marginBottom: 3,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PremiumColors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  directionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
});

