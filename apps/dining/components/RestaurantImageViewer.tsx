import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AppColors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

export interface ImageItem {
  url: string;
  type: 'food' | 'ambience';
}

export interface MenuCategory {
  id: string;
  name: string;
  images: string[];
}

interface RestaurantImageViewerProps {
  // Gallery Props
  visible: boolean;
  onClose: () => void;
  restaurantName: string;
  priceRange: string;
  
  // Gallery Mode Props
  mode: 'gallery' | 'menu';
  galleryImages?: ImageItem[];
  activeGalleryTab?: 'all' | 'food' | 'ambience';
  onGalleryTabChange?: (tab: 'all' | 'food' | 'ambience') => void;
  currentGalleryIndex?: number;
  onGalleryIndexChange?: (index: number) => void;
  
  // Menu Mode Props
  menuCategories?: MenuCategory[];
  selectedMenuCategory?: string;
  onMenuCategoryChange?: (categoryName: string) => void;
  currentMenuIndex?: number;
  onMenuIndexChange?: (index: number) => void;
}

export default function RestaurantImageViewer({
  visible,
  onClose,
  restaurantName,
  priceRange,
  mode,
  galleryImages = [],
  activeGalleryTab = 'all',
  onGalleryTabChange,
  currentGalleryIndex = 0,
  onGalleryIndexChange,
  menuCategories = [],
  selectedMenuCategory = '',
  onMenuCategoryChange,
  currentMenuIndex = 0,
  onMenuIndexChange,
}: RestaurantImageViewerProps) {
  const gallerySliderRef = useRef<FlatList>(null);
  const menuSliderRef = useRef<FlatList>(null);

  // Gallery functions
  const getFilteredGalleryImages = () => {
    switch (activeGalleryTab) {
      case 'food':
        return galleryImages.filter(img => img.type === 'food');
      case 'ambience':
        return galleryImages.filter(img => img.type === 'ambience');
      default:
        return galleryImages;
    }
  };

  const handleGalleryTabPress = (tab: 'all' | 'food' | 'ambience') => {
    onGalleryTabChange?.(tab);
    // Reset to first image when switching tabs
    onGalleryIndexChange?.(0);
  };

  const handleGalleryThumbnailPress = (index: number) => {
    onGalleryIndexChange?.(index);
    gallerySliderRef.current?.scrollToIndex({ 
      index, 
      animated: true 
    });
  };

  const handleGalleryScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    onGalleryIndexChange?.(index);
  };

  // Menu functions
  const getMenuCategoryImages = () => {
    if (!selectedMenuCategory || !menuCategories) return [];
    const category = menuCategories.find(cat => cat.name === selectedMenuCategory);
    return category?.images || [];
  };

  const handleMenuCategoryPress = (categoryName: string) => {
    onMenuCategoryChange?.(categoryName);
    // Reset to first image when switching categories
    onMenuIndexChange?.(0);
  };

  const handleMenuThumbnailPress = (index: number) => {
    onMenuIndexChange?.(index);
    menuSliderRef.current?.scrollToIndex({ 
      index, 
      animated: true 
    });
  };

  const handleMenuScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    onMenuIndexChange?.(index);
  };

  if (!visible) return null;

  const isGalleryMode = mode === 'gallery';
  const currentImages = isGalleryMode ? getFilteredGalleryImages() : getMenuCategoryImages();
  const currentIndex = isGalleryMode ? currentGalleryIndex : currentMenuIndex;

  return (
    <View style={styles.modal}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={24} color={AppColors.white} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.titleText}>{restaurantName}</Text>
          <Text style={styles.subtitleText}>₹{priceRange} for two</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {isGalleryMode ? (
          // Gallery Tabs
          <>
            <TouchableOpacity 
              style={[styles.tab, activeGalleryTab === 'all' && styles.activeTab]}
              onPress={() => handleGalleryTabPress('all')}
            >
              <Text style={[styles.tabText, activeGalleryTab === 'all' && styles.activeTabText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeGalleryTab === 'food' && styles.activeTab]}
              onPress={() => handleGalleryTabPress('food')}
            >
              <Text style={[styles.tabText, activeGalleryTab === 'food' && styles.activeTabText]}>
                Food
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeGalleryTab === 'ambience' && styles.activeTab]}
              onPress={() => handleGalleryTabPress('ambience')}
            >
              <Text style={[styles.tabText, activeGalleryTab === 'ambience' && styles.activeTabText]}>
                Ambience
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Menu Category Tabs
          menuCategories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={[styles.tab, selectedMenuCategory === category.name && styles.activeTab]}
              onPress={() => handleMenuCategoryPress(category.name)}
            >
              <Text style={[styles.tabText, selectedMenuCategory === category.name && styles.activeTabText]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      
      {/* Main Image Display */}
      <View style={styles.imageContainer}>
        {currentImages.length > 0 ? (
          isGalleryMode ? (
            <FlatList<ImageItem>
              ref={gallerySliderRef}
              data={currentImages as ImageItem[]}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentIndex}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={handleGalleryScroll}
              renderItem={({ item }) => (
                <View style={styles.imageSlide}>
                  <Image
                    source={{ uri: item.url }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                  <View style={styles.imageTypeTag}>
                    <Text style={styles.imageTypeText}>
                      {item.type === 'food' ? 'Food' : 'Ambience'}
                    </Text>
                  </View>
                </View>
              )}
              keyExtractor={(item, index) => `gallery_${index}`}
            />
          ) : (
            <FlatList<string>
              ref={menuSliderRef}
              data={currentImages as string[]}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentIndex}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={handleMenuScroll}
              renderItem={({ item }) => (
                <View style={styles.imageSlide}>
                  <Image
                    source={{ uri: item }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              keyExtractor={(item, index) => `menu_${index}`}
            />
          )
        ) : (
          <View style={styles.noImagesContainer}>
            <Ionicons name="image-outline" size={64} color={AppColors.gray[400]} />
            <Text style={styles.noImagesText}>No images available</Text>
          </View>
        )}
      </View>
      
      {/* Image Counter */}
      {currentImages.length > 0 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {currentImages.length}
          </Text>
        </View>
      )}
      
      {/* Bottom Thumbnail Strip */}
      {currentImages.length > 1 && (
        <View style={styles.footer}>
          {isGalleryMode ? (
            <FlatList<ImageItem>
              data={currentImages as ImageItem[]}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.thumbnail,
                    index === currentIndex && styles.activeThumbnail
                  ]}
                  onPress={() => handleGalleryThumbnailPress(index)}
                >
                  <Image
                    source={{ uri: item.url }}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `gallery_thumb_${index}`}
            />
          ) : (
            <FlatList<string>
              data={currentImages as string[]}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.thumbnail,
                    index === currentIndex && styles.activeThumbnail
                  ]}
                  onPress={() => handleMenuThumbnailPress(index)}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `menu_thumb_${index}`}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.white,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: AppColors.gray[400],
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 25,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.gray[600],
  },
  activeTab: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.gray[400],
    textAlign: 'center',
  },
  activeTabText: {
    color: AppColors.black,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageSlide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenImage: {
    width: width - 40,
    height: height * 0.6,
    borderRadius: 8,
  },
  imageTypeTag: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.white,
  },
  noImagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesText: {
    fontSize: 16,
    color: AppColors.gray[400],
    marginTop: 16,
  },
  counterContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  counterText: {
    fontSize: 14,
    color: AppColors.white,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  thumbnailContainer: {
    paddingHorizontal: 0,
    gap: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: AppColors.white,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
