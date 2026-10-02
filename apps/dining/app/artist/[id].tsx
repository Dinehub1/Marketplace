import { Ionicons } from '@expo/vector-icons';

let Audio: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Audio = require('expo-av').Audio;
} catch {
  // expo-av native module not available in current environment (e.g. Expo Go)
}

const Slider: React.FC<any> = ({ value = 0, maximumValue = 1, style }) => {
  const pct = maximumValue > 0 ? Math.min(100, Math.max(0, (value / maximumValue) * 100)) : 0;
  return (
    <View style={[{ height: 4, backgroundColor: '#444', borderRadius: 2, flex: 1, marginHorizontal: 8 }, style]}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#FF6B35', borderRadius: 2 }} />
    </View>
  );
};
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../config/supabase';
import {
  formatDuration,
  formatFollowerCount,
  getArtistTopTracks,
  getSpotifyArtist,
  SpotifyArtist,
  SpotifyTrack,
} from '../../utils/spotifyService';

const { width, height } = Dimensions.get('window');

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

interface Artist {
  id: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  social_links: any;
  genre: string | null;
  spotify_id: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

interface ArtistEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  cover_image_url: string | null;
  event_type: string;
  ticket_type: string;
  is_active: boolean;
  restaurants: {
    name: string;
    address: string;
  } | null;
  event_venue: Array<{
    venue_data: any;
  }>;
}

