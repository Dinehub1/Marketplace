import { router } from 'expo-router';
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

interface Artist {
  id: string;
  artist_id?: string;
  display_order: number;
  role?: string;
  artists?: {
    id: string;
    name: string;
    profile_image_url?: string;
    genre?: string;
  };
}

interface EventArtistsProps {
  artists: Artist[];
}

export const EventArtists: React.FC<EventArtistsProps> = ({ artists }) => {
  if (!artists || artists.length === 0) {
    return null;
  }

  const handleArtistPress = (eventArtist: Artist) => {
    const artistId = eventArtist.artist_id || eventArtist.artists?.id;
    if (artistId) {
      console.log('Navigating to artist profile:', artistId);
      router.push(`/artist/${artistId}`);
    } else {
      console.warn('No artist ID found for:', eventArtist);
    }
  };

  return (
    <View style={styles.artistsSection}>
      <Text style={styles.sectionTitle}>Event Artists</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >
        {artists
          .sort((a, b) => a.display_order - b.display_order)
          .map((eventArtist) => (
          <TouchableOpacity 
            key={eventArtist.id} 
            style={styles.artistCard}
            onPress={() => handleArtistPress(eventArtist)}
            activeOpacity={0.8}
          >
            <View style={styles.artistImageContainer}>
              <Image 
                source={{ 
                  uri: eventArtist.artists?.profile_image_url || 
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face' 
                }} 
                style={styles.artistImage}
              />
            </View>
            <Text style={styles.artistName} numberOfLines={2}>
              {eventArtist.artists?.name || 'Unknown Artist'}
            </Text>
            {eventArtist.role && (
              <Text style={styles.artistRole} numberOfLines={1}>
                {eventArtist.role}
              </Text>
            )}
            {eventArtist.artists?.genre && (
              <Text style={styles.artistGenre} numberOfLines={1}>
                {eventArtist.artists.genre}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  artistsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: PremiumColors.background.primary,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 16,
  },
  horizontalScrollContainer: {
    paddingHorizontal: 4,
  },
  artistCard: {
    width: 200,
    marginRight: 16,
    alignItems: 'center',
  },
  artistImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.secondary,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 3,
    borderColor: 'rgb(45, 45, 45)',
  },
  artistImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  artistName: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  artistRole: {
    fontSize: 12,
    color: PremiumColors.accent.secondary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 2,
  },
  artistGenre: {
    fontSize: 10,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

