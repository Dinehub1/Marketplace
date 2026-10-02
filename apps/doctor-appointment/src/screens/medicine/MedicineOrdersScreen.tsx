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
import { Colors, Fonts, Spacing } from '../../constants';

interface MedicineCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const medicineCategories: MedicineCategory[] = [
  {
    id: '1',
    title: 'Guide to medicine order',
    icon: 'medical-outline',
    color: Colors.primary,
  },
  {
    id: '2',
    title: 'Prescription related issues',
    icon: 'document-text-outline',
    color: Colors.primary,
  },
  {
    id: '3',
    title: 'Order status',
    icon: 'bag-outline',
    color: Colors.primary,
  },
  {
    id: '4',
    title: 'Order delivery',
    icon: 'car-outline',
    color: Colors.primary,
  },
  {
    id: '5',
    title: 'Payments & Refunds',
    icon: 'card-outline',
    color: Colors.primary,
  },
  {
    id: '6',
    title: 'Order returns',
    icon: 'return-up-back-outline',
    color: Colors.primary,
  },
];

export const MedicineOrdersScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to medicine order flow
    navigation.navigate('MedicineOrderFlow' as never);
  };

  const renderCategoryCard = (category: MedicineCategory) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(category.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
        <Ionicons name={category.icon} size={24} color={category.color} />
      </View>
      <Text style={styles.categoryTitle}>{category.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Medicines orders" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="search"
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories Grid */}
        <View style={styles.categoriesGrid}>
          {medicineCategories.map(renderCategoryCard)}
        </View>
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
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryTitle: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.normal * Fonts.size.sm,
  },
});
