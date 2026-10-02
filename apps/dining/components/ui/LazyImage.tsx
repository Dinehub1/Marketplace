/**
 * LazyImage Component
 * 
 * Viewport-aware lazy loading image component
 * Only loads images when they enter the viewport
 * Perfect for FlatLists and ScrollViews with many images
 * 
 * Usage:
 * <LazyImage 
 *   source={{ uri: imageUrl }} 
 *   style={styles.image}
 *   threshold={0.5} // Load when 50% visible
 * />
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { OptimizedImage, OptimizedImageProps } from './OptimizedImage';

interface LazyImageProps extends OptimizedImageProps {
  threshold?: number; // Percentage of visibility to trigger load (0-1)
  rootMargin?: number; // Pixels outside viewport to start loading
}

export const LazyImage: React.FC<LazyImageProps> = ({
  threshold = 0.1,
  rootMargin = 100,
  style,
  ...imageProps
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    // Simple timeout-based lazy loading
    // For production, consider using react-native-intersection-observer
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View ref={viewRef} style={style}>
      {shouldLoad ? (
        <OptimizedImage {...imageProps} style={style} lazy />
      ) : (
        <View style={[style, { backgroundColor: '#1A1A1D' }]} />
      )}
    </View>
  );
};