export default function ArtistProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [spotifyData, setSpotifyData] = useState<SpotifyArtist | null>(null);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [allTracks, setAllTracks] = useState<SpotifyTrack[]>([]);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [artistEvents, setArtistEvents] = useState<ArtistEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const soundRef = useRef<any>(null);
  const playbackUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchArtistData();
    setupAudio();
    
    return () => {
      cleanupAudio();
    };
  }, [id]);

  const setupAudio = async () => {
    if (!Audio?.setAudioModeAsync) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const cleanupAudio = async () => {
    if (playbackUpdateInterval.current) {
      clearInterval(playbackUpdateInterval.current);
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.error('Error cleaning up audio:', error);
      }
    }
  };

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch artist from database
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (artistError) throw artistError;
      setArtist(artistData);

      // Fetch Spotify data if spotify_id exists
      if (artistData.spotify_id) {
        const spotifyArtist = await getSpotifyArtist(artistData.spotify_id);
        setSpotifyData(spotifyArtist);

        const tracks = await getArtistTopTracks(artistData.spotify_id);
        setAllTracks(tracks); // Store all tracks
        setTopTracks(tracks.slice(0, 5)); // Show top 5 initially
      }

      // Fetch artist's events
      const { data: eventsData, error: eventsError } = await supabase
        .from('event_artists')
        .select(`
          event_id,
          events (
            id,
            title,
            event_date,
            start_time,
            cover_image_url,
            event_type,
            ticket_type,
            is_active,
            restaurants (
              name,
              address
            ),
            event_venue (
              venue_data
            )
          )
        `)
        .eq('artist_id', id)
        .order('events(event_date)', { ascending: true });

      if (!eventsError && eventsData) {
        const formattedEvents = eventsData
          .map((item: any) => item.events)
          .filter((event: any) => event !== null);
        setArtistEvents(formattedEvents);
      }
    } catch (err: any) {
      console.error('Error fetching artist data:', err);
      setError(err.message || 'Failed to load artist data');
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = (event: ArtistEvent) => {
    const isPastEvent = new Date(event.event_date) < new Date();
    if (!isPastEvent && event.is_active) {
      if (event.ticket_type === 'free') {
        router.push(`/booking/free/${event.id}`);
      } else {
        router.push(`/events/${event.id}`);
      }
    }
  };

  const handleSocialLink = (platform: string, socialData: any) => {
    // Handle both old format (direct URL string) and new format (object with url property)
    const url = typeof socialData === 'string' ? socialData : socialData?.url;
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleLoadMoreTracks = () => {
    setTopTracks(allTracks.slice(0, 10)); // Show top 10 tracks
    setShowAllTracks(true);
  };

  const handlePlayTrack = async (track: SpotifyTrack) => {
    try {
      // If same track is playing, toggle play/pause
      if (currentTrack?.id === track.id && soundRef.current) {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // Stop current track if playing
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        if (playbackUpdateInterval.current) {
          clearInterval(playbackUpdateInterval.current);
        }
      }

      // Try to load and play track preview
      if (track.preview_url && Audio?.Sound) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: track.preview_url },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );

          soundRef.current = sound;
          setCurrentTrack(track);
          setIsPlaying(true);

          // Start position update interval
          playbackUpdateInterval.current = setInterval(async () => {
            if (soundRef.current) {
              const status = await soundRef.current.getStatusAsync();
              if (status.isLoaded) {
                setPlaybackPosition(status.positionMillis);
                setPlaybackDuration(status.durationMillis || 0);
              }
            }
          }, 100);
        } catch (audioError) {
          console.error('Error loading audio preview:', audioError);
          // If preview fails, open in Spotify
          Linking.openURL(track.external_urls.spotify);
        }
      } else {
        // No preview available, open in Spotify
        console.log('No preview available for this track, opening in Spotify');
        Linking.openURL(track.external_urls.spotify);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      // Fallback to opening in Spotify
      Linking.openURL(track.external_urls.spotify);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
        if (playbackUpdateInterval.current) {
          clearInterval(playbackUpdateInterval.current);
        }
      }
    }
  };

  const handleSeek = async (value: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(value);
        setPlaybackPosition(value);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  const handleTogglePlayback = async () => {
    if (soundRef.current && currentTrack) {
      try {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    }
  };

  const isPastEvent = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading artist profile...</Text>
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={AppColors.error} />
        <Text style={styles.errorText}>{error || 'Artist not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchArtistData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileImage = spotifyData?.images[0]?.url || artist.profile_image_url || 
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800';

  const genres = spotifyData?.genres || (artist.genre ? [artist.genre] : []);
  const followerCount = spotifyData?.followers.total || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Profile Image */}
        <View style={styles.header}>
          <Image source={{ uri: profileImage }} style={styles.headerImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
            style={styles.headerGradient}
          />
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={AppColors.white} />
          </TouchableOpacity>

          {/* Artist Info Overlay */}
          <View style={styles.headerInfo}>
            <Text style={styles.artistName}>{artist.name}</Text>
            {genres.length > 0 && (
              <View style={styles.genresContainer}>
                {genres.slice(0, 3).map((genre, index) => (
                  <View key={index} style={styles.genreChip}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            )}
            {followerCount > 0 && (
              <View style={styles.followersContainer}>
                <Ionicons name="people" size={16} color={AppColors.white} />
                <Text style={styles.followersText}>
                  {formatFollowerCount(followerCount)} followers
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bio Section */}
        {artist.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{artist.bio}</Text>
          </View>
        )}

        {/* Top Tracks Section */}
        {topTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Tracks</Text>
            <View style={styles.tracksContainer}>
              {topTracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                
                return (
                  <TouchableOpacity
                    key={track.id}
                    style={[
                      styles.trackCard,
                      isCurrentTrack && styles.trackCardActive,
                    ]}
                    onPress={() => handlePlayTrack(track)}
                  >
                    <View style={styles.trackLeft}>
                      <Text style={[
                        styles.trackNumber,
                        isCurrentTrack && styles.trackNumberActive,
                      ]}>
                        {index + 1}
                      </Text>
                      <Image 
                        source={{ uri: track.album.images[0]?.url }} 
                        style={styles.trackImage}
                      />
                      <View style={styles.trackInfo}>
                        <Text 
                          style={[
                            styles.trackName,
                            isCurrentTrack && styles.trackNameActive,
                          ]} 
                          numberOfLines={1}
                        >
                          {track.name}
                        </Text>
                        <Text style={styles.trackAlbum} numberOfLines={1}>
                          {track.album.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.trackRight}>
                      {!isCurrentTrack && (
                        <Text style={styles.trackDuration}>
                          {formatDuration(track.duration_ms)}
                        </Text>
                      )}
                      <Ionicons 
                        name={isCurrentTrack && isPlaying ? "pause-circle" : "play-circle"} 
                        size={32} 
                        color={isCurrentTrack ? AppColors.primary : AppColors.gray[600]} 
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* See More Button */}
            {!showAllTracks && allTracks.length > 5 && (
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={handleLoadMoreTracks}
              >
                <Text style={styles.seeMoreButtonText}>
                  See More Tracks ({allTracks.length - 5} more)
                </Text>
                <Ionicons name="chevron-down" size={20} color={AppColors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Music Player */}
        {currentTrack && (
          <View style={styles.musicPlayerContainer}>
            <View style={styles.musicPlayer}>
              <Image 
                source={{ uri: currentTrack.album.images[0]?.url }} 
                style={styles.playerAlbumArt}
              />
              <View style={styles.playerInfo}>
                <Text style={styles.playerTrackName} numberOfLines={1}>
                  {currentTrack.name}
                </Text>
                <Text style={styles.playerArtistName} numberOfLines={1}>
                  {currentTrack.artists[0]?.name}
                </Text>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <Text style={styles.progressTime}>
                    {formatDuration(playbackPosition)}
                  </Text>
                  <Slider
                    style={styles.progressSlider}
                    value={playbackPosition}
                    minimumValue={0}
                    maximumValue={playbackDuration}
                    onValueChange={handleSeek}
                    minimumTrackTintColor={AppColors.primary}
                    maximumTrackTintColor={AppColors.gray[300]}
                    thumbTintColor={AppColors.primary}
                  />
                  <Text style={styles.progressTime}>
                    {formatDuration(playbackDuration)}
                  </Text>
                </View>
              </View>
              
              {/* Playback Controls */}
              <TouchableOpacity 
                style={styles.playbackButton}
                onPress={handleTogglePlayback}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color={AppColors.white} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Social Links - Moved after tracks */}
        {artist.social_links && Object.keys(artist.social_links).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect</Text>
            <View style={styles.socialLinksContainer}>
              {/* Instagram Button */}
              {(artist.social_links.instagram || artist.social_links.Instagram) && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.instagramButton]}
                  onPress={() => handleSocialLink('instagram', artist.social_links.instagram || artist.social_links.Instagram)}
                >
                  <Ionicons name="logo-instagram" size={20} color={AppColors.white} />
                  <Text style={styles.socialButtonText}>Instagram</Text>
                </TouchableOpacity>
              )}
              
              {/* YouTube Button */}
              {(artist.social_links.youtube || artist.social_links.Youtube || artist.social_links.YouTube) && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.youtubeButton]}
                  onPress={() => handleSocialLink('youtube', artist.social_links.youtube || artist.social_links.Youtube || artist.social_links.YouTube)}
                >
                  <Ionicons name="logo-youtube" size={20} color={AppColors.white} />
                  <Text style={styles.socialButtonText}>YouTube</Text>
                </TouchableOpacity>
              )}
              
              {/* Facebook Button */}
              {(artist.social_links.facebook || artist.social_links.Facebook) && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={() => handleSocialLink('facebook', artist.social_links.facebook || artist.social_links.Facebook)}
                >
                  <Ionicons name="logo-facebook" size={20} color={AppColors.white} />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
              )}
              
              {/* Twitter Button */}
              {(artist.social_links.twitter || artist.social_links.Twitter) && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.twitterButton]}
                  onPress={() => handleSocialLink('twitter', artist.social_links.twitter || artist.social_links.Twitter)}
                >
                  <Ionicons name="logo-twitter" size={20} color={AppColors.white} />
                  <Text style={styles.socialButtonText}>Twitter</Text>
                </TouchableOpacity>
              )}
              
              {/* Spotify Button */}
              {spotifyData?.external_urls.spotify && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.spotifyButton]}
                  onPress={() => handleSocialLink('spotify', spotifyData.external_urls.spotify)}
                >
                  <Ionicons name="musical-notes" size={20} color={AppColors.white} />
                  <Text style={styles.socialButtonText}>Spotify</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Events Section */}
        {artistEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Events</Text>
            <View style={styles.eventsContainer}>
              {artistEvents.map((event) => {
                const isPast = isPastEvent(event.event_date);
                const venueName = event.restaurants?.name || 
                  event.event_venue?.[0]?.venue_data?.name || 
                  'Venue TBA';
                
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventCard,
                      isPast && styles.eventCardPast,
                    ]}
                    onPress={() => handleEventPress(event)}
                    disabled={isPast || !event.is_active}
                    activeOpacity={isPast ? 1 : 0.7}
                  >
                    <Image
                      source={{ 
                        uri: event.cover_image_url || 
                        'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800'
                      }}
                      style={[styles.eventImage, isPast && styles.eventImagePast]}
                    />
                    {isPast && (
                      <View style={styles.pastEventOverlay}>
                        <Text style={styles.pastEventText}>Past Event</Text>
                      </View>
                    )}
                    <View style={styles.eventInfo}>
                      <Text 
                        style={[styles.eventTitle, isPast && styles.eventTitlePast]} 
                        numberOfLines={2}
                      >
                        {event.title}
                      </Text>
                      <View style={styles.eventMeta}>
                        <View style={styles.eventMetaItem}>
                          <Ionicons 
                            name="calendar-outline" 
                            size={14} 
                            color={isPast ? AppColors.gray[500] : AppColors.gray[600]} 
                          />
                          <Text style={[styles.eventMetaText, isPast && styles.eventMetaTextPast]}>
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                        <View style={styles.eventMetaItem}>
                          <Ionicons 
                            name="time-outline" 
                            size={14} 
                            color={isPast ? AppColors.gray[500] : AppColors.gray[600]} 
                          />
                          <Text style={[styles.eventMetaText, isPast && styles.eventMetaTextPast]}>
                            {event.start_time}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.eventMetaItem}>
                        <Ionicons 
                          name="location-outline" 
                          size={14} 
                          color={isPast ? AppColors.gray[500] : AppColors.gray[600]} 
                        />
                        <Text 
                          style={[styles.eventVenue, isPast && styles.eventMetaTextPast]} 
                          numberOfLines={1}
                        >
                          {venueName}
                        </Text>
                      </View>
                      {!isPast && event.is_active && (
                        <View style={styles.eventBadge}>
                          <Text style={styles.eventBadgeText}>
                            {event.ticket_type === 'free' ? 'Free Entry' : 'Book Now'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {artistEvents.length === 0 && (
          <View style={styles.noEventsContainer}>
            <Ionicons name="calendar-outline" size={48} color={AppColors.gray[400]} />
            <Text style={styles.noEventsText}>No upcoming events</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    height: height * 0.5,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  artistName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: AppColors.white,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  genreChip: {
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  followersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followersText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.black,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.gray[700],
  },
  socialLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.gray[800],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  instagramButton: {
    backgroundColor: '#E4405F',
  },
  youtubeButton: {
    backgroundColor: '#FF0000',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  twitterButton: {
    backgroundColor: '#1DA1F2',
  },
  spotifyButton: {
    backgroundColor: '#1DB954',
  },
  socialButtonText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  tracksContainer: {
    gap: 12,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.gray[50],
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trackCardActive: {
    backgroundColor: AppColors.primary + '10',
    borderColor: AppColors.primary,
  },
  trackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.gray[600],
    width: 24,
    textAlign: 'center',
  },
  trackNumberActive: {
    color: AppColors.primary,
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.black,
    marginBottom: 4,
  },
  trackNameActive: {
    color: AppColors.primary,
  },
  trackAlbum: {
    fontSize: 14,
    color: AppColors.gray[600],
  },
  trackNoPreview: {
    fontSize: 11,
    color: AppColors.gray[500],
    fontStyle: 'italic',
    marginTop: 2,
  },
  trackRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackDuration: {
    fontSize: 14,
    color: AppColors.gray[600],
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: AppColors.primary,
    gap: 8,
  },
  seeMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
  },
  musicPlayerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: AppColors.white,
    marginBottom: 8,
  },
  musicPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.gray[900],
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  playerAlbumArt: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  playerInfo: {
    flex: 1,
  },
  playerTrackName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.white,
    marginBottom: 4,
  },
  playerArtistName: {
    fontSize: 14,
    color: AppColors.gray[400],
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressSlider: {
    flex: 1,
    height: 40,
  },
  progressTime: {
    fontSize: 12,
    color: AppColors.gray[400],
    width: 40,
    textAlign: 'center',
  },
  playbackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventsContainer: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventCardPast: {
    opacity: 0.6,
  },
  eventImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  eventImagePast: {
    opacity: 0.5,
  },
  pastEventOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: AppColors.gray[700],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pastEventText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.black,
    marginBottom: 12,
  },
  eventTitlePast: {
    color: AppColors.gray[600],
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 14,
    color: AppColors.gray[600],
  },
  eventMetaTextPast: {
    color: AppColors.gray[500],
  },
  eventVenue: {
    fontSize: 14,
    color: AppColors.gray[600],
    flex: 1,
  },
  eventBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  eventBadgeText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noEventsText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.gray[600],
  },
});
