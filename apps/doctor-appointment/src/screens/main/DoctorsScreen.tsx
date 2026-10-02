import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { DoctorCard } from '../../components/medical/DoctorCard';
import { Colors, Fonts, Spacing } from '../../constants';
import { Doctor, doctorsService } from '../../services/doctorsService';

export const DoctorsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDoctors();
    loadSpecializations();
  }, []);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.info('🏥 Loading doctors...');
      
      const response = await doctorsService.getDoctors({ limit: 50 });
      setDoctors(response.data);
      setFilteredDoctors(response.data);
      
      console.info('✅ Doctors loaded:', response.data.length);
    } catch (error) {
      console.error('❌ Error loading doctors:', error);
      setError('Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpecializations = async () => {
    try {
      const specs = await doctorsService.getSpecializations();
      setSpecializations(['All', ...specs]);
    } catch (error) {
      console.error('❌ Error loading specializations:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDoctors();
    setIsRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterDoctors(query, selectedSpecialization);
  };

  const handleSpecializationFilter = (specialization: string) => {
    setSelectedSpecialization(specialization);
    filterDoctors(searchQuery, specialization);
  };

  const filterDoctors = (query: string, specialization: string) => {
    let filtered = [...doctors];

    if (query) {
      filtered = filtered.filter(
        doctor =>
          doctor.firstName.toLowerCase().includes(query.toLowerCase()) ||
          doctor.lastName.toLowerCase().includes(query.toLowerCase()) ||
          doctor.specialization.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (specialization !== 'All') {
      filtered = filtered.filter(doctor => doctor.specialization === specialization);
    }

    setFilteredDoctors(filtered);
  };

  const handleDoctorPress = (doctorId: string) => {
    navigation.navigate('DoctorDetails' as never, { doctorId } as never);
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Find Doctors" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Find Doctors" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDoctors}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Find Doctors" 
        rightIcon="heart"
        onRightPress={() => navigation.navigate('FavoriteDoctors' as never)}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.searchSection}>
          <Input
            placeholder="Search doctors or specialties..."
            value={searchQuery}
            onChangeText={handleSearch}
            leftIcon="search-outline"
            containerStyle={styles.searchInput}
            editable={true}
            returnKeyType="search"
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.specializationFilter}
          contentContainerStyle={styles.specializationContent}
        >
          {specializations.map((specialization) => (
            <TouchableOpacity
              key={specialization}
              style={[
                styles.specializationChip,
                selectedSpecialization === specialization && styles.selectedChip,
              ]}
              onPress={() => handleSpecializationFilter(specialization)}
            >
              <Text
                style={[
                  styles.specializationText,
                  selectedSpecialization === specialization && styles.selectedChipText,
                ]}
              >
                {specialization}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.doctorsList}
          contentContainerStyle={styles.doctorsContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
          </Text>
          <TouchableOpacity style={styles.sortButton}>
            <Ionicons name="options-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.sortText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {filteredDoctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onPress={() => handleDoctorPress(doctor.id)}
          />
        ))}

        {filteredDoctors.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No doctors found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  specializationFilter: {
    paddingBottom: Spacing.md,
  },
  specializationContent: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  specializationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.full,
    backgroundColor: Colors.gray100,
    marginRight: Spacing.sm,
  },
  selectedChip: {
    backgroundColor: Colors.primary,
  },
  specializationText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.textSecondary,
  },
  selectedChipText: {
    color: Colors.white,
  },
  doctorsList: {
    flex: 1,
  },
  doctorsContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing['4xl'],
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resultsText: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  errorTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
  },
});
