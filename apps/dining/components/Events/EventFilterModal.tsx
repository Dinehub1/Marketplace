import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

const { height } = Dimensions.get('window');

export type SortOption = 'popularity' | 'date' | 'price_low' | 'price_high' | 'distance';

export interface EventCategory {
  id: string;
  name: string;
  icon?: string;
  eventCount?: number;
}

interface EventFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (sortBy: SortOption, selectedCategories: string[]) => void;
  categories: EventCategory[];
  initialSortBy?: SortOption;
  initialCategories?: string[];
}

const sortOptions: { id: SortOption; label: string; icon: string }[] = [
  { id: 'popularity', label: 'Popularity', icon: 'trending-up' },
  { id: 'date', label: 'Date', icon: 'calendar' },
  { id: 'price_low', label: 'Price: Low to High', icon: 'arrow-up' },
  { id: 'price_high', label: 'Price: High to Low', icon: 'arrow-down' },
  { id: 'distance', label: 'Distance: Near to Far', icon: 'navigate' },
];

export default function EventFilterModal({
  visible,
  onClose,
  onApply,
  categories,
  initialSortBy = 'popularity',
  initialCategories = [],
}: EventFilterModalProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [selectedSort, setSelectedSort] = useState<SortOption>(initialSortBy);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedSort(initialSortBy);
      setSelectedCategories(initialCategories);
      setSearchQuery('');
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 80,
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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearAll = () => {
    setSelectedSort('popularity');
    setSelectedCategories([]);
    setSearchQuery('');
  };

  const handleApply = () => {
    onApply(selectedSort, selectedCategories);
    onClose();
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedSort !== 'popularity') count++;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    return count;
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Filter by</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={PremiumColors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Sort By Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionLeft}>
                <Text style={styles.sectionTitle}>Sort by</Text>
              </View>
              <View style={styles.sectionRight}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setSelectedSort(option.id)}
                    style={styles.sortOption}
                  >
                    <View
                      style={[
                        styles.radioButton,
                        selectedSort === option.id && styles.radioButtonSelected,
                      ]}
                    >
                      {selectedSort === option.id && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text
                      style={[
                        styles.sortOptionText,
                        selectedSort === option.id && styles.sortOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Genre/Category Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionLeft}>
                <Text style={styles.sectionTitle}>Genre</Text>
              </View>
              <View style={styles.sectionRight}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search"
                    size={16}
                    color={PremiumColors.text.muted}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor={PremiumColors.text.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                      <Ionicons name="close-circle" size={16} color={PremiumColors.text.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Categories List */}
                <View style={styles.categoriesList}>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => toggleCategory(category.id)}
                        style={styles.categoryOption}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selectedCategories.includes(category.id) && styles.checkboxSelected,
                          ]}
                        >
                          {selectedCategories.includes(category.id) && (
                            <Ionicons name="checkmark" size={14} color={PremiumColors.text.inverse} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.categoryText,
                            selectedCategories.includes(category.id) && styles.categoryTextSelected,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No categories found</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>
                {`Apply${getActiveFiltersCount() > 0 ? ` (${getActiveFiltersCount()})` : ''}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: PremiumColors.background.secondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    lineHeight: 28,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: PremiumColors.background.tertiary,
  },
  content: {
    flex: 1,
    minHeight: 200,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  sectionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'flex-start',
  },
  sectionLeft: {
    width: 100,
    paddingTop: 4,
  },
  sectionRight: {
    flex: 1,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    letterSpacing: 0.3,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PremiumColors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: PremiumColors.text.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PremiumColors.text.primary,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: PremiumColors.text.primary,
    flex: 1,
  },
  sortOptionTextSelected: {
    color: PremiumColors.text.primary,
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PremiumColors.text.primary,
    fontWeight: '400',
  },
  clearSearch: {
    padding: 4,
  },
  categoriesList: {
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: PremiumColors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  checkboxSelected: {
    borderColor: PremiumColors.text.primary,
    backgroundColor: PremiumColors.text.primary,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '400',
    color: PremiumColors.text.primary,
    flex: 1,
  },
  categoryTextSelected: {
    color: PremiumColors.text.primary,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: PremiumColors.text.muted,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 28,
    backgroundColor: PremiumColors.background.secondary,
  },
  clearButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '400',
    color: PremiumColors.text.primary,
    textDecorationLine: 'underline',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
});

