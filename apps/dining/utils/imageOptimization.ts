/**
 * Image Optimization Utilities
 * 
 * Helper functions for image handling, optimization, and caching
 */

import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';

/**
 * Image size configurations for different use cases
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  card: { width: 300, height: 400 },
  hero: { width: 1080, height: 1350 },
  banner: { width: 1200, height: 400 },
  gallery: { width: 800, height: 600 },
  avatar: { width: 100, height: 100 },
} as const;

/**
 * Get optimized image URL with query parameters
 * Note: Requires backend image optimization service (Cloudflare Images, Imgix, etc.)
 */
export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality: number = 80,
  format: 'webp' | 'jpeg' | 'png' = 'webp'
): string => {
  if (!url) return '';

  // If using Cloudflare R2 with image transformations
  // Modify this based on your CDN/image service
  try {
    const urlObj = new URL(url);
    
    // Example for Cloudflare Images
    // urlObj.searchParams.set('width', width?.toString() || 'auto');
    // urlObj.searchParams.set('height', height?.toString() || 'auto');
    // urlObj.searchParams.set('quality', quality.toString());
    // urlObj.searchParams.set('format', format);
    
    return urlObj.toString();
  } catch {
    // Return original URL if invalid
    return url;
  }
};

/**
 * Get blurhash placeholder for image
 * This should be stored in database for each image
 */
export const DEFAULT_BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

/**
 * Preload critical images for better UX
 */
export const preloadCriticalImages = async (imageUrls: string[]) => {
  console.log('📸 Preloading critical images:', imageUrls.length);
  
  const startTime = Date.now();
  
  try {
    await Promise.all(
      imageUrls.map((url) =>
        Image.prefetch(url, {
          cachePolicy: 'memory-disk',
        })
      )
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ Preloaded ${imageUrls.length} images in ${duration}ms`);
  } catch (error) {
    console.error('❌ Error preloading images:', error);
  }
};

/**
 * Clear image cache to free memory
 */
export const clearImageCache = async () => {
  console.log('🧹 Clearing image cache...');
  
  try {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
    console.log('✅ Image cache cleared');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

/**
 * Get cache size (if needed for monitoring)
 */
export const getImageCacheSize = async (): Promise<number> => {
  try {
    const cacheDir = `${(FileSystem as any).cacheDirectory || ''}expo-image`;
    const info = await (FileSystem as any).getInfoAsync(cacheDir);
    
    if (info.exists && 'size' in info) {
      return info.size || 0;
    }
    return 0;
  } catch {
    return 0;
  }
};

/**
 * Image loading priorities
 */
export const IMAGE_PRIORITY = {
  critical: 'high' as const,  // Hero images, above-the-fold content
  normal: 'normal' as const,  // Standard images
  lazy: 'low' as const,       // Below-the-fold, gallery images
};

/**
 * Get appropriate image priority based on position
 */
export const getImagePriority = (
  index: number,
  totalItems: number
): 'low' | 'normal' | 'high' => {
  if (index === 0) return IMAGE_PRIORITY.critical;
  if (index < 3) return IMAGE_PRIORITY.normal;
  return IMAGE_PRIORITY.lazy;
};

/**
 * Format image URL for different sizes
 */
export const getImageForSize = (
  url: string,
  size: keyof typeof IMAGE_SIZES
): string => {
  const dimensions = IMAGE_SIZES[size];
  return getOptimizedImageUrl(url, dimensions.width, dimensions.height);
};

/**
 * Validate image URL
 */
export const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Get fallback image source
 */
export const getFallbackImage = () => {
  return require('../assets/default-image.jpg');
};

