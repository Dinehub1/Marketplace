import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

export type DateFilter = 'today' | 'tomorrow' | 'this_weekend' | null;
export type DistanceFilter = 5 | 10 | null;

export interface ActiveFilter {
  id: string;
  label: string;
  type: 'date' | 'distance' | 'category';
  value: string;
}

interface EventFilterBarProps {
  onFilterPress: () => void;
  activeFiltersCount: number;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  distanceFilter: DistanceFilter;
  onDistanceFilterChange: (filter: DistanceFilter) => void;
  quickCategories: Array<{ id: string; name: string }>;
  selectedQuickCategories: string[];
  onQuickCategoryToggle: (categoryId: string) => void;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filterId: string) => void;
}

export default function EventFilterBar({
  onFilterPress,
  activeFiltersCount,
  dateFilter,
  onDateFilterChange,
  distanceFilter,
  onDistanceFilterChange,
  quickCategories,
  selectedQuickCategories,
  onQuickCategoryToggle,
  activeFilters,
  onRemoveFilter,
}: EventFilterBarProps) {
  const handleDateFilterToggle = (filter: DateFilter) => {
    // Toggle: if same filter is clicked, deselect it
    onDateFilterChange(dateFilter === filter ? null : filter);
  };

  const handleDistanceFilterToggle = (filter: DistanceFilter) => {
    // Toggle: if same filter is clicked, deselect it
    onDistanceFilterChange(distanceFilter === filter ? null : filter);
  };

  return (
    <View style={styles.container}>
      {/* Quick Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Filter Button with Badge */}
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
          <Ionicons name="options" size={18} color={PremiumColors.text.primary} />
          <Text style={styles.filterButtonText}>Filters</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Date Filters */}
        <FilterChip
          label="Today"
          icon="today"
          selected={dateFilter === 'today'}
          onPress={() => handleDateFilterToggle('today')}
          onRemove={dateFilter === 'today' ? () => onDateFilterChange(null) : undefined}
        />
        <FilterChip
          label="Tomorrow"
          icon="calendar"
          selected={dateFilter === 'tomorrow'}
          onPress={() => handleDateFilterToggle('tomorrow')}
          onRemove={dateFilter === 'tomorrow' ? () => onDateFilterChange(null) : undefined}
        />
        <FilterChip
          label="This Weekend"
          icon="calendar-outline"
          selected={dateFilter === 'this_weekend'}
          onPress={() => handleDateFilterToggle('this_weekend')}
          onRemove={dateFilter === 'this_weekend' ? () => onDateFilterChange(null) : undefined}
        />

        {/* Distance Filters */}
        <FilterChip
          label="Under 5 km"
          icon="navigate"
          selected={distanceFilter === 5}
          onPress={() => handleDistanceFilterToggle(5)}
          onRemove={distanceFilter === 5 ? () => onDistanceFilterChange(null) : undefined}
        />
        <FilterChip
          label="Under 10 km"
          icon="navigate"
          selected={distanceFilter === 10}
          onPress={() => handleDistanceFilterToggle(10)}
          onRemove={distanceFilter === 10 ? () => onDistanceFilterChange(null) : undefined}
        />

        {/* Quick Category Filters */}
        {quickCategories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            icon="musical-notes"
            selected={selectedQuickCategories.includes(category.id)}
            onPress={() => onQuickCategoryToggle(category.id)}
            onRemove={
              selectedQuickCategories.includes(category.id)
                ? () => onQuickCategoryToggle(category.id)
                : undefined
            }
          />
        ))}
      </ScrollView>

      {/* Active Filters Display (if any) */}
      {activeFilters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersContent}
          style={styles.activeFiltersScroll}
        >
          {activeFilters.map((filter) => (
            <View key={filter.id} style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{filter.label}</Text>
              <TouchableOpacity
                onPress={() => onRemoveFilter(filter.id)}
                style={styles.removeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={14} color={PremiumColors.accent.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

interface FilterChipProps {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
  onRemove?: () => void;
}

function FilterChip({ label, icon, selected, onPress, onRemove }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterChip, selected && styles.filterChipSelected]}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={selected ? PremiumColors.text.inverse : PremiumColors.text.secondary}
          style={styles.chipIcon}
        />
      )}
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
        {label}
      </Text>
      {selected && onRemove && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={styles.chipRemoveButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color={PremiumColors.text.inverse} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PremiumColors.background.primary,
    paddingVertical: 12,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: PremiumColors.accent.primary,
    gap: 8,
    position: 'relative',
    shadowColor: PremiumColors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    letterSpacing: 0.3,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: PremiumColors.accent.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: PremiumColors.background.primary,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PremiumColors.text.inverse,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    gap: 6,
  },
  filterChipSelected: {
    backgroundColor: PremiumColors.accent.primary,
    borderColor: PremiumColors.accent.primary,
    shadowColor: PremiumColors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chipIcon: {
    marginRight: 2,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
    letterSpacing: 0.2,
  },
  filterChipTextSelected: {
    color: PremiumColors.text.inverse,
    fontWeight: '700',
  },
  chipRemoveButton: {
    marginLeft: 4,
    padding: 2,
  },
  activeFiltersScroll: {
    marginTop: 8,
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PremiumColors.accent.primary,
    gap: 8,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: PremiumColors.accent.primary,
    letterSpacing: 0.2,
  },
  removeButton: {
    padding: 2,
  },
});

