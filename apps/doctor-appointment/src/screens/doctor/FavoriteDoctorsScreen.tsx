import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { FavoriteButton } from '../../components/common/FavoriteButton';
import { Header } from '../../components/common/Header';
import { DoctorCard } from '../../components/medical/DoctorCard';
import { Colors, Fonts, Spacing } from '../../constants';
import { FavoriteDoctor, mockFavoriteDoctors } from '../../services/mockData';

// Mock doctor data (in real app, this would come from API)
const mockDoctors = [
  {
    id: '1',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    specialization: 'Cardiologist',
    rating: 4.8,
    totalReviews: 127,
    consultationFee: 150,
    isAvailable: true,
    profileImage: '👩‍⚕️',
    hospital: 'City General Hospital',
    experience: 12,
  },
  {
    id: '2',
    firstName: 'Dr. Michael',
    lastName: 'Chen',
    specialization: 'Dermatologist',
    rating: 4.9,
    totalReviews: 89,
    consultationFee: 120,
    isAvailable: false,
    profileImage: '👨‍⚕️',
    hospital: 'Skin Care Clinic',
    experience: 8,
  },
  {
    id: '3',
    firstName: 'Dr. Emily',
    lastName: 'Rodriguez',
    specialization: 'Pediatrician',
    rating: 4.7,
    totalReviews: 156,
    consultationFee: 100,
    isAvailable: true,
    profileImage: '👩‍⚕️',
    hospital: 'Children\'s Hospital',
    experience: 15,
  },
];

export const FavoriteDoctorsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState<FavoriteDoctor[]>(mockFavoriteDoctors);

  const handleRemoveFromFavorites = (doctorId: string) => {
    setFavorites(favorites.filter(fav => fav.doctorId !== doctorId));
  };

  const handleDoctorPress = (doctorId: string) => {
    // Navigate to doctor details
    console.log('Navigate to doctor details:', doctorId);
  };

  const handleBookAppointment = (doctorId: string) => {
    // Navigate to appointment booking
    console.log('Book appointment with doctor:', doctorId);
  };

  const getFavoriteDoctor = (doctorId: string) => {
    return mockDoctors.find(doctor => doctor.id === doctorId);
  };

  const getFavoriteInfo = (doctorId: string) => {
    return favorites.find(fav => fav.doctorId === doctorId);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="heart-outline" size={64} color={Colors.gray400} />
      </View>
      <Text style={styles.emptyStateTitle}>No Favorite Doctors Yet</Text>
      <Text style={styles.emptyStateDescription}>
        Start adding doctors to your favorites by tapping the heart icon on their profiles.
      </Text>
      <TouchableOpacity
        style={styles.exploreDoctorsButton}
        onPress={() => navigation.navigate('Doctors' as never)}
      >
        <Text style={styles.exploreDoctorsButtonText}>Explore Doctors</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFavoriteStats = () => {
    if (favorites.length === 0) return null;

    const totalConsultations = favorites.reduce((sum, fav) => sum + fav.totalConsultations, 0);
    const recentConsultations = favorites.filter(fav => {
      if (!fav.lastConsultation) return false;
      const lastConsultation = new Date(fav.lastConsultation);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastConsultation > thirtyDaysAgo;
    }).length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Favorite Doctors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalConsultations}</Text>
          <Text style={styles.statLabel}>Total Consultations</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{recentConsultations}</Text>
          <Text style={styles.statLabel}>Recent Visits</Text>
        </View>
      </View>
    );
  };

  const renderDoctorCard = (favorite: FavoriteDoctor) => {
    const doctor = getFavoriteDoctor(favorite.doctorId);
    if (!doctor) return null;

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return (
      <View key={favorite.doctorId} style={styles.favoriteCard}>
        <View style={styles.favoriteCardHeader}>
          <View style={styles.favoriteInfo}>
            <Text style={styles.favoriteDate}>
              Added {formatDate(favorite.addedDate)}
            </Text>
            {favorite.lastConsultation && (
              <Text style={styles.lastConsultation}>
                Last visit: {formatDate(favorite.lastConsultation)}
              </Text>
            )}
          </View>
          <FavoriteButton
            isFavorite={true}
            onToggle={() => handleRemoveFromFavorites(favorite.doctorId)}
            size={20}
          />
        </View>

        <DoctorCard
          doctor={doctor}
          onPress={() => handleDoctorPress(doctor.id)}
          onBookAppointment={() => handleBookAppointment(doctor.id)}
          showFavoriteButton={false}
        />

        <View style={styles.consultationStats}>
          <View style={styles.consultationStat}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.consultationStatText}>
              {favorite.totalConsultations} consultation{favorite.totalConsultations !== 1 ? 's' : ''}
            </Text>
          </View>
          {doctor.isAvailable && (
            <TouchableOpacity
              style={styles.quickBookButton}
              onPress={() => handleBookAppointment(doctor.id)}
            >
              <Ionicons name="add-circle" size={16} color={Colors.white} />
              <Text style={styles.quickBookButtonText}>Quick Book</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderDoctorsList = () => {
    if (favorites.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.doctorsList}>
        {favorites.map(renderDoctorCard)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Favorite Doctors" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      {renderFavoriteStats()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderDoctorsList()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.screenPadding,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray200,
    marginHorizontal: Spacing.md,
  },
  content: {
    flex: 1,
  },
  doctorsList: {
    padding: Spacing.screenPadding,
  },
  favoriteCard: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.md,
    paddingBottom: 0,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteDate: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  lastConsultation: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  consultationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  consultationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  consultationStatText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  quickBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    gap: Spacing.xs,
  },
  quickBookButtonText: {
    fontSize: Fonts.size.sm,
    color: Colors.white,
    fontWeight: Fonts.weight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing['4xl'],
  },
  emptyStateIcon: {
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
    marginBottom: Spacing.lg,
  },
  exploreDoctorsButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
  },
  exploreDoctorsButtonText: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.white,
  },
});
