import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { AppointmentCard } from '../../components/medical/AppointmentCard';
import { Colors, Fonts, Spacing } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment, appointmentsService } from '../../services/appointmentsService';

const filterOptions = ['All', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'];

export const AppointmentsScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      console.info('📅 Loading appointments for user:', user.id);
      
      const response = await appointmentsService.getUserAppointments(user.id, { limit: 100 });
      setAppointments(response.data);
      setFilteredAppointments(response.data);
      
      console.info('✅ Appointments loaded:', response.data.length);
    } catch (error) {
      console.error('❌ Error loading appointments:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    if (filter === 'All') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter(
          appointment => appointment.status.toLowerCase() === filter.toLowerCase()
        )
      );
    }
  };

  const handleReschedule = (appointmentId: string) => {
    // TODO: Implement reschedule functionality
    console.log('Reschedule appointment:', appointmentId);
  };

  const handleCancel = (appointmentId: string) => {
    // TODO: Implement cancel functionality
    console.log('Cancel appointment:', appointmentId);
  };

  const handleAppointmentPress = (appointmentId: string) => {
    // TODO: Navigate to appointment details
    console.log('View appointment:', appointmentId);
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Appointments" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Appointments" />
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterSection}
        contentContainerStyle={styles.filterContent}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.selectedChip,
            ]}
            onPress={() => handleFilterChange(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.selectedFilterText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.appointmentsList}
        contentContainerStyle={styles.appointmentsContent}
        showsVerticalScrollIndicator={false}
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
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {filteredAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onPress={() => handleAppointmentPress(appointment.id)}
            onReschedule={() => handleReschedule(appointment.id)}
            onCancel={() => handleCancel(appointment.id)}
          />
        ))}

        {filteredAppointments.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptyDescription}>
              {selectedFilter === 'All' 
                ? "You don't have any appointments yet. Book your first appointment with a doctor!"
                : "You don't have any appointments matching the selected filter."
              }
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAppointments}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterSection: {
    paddingBottom: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.full,
    backgroundColor: Colors.gray100,
    marginRight: Spacing.sm,
  },
  selectedChip: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.textSecondary,
  },
  selectedFilterText: {
    color: Colors.white,
  },
  appointmentsList: {
    flex: 1,
  },
  appointmentsContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing['4xl'],
  },
  resultsHeader: {
    marginBottom: Spacing.lg,
  },
  resultsText: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
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
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  errorText: {
    fontSize: Fonts.size.base,
    color: Colors.error,
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
