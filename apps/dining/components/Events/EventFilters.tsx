import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import EventFilterBar, { ActiveFilter, DateFilter, DistanceFilter } from './EventFilterBar';
import EventFilterModal, { EventCategory, SortOption } from './EventFilterModal';

export interface EventFiltersState {
  dateFilter: DateFilter;
  distanceFilter: DistanceFilter;
  selectedCategories: string[];
  sortBy: SortOption;
}

interface EventFiltersProps {
  categories: EventCategory[];
  onFiltersChange: (filters: EventFiltersState) => void;
  quickCategories?: Array<{ id: string; name: string }>;
}

export default function EventFilters({
  categories,
  onFiltersChange,
  quickCategories = [],
}: EventFiltersProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>(null);
  const [selectedQuickCategories, setSelectedQuickCategories] = useState<string[]>([]);
  const [selectedModalCategories, setSelectedModalCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');

  // Combine all selected categories
  const allSelectedCategories = [
    ...new Set([...selectedQuickCategories, ...selectedModalCategories]),
  ];

  // Calculate active filters for display
  const activeFilters: ActiveFilter[] = [];

  if (dateFilter === 'today') {
    activeFilters.push({ id: 'date-today', label: 'Today', type: 'date', value: 'today' });
  } else if (dateFilter === 'tomorrow') {
    activeFilters.push({
      id: 'date-tomorrow',
      label: 'Tomorrow',
      type: 'date',
      value: 'tomorrow',
    });
  } else if (dateFilter === 'this_weekend') {
    activeFilters.push({
      id: 'date-weekend',
      label: 'This Weekend',
      type: 'date',
      value: 'this_weekend',
    });
  }

  if (distanceFilter === 5) {
    activeFilters.push({
      id: 'distance-5',
      label: 'Under 5 km',
      type: 'distance',
      value: '5',
    });
  } else if (distanceFilter === 10) {
    activeFilters.push({
      id: 'distance-10',
      label: 'Under 10 km',
      type: 'distance',
      value: '10',
    });
  }

  // Add categories from modal (not in quick filters)
  selectedModalCategories.forEach((catId) => {
    if (!selectedQuickCategories.includes(catId)) {
      const category = categories.find((c) => c.id === catId);
      if (category) {
        activeFilters.push({
          id: `category-${catId}`,
          label: category.name,
          type: 'category',
          value: catId,
        });
      }
    }
  });

  // Notify parent of filter changes
  useEffect(() => {
    const filterState: EventFiltersState = {
      dateFilter,
      distanceFilter,
      selectedCategories: allSelectedCategories,
      sortBy,
    };
    onFiltersChange(filterState);
  }, [dateFilter, distanceFilter, allSelectedCategories.join(','), sortBy]);

  const handleQuickCategoryToggle = (categoryId: string) => {
    setSelectedQuickCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleModalApply = (newSortBy: SortOption, newCategories: string[]) => {
    setSortBy(newSortBy);
    setSelectedModalCategories(newCategories);
  };

  const handleRemoveFilter = (filterId: string) => {
    if (filterId.startsWith('date-')) {
      setDateFilter(null);
    } else if (filterId.startsWith('distance-')) {
      setDistanceFilter(null);
    } else if (filterId.startsWith('category-')) {
      const categoryId = filterId.replace('category-', '');
      setSelectedModalCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  // Calculate active filters count for modal
  const getActiveFiltersCount = () => {
    let count = 0;
    if (sortBy !== 'popularity') count++;
    if (selectedModalCategories.length > 0) count += selectedModalCategories.length;
    return count;
  };

  return (
    <View>
      <EventFilterBar
        onFilterPress={() => setModalVisible(true)}
        activeFiltersCount={getActiveFiltersCount()}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        distanceFilter={distanceFilter}
        onDistanceFilterChange={setDistanceFilter}
        quickCategories={quickCategories}
        selectedQuickCategories={selectedQuickCategories}
        onQuickCategoryToggle={handleQuickCategoryToggle}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
      />

      <EventFilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onApply={handleModalApply}
        categories={categories}
        initialSortBy={sortBy}
        initialCategories={selectedModalCategories}
      />
    </View>
  );
}

