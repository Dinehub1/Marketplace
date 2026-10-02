import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrentTheme, useThemeColors } from '../hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

interface GuestSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (guestCount: number) => void;
  initialGuestCount?: number;
}

export default function GuestSelectorModal({
  visible,
  onClose,
  onConfirm,
  initialGuestCount = 2,
}: GuestSelectorModalProps) {
  const theme = useThemeColors();
  const currentTheme = useCurrentTheme();
  const [selectedGuests, setSelectedGuests] = useState(initialGuestCount);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Green theme colors (consistent across themes)
  const greenTheme = {
    primary: '#10B981',
    secondary: '#34D399',
    dark: '#059669',
    background: currentTheme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        onClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const renderGuestOption = (count: number) => {
    const isSelected = selectedGuests === count;
    return (
      <TouchableOpacity
        key={count}
        style={[
          styles.guestNumber,
          isSelected && styles.selectedGuestNumber,
        ]}
        onPress={() => setSelectedGuests(count)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.numberText,
          isSelected && styles.selectedNumberText,
        ]}>
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedGuests);
    onClose();
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      backgroundColor: theme.background.primary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: height * 0.8,
      paddingBottom: 34,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.text.tertiary,
      borderRadius: 2,
    },
    header: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text.primary,
      marginBottom: 8,
    },
    numberSlider: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    numberSliderContent: {
      paddingHorizontal: 12,
      gap: 12,
    },
    guestNumber: {
      width: 50,
      height: 50,
      backgroundColor: theme.background.secondary,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.border,
    },
    selectedGuestNumber: {
      backgroundColor: greenTheme.primary,
      borderColor: greenTheme.primary,
    },
    numberText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text.primary,
    },
    selectedNumberText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    buttonContainer: {
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    continueButton: {
      backgroundColor: greenTheme.primary,
      paddingVertical: 16,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: greenTheme.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginRight: 8,
    },
  });

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Number of Guests</Text>
          </View>

          {/* Horizontal Number Slider */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.numberSliderContent}
            style={styles.numberSlider}
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map(count =>
              renderGuestOption(count)
            )}
          </ScrollView>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                Continue with {selectedGuests} {selectedGuests === 1 ? 'Guest' : 'Guests'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}