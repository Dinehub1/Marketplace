import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

interface Experience {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
}

interface EventExperienceModalProps {
  visible: boolean;
  experiences: Experience[];
  initialIndex: number;
  onClose: () => void;
}

export const EventExperienceModal: React.FC<EventExperienceModalProps> = ({
  visible,
  experiences,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialIndex]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const modalTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.7],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            activeOpacity={1} 
            onPress={onClose}
          />
        </Animated.View>

        {/* Bottom Sheet Content */}
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: modalTranslateY }]
            }
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={PremiumColors.text.primary} />
          </TouchableOpacity>

          {/* Main Content */}
          <FlatList
            ref={flatListRef}
            data={experiences}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            initialScrollIndex={initialIndex}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            keyExtractor={(item) => item.id}
            // ✅ Performance Optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={3}
            initialNumToRender={1}
            updateCellsBatchingPeriod={50}
            renderItem={({ item, index }) => (
              <View style={styles.slideContainer}>
                {/* Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{
                      uri: item.image_url ||
                        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop'
                    }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  
                  
                </View>

                {/* Content */}
                <ScrollView 
                  style={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.title}>{item.name}</Text>
                  
                  {item.description && (
                    <Text style={styles.description}>{item.description}</Text>
                  )}

                  {/* Additional spacing for better scrolling */}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </View>
            )}
          />

          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {experiences.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* Counter */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} of {experiences.length}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: PremiumColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: PremiumColors.text.muted,
    borderRadius: 2,
    opacity: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 28,
    backgroundColor: 'rgb(66, 0, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgb(31, 31, 31)',
  },
  slideContainer: {
    width: width,
    paddingTop: 8,
  },
  imageContainer: {
    width: width - 32,
    height: 280,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.secondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    maxHeight: height * 0.75 - 280 - 80, // Adjust for image height and pagination
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 12,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: PremiumColors.text.secondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: PremiumColors.text.muted,
    opacity: 0.5,
  },
  paginationDotActive: {
    backgroundColor: PremiumColors.accent.secondary,
    opacity: 1,
    width: 30,
  },
  counterContainer: {
    position: 'absolute',
    bottom: 210,
    right: 14,
    backgroundColor: PremiumColors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PremiumColors.border,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
  },
});

