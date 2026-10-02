import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { DiagnosticPackage } from '../../services/mockData';
import { Button } from '../common/Button';

interface TestPackageCardProps {
  package: DiagnosticPackage;
  onBookNow?: () => void;
  onViewDetails?: () => void;
  isSelected?: boolean;
  showBookButton?: boolean;
}

export const TestPackageCard: React.FC<TestPackageCardProps> = ({
  package: pkg,
  onBookNow,
  onViewDetails,
  isSelected = false,
  showBookButton = true,
}) => {
  const renderPopularBadge = () => {
    if (!pkg.isPopular) return null;

    return (
      <View style={styles.popularBadge}>
        <Text style={styles.popularText}>POPULAR</Text>
      </View>
    );
  };

  const renderPackageImage = () => (
    <View style={styles.imageContainer}>
      <View style={styles.packageImage}>
        <Text style={styles.packageEmoji}>{pkg.imageUrl}</Text>
      </View>
      {renderPopularBadge()}
    </View>
  );

  const renderPricing = () => (
    <View style={styles.pricingContainer}>
      <View style={styles.priceRow}>
        <Text style={styles.originalPrice}>${pkg.originalPrice}</Text>
        <Text style={styles.discountedPrice}>${pkg.discountedPrice}</Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{pkg.discount}% off</Text>
        </View>
      </View>
      <Text style={styles.savingsText}>
        You save ${pkg.originalPrice - pkg.discountedPrice}
      </Text>
    </View>
  );

  const renderTestsInfo = () => (
    <View style={styles.testsContainer}>
      <View style={styles.testsInfo}>
        <Ionicons name="flask" size={16} color={Colors.primary} />
        <Text style={styles.testsText}>
          {pkg.testsIncluded} tests included
        </Text>
      </View>
      <View style={styles.durationInfo}>
        <Ionicons name="time" size={16} color={Colors.textSecondary} />
        <Text style={styles.durationText}>
          {pkg.duration} • Reports in {pkg.reportDelivery}
        </Text>
      </View>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.featuresContainer}>
      {pkg.features.slice(0, 3).map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
      {pkg.features.length > 3 && (
        <TouchableOpacity
          style={styles.viewMoreFeatures}
          onPress={onViewDetails}
        >
          <Text style={styles.viewMoreText}>
            +{pkg.features.length - 3} more features
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      {onViewDetails && (
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={onViewDetails}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      )}
      {showBookButton && onBookNow && (
        <Button
          title="Book Now"
          onPress={onBookNow}
          style={styles.bookButton}
          size="small"
        />
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={onViewDetails}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{pkg.title}</Text>
          <Text style={styles.subtitle}>{pkg.subtitle}</Text>
        </View>
        {renderPackageImage()}
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {pkg.description}
      </Text>

      {renderTestsInfo()}
      {renderPricing()}
      {renderFeatures()}
      {renderActions()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  containerSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '05',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  packageImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageEmoji: {
    fontSize: 24,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
  },
  popularText: {
    fontSize: Fonts.size.xs,
    fontWeight: Fonts.weight.bold,
    color: Colors.white,
  },
  testsContainer: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  testsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  testsText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.primary,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  durationText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  pricingContainer: {
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  originalPrice: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
  },
  discountBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
  },
  discountText: {
    fontSize: Fonts.size.xs,
    fontWeight: Fonts.weight.bold,
    color: Colors.white,
  },
  savingsText: {
    fontSize: Fonts.size.sm,
    color: Colors.success,
    fontWeight: Fonts.weight.medium,
  },
  featuresContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  viewMoreFeatures: {
    paddingLeft: Spacing.lg + Spacing.sm,
  },
  viewMoreText: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.primary,
  },
  bookButton: {
    flex: 1,
  },
});
