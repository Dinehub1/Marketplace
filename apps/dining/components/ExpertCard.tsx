import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from './ui/OptimizedImage';

interface Expert {
  id: string;
  name: string;
  tag: string;
  cover_image_url: string;
  is_verified: boolean;
  city?: string;
}

interface ExpertCardProps {
  expert: Expert;
  onPress?: () => void;
}

const AppColors = {
  primary: '#FF6B35',
  white: '#25252A',
  black: '#FFFFFF',
  gray: {
    100: '#FFFFFF',
    600: '#c7c7c7',
    700: '#c7c7c7',
  },
};

export default function ExpertCard({ expert, onPress }: ExpertCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <OptimizedImage
          source={{ uri: expert.cover_image_url }}
          style={styles.image}
          contentFit="cover"
          priority="normal"
          transition={300}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />
        
      
      </View>

      <View style={styles.content}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {expert.name}
          </Text>
        </View>
        
        <View style={styles.tagContainer}>
          <Ionicons name="star" size={12} color={AppColors.primary} />
          <Text style={styles.tag} numberOfLines={1}>
            {expert.tag}
          </Text>
        </View>

        {expert.city && (
          <View style={styles.cityContainer}>
            <Ionicons name="location" size={12} color={AppColors.gray[600]} />
            <Text style={styles.city} numberOfLines={1}>
              {expert.city}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: 16,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: AppColors.white,
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 12,
  },
  nameContainer: {
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.black,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tag: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
    flex: 1,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  city: {
    fontSize: 12,
    color: AppColors.gray[600],
    flex: 1,
  },
});
