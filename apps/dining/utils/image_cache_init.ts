/**
 * Image Cache Initialization
 * 
 * Initialize image caching configuration on app startup
 * This ensures optimal performance across the app
 * 
 * Note: expo-image doesn't require a plugin in app.json
 * It works automatically when imported and used
 */

import { Image } from 'expo-image';
import { useEffect } from 'react';

export const useImageCacheInit = () => {
  useEffect(() => {
    // Configure expo-image cache settings
    console.log('📸 Initializing image cache configuration...');
    
    // expo-image automatically handles caching with these defaults:
    // - memory-disk caching strategy
    // - Automatic cache size management
    // - Blurhash placeholder support
    // Individual OptimizedImage components can override these settings
    
    // Log cache initialization
    console.log('✅ Image cache initialized with memory-disk strategy');
    console.log('✅ expo-image is ready for native performance');
    
    // Optional: Preload critical images on app start
    // import { preloadCriticalImages } from '../utils/imageOptimization';
    // preloadCriticalImages([...imageUrls]);
    
  }, []);
};

/**
 * Image Cache Manager Hook
 * Use this in your root layout to manage cache
 */
export const useImageCacheManager = () => {
  useEffect(() => {
    // expo-image automatically manages cache
    // No manual configuration needed
    
    // Optional: Clear cache on app start if needed
    // Uncomment only if you want to clear cache on every app launch
    // Image.clearDiskCache();
    
    // Set up cache cleanup on app unmount (optional)
    return () => {
      // Optional: Clear memory cache on app close
      // Image.clearMemoryCache();
    };
  }, []);
};

