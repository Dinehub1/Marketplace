import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View, Image, Platform } from 'react-native';

const { width } = Dimensions.get('window');

interface EventVideoPlayerProps {
  videoUrl: string;
  coverImageUrl?: string;
  style?: any;
  aspectRatio?: '4:5' | '16:9' | 'cover' | '3:4';
}

export const EventVideoPlayer: React.FC<EventVideoPlayerProps> = ({
  videoUrl,
  coverImageUrl,
  style,
  aspectRatio = '4:5'
}) => {
  const videoRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  
  // Check if we're in Expo Go (where native modules might not be available)
  const isExpoGo = Platform.OS === 'android' && __DEV__;

  useEffect(() => {
    // If we're in Expo Go or have video errors, show image fallback
    if (isExpoGo || hasVideoError) {
      setIsLoading(false);
      return;
    }

    // Try to load expo-video dynamically
    const loadVideo = async () => {
      try {
        const { VideoView, useVideoPlayer } = await import('expo-video');
        setIsLoading(false);
      } catch (error) {
        console.log('expo-video not available, using image fallback:', error);
        setHasVideoError(true);
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [isExpoGo, hasVideoError]);

  const getAspectRatioHeight = () => {
    switch (aspectRatio) {
      case '4:5':
        return width * 1.25; // 4:5 ratio
      case '3:4':
        return width * (4 / 3); // 3:4 ratio
      case '16:9':
        return width * 0.5625; // 16:9 ratio
      case 'cover':
        return 350; // Cover height for event pages
      default:
        return width * 1.25;
    }
  };

  const toggleMute = async () => {
    try {
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      // Video mute logic would go here when video is available
    } catch (error) {
      console.log('Error toggling mute:', error);
      setIsMuted(!isMuted);
    }
  };

  // If we're in Expo Go or have video errors, show image fallback
  if (isExpoGo || hasVideoError || isLoading) {
    return (
      <View style={[styles.container, { height: getAspectRatioHeight() }, style]}>
        <Image
          source={{ uri: coverImageUrl || videoUrl }}
          style={styles.fallbackImage}
          resizeMode="cover"
        />
        
        {/* Play icon overlay to indicate it's a video */}
        <TouchableOpacity 
          style={styles.videoOverlay}
          onPress={toggleMute}
          activeOpacity={0.8}
        >
          <View style={styles.playIconContainer}>
            <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.8)" />
          </View>
          
          {/* Mute button */}
          <View style={styles.muteButton}>
            <View style={styles.muteButtonBackground}>
              <Ionicons 
                name={isMuted ? 'volume-mute' : 'volume-high'} 
                size={20} 
                color="#fff" 
              />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // This would be the actual video player when expo-video is available
  return (
    <View style={[styles.container, { height: getAspectRatioHeight() }, style]}>
      {/* Placeholder for actual video when native modules are available */}
      <Image
        source={{ uri: coverImageUrl || videoUrl }}
        style={styles.fallbackImage}
        resizeMode="cover"
      />
      
      <TouchableOpacity 
        style={styles.videoOverlay}
        onPress={toggleMute}
        activeOpacity={1}
      >
        <View style={styles.muteButton}>
          <View style={styles.muteButtonBackground}>
            <Ionicons 
              name={isMuted ? 'volume-mute' : 'volume-high'} 
              size={20} 
              color="#fff" 
            />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    zIndex: 6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
    borderTopColor: 'transparent',
  },
  muteButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 10,
  },
  muteButtonBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
