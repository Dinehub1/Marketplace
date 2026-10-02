import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Colors, Fonts, Spacing } from '../../constants';

interface HealthPackage {
  id: string;
  title: string;
  subtitle: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  testsIncluded: number;
  image: string;
  features: string[];
}

const healthPackages: HealthPackage[] = [
  {
    id: '1',
    title: 'Advanced Young Indian Health Checkup',
    subtitle: 'Ideal for individuals aged 21-40 years',
    originalPrice: 358,
    discountedPrice: 330,
    discount: 35,
    testsIncluded: 69,
    image: '🩺',
    features: ['Free home Sample pickup', 'Practo associate labs', 'E-Reports in 24-72 hours', 'Free follow-up with a doctor'],
  },
  {
    id: '2',
    title: "Working Women's Health Checkup",
    subtitle: 'Ideal for individuals aged 21-40 years',
    originalPrice: 387,
    discountedPrice: 345,
    discount: 35,
    testsIncluded: 119,
    image: '👩‍⚕️',
    features: ['Free home Sample pickup', 'Practo associate labs', 'E-Reports in 24-72 hours', 'Free follow-up with a doctor'],
  },
  {
    id: '3',
    title: 'Active Professional Health Checkup',
    subtitle: 'Ideal for individuals aged 21-40 years',
    originalPrice: 457,
    discountedPrice: 411,
    discount: 35,
    testsIncluded: 100,
    image: '🏥',
    features: ['Free home Sample pickup', 'Practo associate labs', 'E-Reports in 24-72 hours', 'Free follow-up with a doctor'],
  },
];

export const DiagnosticsPackagesScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBookNow = (packageId: string) => {
    navigation.navigate('DiagnosticsBooking' as never);
  };

  const renderFeatureItem = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>✓</Text>
      </View>
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  const renderPackageCard = (pkg: HealthPackage) => (
    <View key={pkg.id} style={styles.packageCard}>
      {/* Package Header */}
      <View style={styles.packageHeader}>
        <Text style={styles.packageTitle}>{pkg.title}</Text>
        <Text style={styles.packageSubtitle}>{pkg.subtitle}</Text>
        
        <View style={styles.testsInfo}>
          <Text style={styles.testsCount}>{pkg.testsIncluded} tests included</Text>
        </View>
      </View>

      {/* Package Image */}
      <View style={styles.packageImageContainer}>
        <View style={styles.packageImage}>
          <Text style={styles.packageEmoji}>{pkg.image}</Text>
        </View>
      </View>

      {/* Package Pricing */}
      <View style={styles.packagePricing}>
        <Text style={styles.originalPrice}>${pkg.originalPrice}</Text>
        <Text style={styles.discountedPrice}>${pkg.discountedPrice}</Text>
        <Text style={styles.discount}>{pkg.discount}% off</Text>
      </View>
      <Text style={styles.healthCashback}>+ 10% Health cashback T&C</Text>

      {/* Features */}
      <View style={styles.featuresContainer}>
        {pkg.features.map(renderFeatureItem)}
      </View>

      {/* Book Button */}
      <Button
        title="Book Now"
        onPress={() => handleBookNow(pkg.id)}
        style={styles.bookButton}
        fullWidth
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Diagnostics Tests" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Get Full body health checkups</Text>
        <Text style={styles.headerSubtitle}>from the comfort of your home.</Text>
        <Text style={styles.offerText}>Upto 45% off + get 10% healthcash back</Text>
        
        {/* Feature Pills */}
        <View style={styles.featurePills}>
          <View style={[styles.featurePill, { backgroundColor: Colors.info }]}>
            <Text style={styles.featurePillIcon}>🏠</Text>
            <Text style={styles.featurePillText}>Free home Sample pickup</Text>
          </View>
          <View style={[styles.featurePill, { backgroundColor: Colors.error }]}>
            <Text style={styles.featurePillIcon}>👨‍⚕️</Text>
            <Text style={styles.featurePillText}>Practo associate labs</Text>
          </View>
          <View style={[styles.featurePill, { backgroundColor: Colors.warning }]}>
            <Text style={styles.featurePillIcon}>📊</Text>
            <Text style={styles.featurePillText}>E-Reports in 24-72 hours</Text>
          </View>
          <View style={[styles.featurePill, { backgroundColor: Colors.success }]}>
            <Text style={styles.featurePillIcon}>💬</Text>
            <Text style={styles.featurePillText}>Free follow-up with a doctor</Text>
          </View>
        </View>
      </View>

      {/* Recommended Section */}
      <View style={styles.recommendedSection}>
        <Text style={styles.sectionTitle}>Recommend for you</Text>
      </View>

      <ScrollView style={styles.packagesContainer} showsVerticalScrollIndicator={false}>
        {healthPackages.map(renderPackageCard)}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  offerText: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
    marginBottom: Spacing.xs,
  },
  featurePillIcon: {
    fontSize: 12,
    marginRight: Spacing.xs,
  },
  featurePillText: {
    fontSize: Fonts.size.xs,
    color: Colors.white,
    fontWeight: Fonts.weight.medium,
  },
  recommendedSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
  },
  packagesContainer: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  packageCard: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  packageHeader: {
    marginBottom: Spacing.md,
  },
  packageTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  packageSubtitle: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  testsInfo: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  testsCount: {
    fontSize: Fonts.size.xs,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  packageImageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  packageImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageEmoji: {
    fontSize: 40,
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  originalPrice: {
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: Spacing.sm,
  },
  discountedPrice: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  discount: {
    fontSize: Fonts.size.sm,
    color: Colors.success,
    fontWeight: Fonts.weight.medium,
  },
  healthCashback: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  featuresContainer: {
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  featureIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  featureIconText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: Fonts.weight.bold,
  },
  featureText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
  },
});
