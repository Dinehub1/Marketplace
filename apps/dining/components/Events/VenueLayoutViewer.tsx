import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { getSectionBoundingBox, SectionWithAvailability } from '../../utils/layoutService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VenueLayoutViewerProps {
  svgUrl: string;
  sections: SectionWithAvailability[];
  onSectionPress: (section: SectionWithAvailability) => void;
  viewbox?: string | null;
}

// Coordinates are now loaded dynamically from database (bbox_x, bbox_y, bbox_width, bbox_height)

export default function VenueLayoutViewer({
  svgUrl,
  sections,
  onSectionPress,
  viewbox = '0 0 1080 1350',
}: VenueLayoutViewerProps) {
  const [svgLoaded, setSvgLoaded] = useState(false);
  const [svgError, setSvgError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Log SVG URL on mount
  useEffect(() => {
    console.log('🖼️ ========================================');
    console.log('🖼️ VENUE LAYOUT VIEWER - INITIALIZING');
    console.log('🖼️ ========================================');
    console.log('📍 SVG URL:', svgUrl);
    console.log('📍 Viewbox:', viewbox);
    console.log('📍 Sections count:', sections.length);
    console.log('📍 Available sections:', sections.filter(s => s.is_available).length);
  }, [svgUrl, viewbox, sections]);

  // Parse viewbox to get SVG dimensions
  const viewboxParts = viewbox?.split(' ') || ['0', '0', '1080', '1350'];
  const svgWidth = parseFloat(viewboxParts[2]);
  const svgHeight = parseFloat(viewboxParts[3]);

  // Calculate display dimensions to fit screen width with proper aspect ratio
  const containerWidth = SCREEN_WIDTH - 40; // 20px padding on each side
  const aspectRatio = svgHeight / svgWidth;
  
  // Use full container width and calculate height based on aspect ratio
  const displayWidth = containerWidth;
  const displayHeight = containerWidth * aspectRatio;

  console.log('📐 SVG Dimensions:', {
    viewbox,
    svgWidth,
    svgHeight,
    aspectRatio,
    displayWidth,
    displayHeight,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
  });

  // Get section by polygon key
  const getSectionByKey = (key: string): SectionWithAvailability | undefined => {
    return sections.find(s => s.polygon_key === key);
  };

  // Check if section is in database
  const isSectionInDatabase = (key: string): boolean => {
    return sections.some(s => s.polygon_key === key);
  };

  // Convert SVG coordinates to display coordinates
  const convertCoordinates = (svgX: number, svgY: number, svgW: number, svgH: number) => {
    const scaleX = displayWidth / svgWidth;
    const scaleY = displayHeight / svgHeight;
    
    return {
      x: svgX * scaleX,
      y: svgY * scaleY,
      width: svgW * scaleX,
      height: svgH * scaleY,
    };
  };

  // Handle section press
  const handleSectionPress = (key: string) => {
    const section = getSectionByKey(key);
    if (section && section.is_available) {
      console.log('🎯 Section pressed:', section.name);
      onSectionPress(section);
    } else if (section) {
      console.log('⚠️ Section not available:', section.name);
    } else {
      console.log('⚠️ Section not in database:', key);
    }
  };

  if (svgError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={PremiumColors.error} />
        <Text style={styles.errorText}>Failed to load venue layout</Text>
        <Text style={styles.errorSubtext}>{errorMessage || 'Please try again later'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scrollable SVG Container */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        maximumZoomScale={3}
        minimumZoomScale={1}
        bouncesZoom={true}
      >
        <View style={[styles.imageContainer, { width: displayWidth, height: displayHeight }]}>
          {/* Background SVG using expo-image */}
          <Image
            source={svgUrl}
            contentFit="contain"
            style={{
              width: displayWidth,
              height: displayHeight,
            }}
            onLoad={() => {
              console.log('✅ ========================================');
              console.log('✅ SVG LOADED SUCCESSFULLY');
              console.log('✅ ========================================');
              console.log('✅ SVG URL:', svgUrl);
              console.log('✅ Display dimensions:', { width: displayWidth, height: displayHeight });
              setSvgLoaded(true);
            }}
            onError={(error) => {
              console.error('❌ ========================================');
              console.error('❌ SVG LOADING FAILED');
              console.error('❌ ========================================');
              console.error('❌ Error:', error);
              console.error('❌ SVG URL:', svgUrl);
              console.error('❌ ========================================');
              setSvgError(true);
              setErrorMessage('SVG file could not be loaded. Check network or file format.');
            }}
          />

          {/* Loading Indicator */}
          {!svgLoaded && !svgError && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PremiumColors.accent.secondary} />
              <Text style={styles.loadingText}>Loading venue layout...</Text>
            </View>
          )}

          {/* Interactive Overlay - Only show when SVG is loaded */}
          {svgLoaded && (
            <View style={[styles.overlay, { width: displayWidth, height: displayHeight }]}>
              {sections.map((section) => {
                // Get bounding box from database
                const bbox = getSectionBoundingBox(section);
                
                if (!bbox) {
                  console.warn(`⚠️ Section ${section.polygon_key} skipped - missing bounding box`);
                  return null;
                }

                const displayCoords = convertCoordinates(bbox.x, bbox.y, bbox.width, bbox.height);
                const isAvailable = section.is_available;
                const isSoldOut = section.status === 'sold_out' || section.available_capacity === 0;

                console.log(`📍 Rendering overlay for ${section.polygon_key}:`, {
                  bbox,
                  displayCoords,
                  isAvailable,
                  isSoldOut,
                });

                return (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.sectionOverlay,
                      {
                        left: displayCoords.x,
                        top: displayCoords.y,
                        width: displayCoords.width,
                        height: displayCoords.height,
                        backgroundColor: 'transparent', // Completely transparent - SVG shows through
                        borderWidth: 0, // No border - let SVG be original
                        borderColor: 'transparent',
                      },
                    ]}
                    onPress={() => handleSectionPress(section.polygon_key)}
                    activeOpacity={isAvailable ? 0.8 : 1}
                    disabled={!isAvailable}
                  >
                    {/* Only show sold out indicator */}
                    {isSoldOut && (
                      <View style={styles.soldOutOverlay}>
                        <View style={styles.soldOutBadge}>
                          <Ionicons name="close-circle" size={24} color="#fff" />
                          <Text style={styles.soldOutText}>SOLD OUT</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle-outline" size={16} color={PremiumColors.text.tertiary} />
          <Text style={styles.instructionsText}>
            Scroll to view full layout • Tap sections to book tickets
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgImage: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sectionOverlay: {
    position: 'absolute',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  soldOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  soldOutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: PremiumColors.text.secondary,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

