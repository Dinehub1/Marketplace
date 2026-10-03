import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Colors, Fonts, SCREEN_NAMES, Spacing } from '../../constants';
import { doctorsService, Doctor as DoctorType } from '../../services/doctorsService';

// Use the Doctor type from the service
type Doctor = DoctorType;

export const DoctorDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const doctorId = (route.params as any)?.doctorId;

  useEffect(() => {
    loadDoctorDetails();
  }, [doctorId]);

  const loadDoctorDetails = async () => {
    try {
      setIsLoading(true);
      console.info('👨‍⚕️ Loading doctor details for ID:', doctorId);
      
      const doctorData = await doctorsService.getDoctorById(doctorId || '1');
      setDoctor(doctorData);
      
      console.info('✅ Doctor details loaded:', doctorData.firstName, doctorData.lastName);
    } catch (error) {
      console.error('❌ Error loading doctor details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = () => {
    if (doctor) {
      navigation.navigate(SCREEN_NAMES.BOOK_APPOINTMENT as never, { 
        doctorId: doctor.id,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee
      } as never);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color={Colors.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color={Colors.warning} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color={Colors.gray300} />
      );
    }

    return stars;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Doctor Details" 
          showBackButton 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading doctor details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Doctor Details" 
          showBackButton 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Doctor not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Doctor Details" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Profile */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {doctor.profileImage ? (
              <Image source={{ uri: doctor.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {doctor.firstName[0]}{doctor.lastName[0]}
                </Text>
              </View>
            )}
            <View style={[styles.availabilityBadge, { backgroundColor: doctor.isAvailable ? Colors.success : Colors.gray400 }]}>
              <Text style={styles.availabilityText}>
                {doctor.isAvailable ? 'Available' : 'Busy'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.doctorName}>
            Dr. {doctor.firstName} {doctor.lastName}
          </Text>
          <Text style={styles.specialization}>{doctor.specialization}</Text>
          <Text style={styles.hospital}>{doctor.hospital}</Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(doctor.rating)}
            </View>
            <Text style={styles.ratingText}>
              {doctor.rating} ({doctor.totalReviews} reviews)
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{doctor.experience}+</Text>
            <Text style={styles.statLabel}>Years Experience</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{doctor.totalReviews}</Text>
            <Text style={styles.statLabel}>Patient Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${doctor.consultationFee}</Text>
            <Text style={styles.statLabel}>Consultation Fee</Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{doctor.about}</Text>
        </View>

        {/* Education */}
        {doctor.education && doctor.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {doctor.education.map((edu, index) => (
              <View key={index} style={styles.educationItem}>
                <Ionicons name="school-outline" size={16} color={Colors.primary} />
                <Text style={styles.educationText}>{edu}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Book Appointment Button */}
      <View style={styles.bottomSection}>
        <Button
          title="Book Appointment"
          onPress={handleBookAppointment}
          disabled={!doctor.isAvailable}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Fonts.size.base,
    color: Colors.error,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.screenPadding,
    backgroundColor: Colors.white,
    marginBottom: Spacing.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: Fonts.size['3xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.white,
  },
  availabilityBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
  },
  availabilityText: {
    fontSize: Fonts.size.xs,
    color: Colors.white,
    fontWeight: Fonts.weight.medium,
  },
  doctorName: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  specialization: {
    fontSize: Fonts.size.lg,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
    marginBottom: Spacing.xs,
  },
  hospital: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  ratingText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  aboutText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
  },
  educationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  educationText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  bottomSection: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
});
