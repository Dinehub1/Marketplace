import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { RecordCard } from '../../components/medical/RecordCard';
import { Colors, Fonts, Spacing } from '../../constants';
import { MedicalRecord, mockMedicalRecords } from '../../services/mockData';

type FilterCategory = 'all' | 'prescription' | 'lab_report' | 'scan' | 'consultation' | 'vaccination' | 'other';
type SortOption = 'date_desc' | 'date_asc' | 'title_asc' | 'category';

const filterOptions = [
  { value: 'all', label: 'All Records', icon: 'albums-outline' },
  { value: 'prescription', label: 'Prescriptions', icon: 'medical-outline' },
  { value: 'lab_report', label: 'Lab Reports', icon: 'flask-outline' },
  { value: 'scan', label: 'Scans', icon: 'scan-outline' },
  { value: 'consultation', label: 'Consultations', icon: 'person-outline' },
  { value: 'vaccination', label: 'Vaccinations', icon: 'shield-checkmark-outline' },
];

const sortOptions = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'category', label: 'By Category' },
];

export const AllMedicalRecordsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [showFilters, setShowFilters] = useState(false);

  const handleAddRecord = () => {
    // Navigate to AddMedicalRecordScreen
    console.log('Navigate to Add Medical Record');
  };

  const handleRecordPress = (record: MedicalRecord) => {
    console.log('Open record details:', record.id);
  };

  const handleShareRecord = (record: MedicalRecord) => {
    console.log('Share record:', record.id);
  };

  const handleDownloadRecord = (record: MedicalRecord) => {
    console.log('Download record:', record.id);
  };

  const filterRecords = (records: MedicalRecord[]) => {
    let filtered = records;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(record => record.category === selectedFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'title_asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return filtered;
  };

  const groupRecordsByDate = (records: MedicalRecord[]) => {
    const groups: { [key: string]: MedicalRecord[] } = {};
    
    records.forEach(record => {
      const date = new Date(record.date);
      const year = date.getFullYear();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const key = `${month} ${year}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });

    return groups;
  };

  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={Colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search records..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.gray400}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-outline" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFilterBar = () => (
    <View style={styles.filterSection}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              selectedFilter === filter.value && styles.filterChipSelected,
            ]}
            onPress={() => setSelectedFilter(filter.value as FilterCategory)}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={selectedFilter === filter.value ? Colors.white : Colors.textSecondary} 
            />
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter.value && styles.filterChipTextSelected,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="funnel-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderSortOptions = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.sortSection}>
        <Text style={styles.sortTitle}>Sort by:</Text>
        <View style={styles.sortOptions}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionSelected,
              ]}
              onPress={() => {
                setSortBy(option.value as SortOption);
                setShowFilters(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === option.value && styles.sortOptionTextSelected,
              ]}>
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={16} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderRecordsStats = () => {
    const filteredRecords = filterRecords(mockMedicalRecords);
    
    return (
      <View style={styles.statsSection}>
        <Text style={styles.statsText}>
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
        </Text>
      </View>
    );
  };

  const renderRecordsList = () => {
    const filteredRecords = filterRecords(mockMedicalRecords);
    
    if (filteredRecords.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color={Colors.gray400} />
          <Text style={styles.emptyStateTitle}>No Records Found</Text>
          <Text style={styles.emptyStateDescription}>
            {searchQuery 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first medical record'
            }
          </Text>
        </View>
      );
    }

    if (sortBy === 'date_desc' || sortBy === 'date_asc') {
      // Group by date for date-based sorting
      const groupedRecords = groupRecordsByDate(filteredRecords);
      
      return (
        <View style={styles.recordsList}>
          {Object.entries(groupedRecords).map(([dateGroup, records]) => (
            <View key={dateGroup}>
              <Text style={styles.dateGroupHeader}>{dateGroup}</Text>
              {records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onPress={() => handleRecordPress(record)}
                  onShare={() => handleShareRecord(record)}
                  onDownload={() => handleDownloadRecord(record)}
                />
              ))}
            </View>
          ))}
        </View>
      );
    }

    // Regular list for other sorting options
    return (
      <View style={styles.recordsList}>
        {filteredRecords.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            onPress={() => handleRecordPress(record)}
            onShare={() => handleShareRecord(record)}
            onDownload={() => handleDownloadRecord(record)}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Medical Records" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
        rightIcon="add"
        onRightPress={handleAddRecord}
      />
      
      {renderSearchBar()}
      {renderFilterBar()}
      {renderSortOptions()}
      {renderRecordsStats()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderRecordsList()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Spacing.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.full,
    backgroundColor: Colors.gray100,
    gap: Spacing.xs,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: Fonts.weight.medium,
  },
  filterChipTextSelected: {
    color: Colors.white,
  },
  sortButton: {
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  sortSection: {
    backgroundColor: Colors.white,
    padding: Spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  sortTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sortOptions: {
    gap: Spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  sortOptionSelected: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.sm,
  },
  sortOptionText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  sortOptionTextSelected: {
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  statsSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  statsText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  recordsList: {
    padding: Spacing.screenPadding,
  },
  dateGroupHeader: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing['4xl'],
  },
  emptyStateTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateDescription: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
  },
});
