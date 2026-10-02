import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

interface Partner {
  id: string;
  name: string;
  logo_url?: string;
  partner_type?: string;
  website_url?: string;
  display_order: number;
}

interface EventPartnersProps {
  partners: Partner[];
}

export const EventPartners: React.FC<EventPartnersProps> = ({ partners }) => {
  if (!partners || partners.length === 0) {
    return null;
  }

  const handlePartnerPress = (partner: Partner) => {
    if (partner.website_url) {
      console.log('Opening partner website:', partner.website_url);
      // Future: Add Linking.openURL(partner.website_url) if needed
    }
  };

  return (
    <View style={styles.partnersSection}>
      <Text style={styles.sectionTitle}>Event Partners</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >
        {partners
          .sort((a, b) => a.display_order - b.display_order)
          .map((partner) => (
          <TouchableOpacity 
            key={partner.id} 
            style={styles.partnerCard}
            onPress={() => handlePartnerPress(partner)}
            activeOpacity={0.8}
          >
            <View style={styles.partnerImageContainer}>
              <Image 
                source={{ 
                  uri: partner.logo_url || 
                  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop' 
                }} 
                style={styles.partnerImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.partnerName} numberOfLines={2}>
              {partner.name}
            </Text>
            {partner.partner_type && (
              <Text style={styles.partnerType} numberOfLines={1}>
                {partner.partner_type.replace('_', ' ').toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  partnersSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: PremiumColors.background.primary,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.secondary,
    marginBottom: 10,
  },
  horizontalScrollContainer: {
    paddingHorizontal: 4,
  },
  partnerCard: {
    width: 150,
    marginRight: 16,
    alignItems: 'center',
  },
  partnerImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.secondary,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'rgba(33, 33, 33, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  partnerImage: {
    width: '100%',
    height: '100%',
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 2,
  },
  partnerType: {
    fontSize: 10,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
});

