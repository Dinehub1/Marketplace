import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../../constants';
import { Card } from '../common/Card';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  rating: number;
  totalReviews: number;
  consultationFee: number;
  profileImage?: string;
  yearsOfExperience?: number;
  isAvailable?: boolean;
}

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  variant?: 'default' | 'compact';
  onBookAppointment?: () => void;
  showFavoriteButton?: boolean;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onPress,
  variant = 'default',
}) => {
  const {
    firstName,
    lastName,
    specialization,
    rating,
    totalReviews,
    consultationFee,
    profileImage,
    yearsOfExperience,
    isAvailable = true,
  } = doctor;

  const fullName = `Dr. ${firstName} ${lastName}`;

  if (variant === 'compact') {
    return (
      <Card onPress={onPress} style={styles.compactCard}>
        <View style={styles.compactContent}>
          <View style={styles.compactAvatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.compactAvatarImage} />
            ) : (
              <Text style={styles.compactAvatarText}>
                {firstName[0]}{lastName[0]}
              </Text>
            )}
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.compactSpecialty} numberOfLines={1}>
              {specialization}
            </Text>
            <View style={styles.compactRating}>
              <Ionicons name="star" size={12} color={Colors.warning} />
              <Text style={styles.compactRatingText}>
                {rating.toFixed(1)} ({totalReviews})
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.doctorInfo}>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {firstName[0]}{lastName[0]}
              </Text>
            )}
            {isAvailable && <View style={styles.availabilityIndicator} />}
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.specialty}>{specialization}</Text>
            {yearsOfExperience && (
              <Text style={styles.experience}>
                {yearsOfExperience} years experience
              </Text>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <View style={styles.rating}>
            <Ionicons name="star" size={16} color={Colors.warning} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.reviews}>({totalReviews} reviews)</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.fee}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeAmount}>${consultationFee}</Text>
        </View>
        <View style={styles.availability}>
          <View style={[
            styles.availabilityBadge,
            isAvailable ? styles.availableBadge : styles.unavailableBadge
          ]}>
            <Text style={[
              styles.availabilityText,
              isAvailable ? styles.availableText : styles.unavailableText
            ]}>
              {isAvailable ? 'Available' : 'Busy'}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  compactCard: {
    marginRight: Spacing.md,
    padding: Spacing.md,
    width: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  doctorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    position: 'relative',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
  },
  availabilityIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  specialty: {
    fontSize: Fonts.size.base,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  experience: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  actions: {
    alignItems: 'flex-end',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ratingText: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },
  reviews: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: Spacing.md,
  },
  fee: {
    flex: 1,
  },
  feeLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  feeAmount: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
  },
  availability: {
    alignItems: 'flex-end',
  },
  availabilityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
  },
  availableBadge: {
    backgroundColor: Colors.success + '20',
  },
  unavailableBadge: {
    backgroundColor: Colors.error + '20',
  },
  availabilityText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
  },
  availableText: {
    color: Colors.success,
  },
  unavailableText: {
    color: Colors.error,
  },
  // Compact variant styles
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  compactAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  compactAvatarText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  compactSpecialty: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  compactRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRatingText: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
});
