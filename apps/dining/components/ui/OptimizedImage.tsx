/**
 * OptimizedImage Component
 * 
 * High-performance image component with:
 * - Expo Image for native optimization
 * - Lazy loading support
 * - Memory-efficient caching
 * - Progressive loading
 * - Automatic placeholder
 * - Error handling with fallback
 * 
 * Usage:
 * <OptimizedImage 
 *   source={{ uri: imageUrl }} 
 *   style={styles.image}
 *   contentFit="cover"
 *   priority="high" // or "normal" or "low"
 * />
 */

import { Image, ImageProps } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { PremiumColors } from '../../constants/Colors';

// Blurhash for placeholder (common neutral gray)
const PLACEHOLDER_BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export interface OptimizedImageProps extends Omit<ImageProps, 'source' | 'style'> {
  source: { uri: string } | number;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: 'low' | 'normal' | 'high';
  placeholder?: string; // blurhash
  showLoadingIndicator?: boolean;
  fallbackSource?: { uri: string } | number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none';
  lazy?: boolean; // Enable lazy loading
  transition?: number; // Fade transition duration in ms
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  priority = 'normal',
  placeholder = PLACEHOLDER_BLURHASH,
  showLoadingIndicator = true,
  fallbackSource,
  onLoadStart,
  onLoadEnd,
  onError,
  cachePolicy = 'memory-disk',
  lazy = false,
  transition = 300,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoadEnd?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Determine final source
  const finalSource = hasError && fallbackSource ? fallbackSource : source;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={finalSource}
        style={[StyleSheet.absoluteFill, style]}
        contentFit={contentFit}
        placeholder={placeholder}
        placeholderContentFit="cover"
        priority={priority}
        cachePolicy={cachePolicy}
        transition={transition}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        // Enable lazy loading if specified
        {...(lazy && { recyclingKey: typeof source === 'object' ? source.uri : undefined })}
        {...props}
      />

      {/* Loading Indicator */}
      {isLoading && showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={PremiumColors.accent.secondary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.tertiary,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
  },
});

/**
 * Memory-efficient image preloader
 * Use this to preload critical images
 */
export const preloadImages = async (uris: string[]) => {
  const promises = uris.map((uri) =>
    Image.prefetch(uri, {
      cachePolicy: 'memory-disk',
    })
  );
  await Promise.all(promises);
};

/**
 * Clear image cache when needed
 */
export const clearImageCache = async () => {
  await Image.clearDiskCache();
  await Image.clearMemoryCache();
};

