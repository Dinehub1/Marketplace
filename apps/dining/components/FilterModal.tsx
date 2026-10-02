import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppColors } from '../constants/Colors';
import { Button, H2, Muted } from './ui';

const { height } = Dimensions.get('window');

interface FilterOption {
    id: string;
    label: string;
    type: 'cuisine' | 'rating' | 'price' | 'distance' | 'offers';
}

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApplyFilters: (filters: any) => void;
}

const cuisineOptions = [
    { id: 'italian', label: 'Italian' },
    { id: 'chinese', label: 'Chinese' },
    { id: 'indian', label: 'Indian' },
    { id: 'mexican', label: 'Mexican' },
    { id: 'thai', label: 'Thai' },
    { id: 'american', label: 'American' },
];

const ratingOptions = [
    { id: '4+', label: '4.0+ Stars' },
    { id: '3.5+', label: '3.5+ Stars' },
    { id: '3+', label: '3.0+ Stars' },
];

const priceOptions = [
    { id: '$', label: '$ - Under ₹500' },
    { id: '$$', label: '$$ - ₹500-₹1000' },
    { id: '$$$', label: '$$$ - ₹1000-₹2000' },
    { id: '$$$$', label: '$$$$ - Above ₹2000' },
];

const distanceOptions = [
    { id: '1km', label: 'Within 1 km' },
    { id: '2km', label: 'Within 2 km' },
    { id: '5km', label: 'Within 5 km' },
    { id: '10km', label: 'Within 10 km' },
];

export default function FilterModal({ visible, onClose, onApplyFilters }: FilterModalProps) {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
    const [selectedRating, setSelectedRating] = useState<string>('');
    const [selectedPrice, setSelectedPrice] = useState<string>('');
    const [selectedDistance, setSelectedDistance] = useState<string>('');
    const [offersOnly, setOffersOnly] = useState(false);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const toggleCuisine = (cuisineId: string) => {
        setSelectedCuisines(prev => 
            prev.includes(cuisineId) 
                ? prev.filter(id => id !== cuisineId)
                : [...prev, cuisineId]
        );
    };

    const clearAllFilters = () => {
        setSelectedCuisines([]);
        setSelectedRating('');
        setSelectedPrice('');
        setSelectedDistance('');
        setOffersOnly(false);
    };

    const applyFilters = () => {
        const filters = {
            cuisines: selectedCuisines,
            rating: selectedRating,
            price: selectedPrice,
            distance: selectedDistance,
            offersOnly,
        };
        onApplyFilters(filters);
        onClose();
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (selectedCuisines.length > 0) count++;
        if (selectedRating) count++;
        if (selectedPrice) count++;
        if (selectedDistance) count++;
        if (offersOnly) count++;
        return count;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                
                <Animated.View 
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Button variant="ghost" size="icon" onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={AppColors.black} />
                        </Button>
                        <H2 style={styles.title}>Filters</H2>
                        <Button variant="ghost" size="sm" onPress={clearAllFilters}>
                            Clear All
                        </Button>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                        {/* Cuisine Filter */}
                        <View style={styles.filterSection}>
                            <H2 style={styles.sectionTitle}>Cuisine Type</H2>
                            <View style={styles.optionsGrid}>
                                {cuisineOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => toggleCuisine(option.id)}
                                        style={[
                                            styles.optionChip,
                                            selectedCuisines.includes(option.id) && styles.selectedChip
                                        ]}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            selectedCuisines.includes(option.id) && styles.selectedText
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Rating Filter */}
                        <View style={styles.filterSection}>
                            <H2 style={styles.sectionTitle}>Rating</H2>
                            <View style={styles.optionsList}>
                                {ratingOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => setSelectedRating(option.id === selectedRating ? '' : option.id)}
                                        style={styles.optionRow}
                                    >
                                        <View style={[
                                            styles.radioButton,
                                            selectedRating === option.id && styles.selectedRadio
                                        ]}>
                                            {selectedRating === option.id && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                        <Text style={styles.optionLabel}>{option.label}</Text>
                                        <Ionicons name="star" size={16} color="#FFD700" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Price Filter */}
                        <View style={styles.filterSection}>
                            <H2 style={styles.sectionTitle}>Price Range</H2>
                            <View style={styles.optionsList}>
                                {priceOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => setSelectedPrice(option.id === selectedPrice ? '' : option.id)}
                                        style={styles.optionRow}
                                    >
                                        <View style={[
                                            styles.radioButton,
                                            selectedPrice === option.id && styles.selectedRadio
                                        ]}>
                                            {selectedPrice === option.id && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                        <Text style={styles.optionLabel}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Distance Filter */}
                        <View style={styles.filterSection}>
                            <H2 style={styles.sectionTitle}>Distance</H2>
                            <View style={styles.optionsList}>
                                {distanceOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => setSelectedDistance(option.id === selectedDistance ? '' : option.id)}
                                        style={styles.optionRow}
                                    >
                                        <View style={[
                                            styles.radioButton,
                                            selectedDistance === option.id && styles.selectedRadio
                                        ]}>
                                            {selectedDistance === option.id && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                        <Text style={styles.optionLabel}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Offers Filter */}
                        <View style={styles.filterSection}>
                            <TouchableOpacity
                                onPress={() => setOffersOnly(!offersOnly)}
                                style={styles.switchRow}
                            >
                                <View style={styles.switchInfo}>
                                    <Text style={styles.sectionTitle}>Offers Only</Text>
                                    <Muted style={styles.switchSubtext}>Show only restaurants with special offers</Muted>
                                </View>
                                <View style={[
                                    styles.switch,
                                    offersOnly && styles.switchActive
                                ]}>
                                    <View style={[
                                        styles.switchThumb,
                                        offersOnly && styles.switchThumbActive
                                    ]} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    {/* Apply Button */}
                    <View style={styles.footer}>
                        <Button
                            size="lg"
                            onPress={applyFilters}
                            style={styles.applyButton}
                            fullWidth
                        >
                            Apply Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
                        </Button>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
    },
    modalContainer: {
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: height * 0.85,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[200],
    },
      closeButton: {
    // Button component handles styling
  },
      title: {
    // Typography handled by H2 component
  },
    clearButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.primary,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    filterSection: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[100],
    },
      sectionTitle: {
    marginBottom: 20, // mb-5
    // Typography handled by H2 component
  },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: AppColors.gray[300],
        backgroundColor: AppColors.white,
    },
    selectedChip: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
        color: AppColors.gray[700],
    },
    selectedText: {
        color: AppColors.white,
    },
    optionsList: {
        gap: 12,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 12,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: AppColors.gray[300],
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedRadio: {
        borderColor: AppColors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: AppColors.primary,
    },
    optionLabel: {
        flex: 1,
        fontSize: 16,
        color: AppColors.black,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    switchInfo: {
        flex: 1,
    },
      switchSubtext: {
    marginTop: 6, // mt-1.5
    // Typography handled by Muted component
  },
    switch: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: AppColors.gray[300],
        justifyContent: 'center',
        padding: 2,
    },
    switchActive: {
        backgroundColor: AppColors.primary,
    },
    switchThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: AppColors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    switchThumbActive: {
        transform: [{ translateX: 20 }],
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: AppColors.gray[200],
    },
      applyButton: {
    // Button component handles styling
  },
      // applyButtonText removed - handled by Button component
});
