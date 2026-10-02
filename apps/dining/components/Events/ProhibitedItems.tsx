import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PremiumColors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface ProhibitedItem {
  name: string;
  icon?: string;
}

interface ProhibitedItemsProps {
  items: ProhibitedItem[];
}

export const ProhibitedItems: React.FC<ProhibitedItemsProps> = ({ items }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  // Split items into two rows for better layout
  const halfLength = Math.ceil(items.length / 2);
  const firstRow = items.slice(0, halfLength);
  const secondRow = items.slice(halfLength);

  const ItemRow = ({ rowItems }: { rowItems: ProhibitedItem[] }) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowContainer}
      style={styles.scrollView}
    >
      {rowItems.map((item, index) => (
        <View key={index} style={styles.prohibitedItem}>
          <Ionicons
            name={(item.icon || 'close-circle-outline') as any}
            size={14}
            color={PremiumColors.error}
          />
          <Text style={styles.prohibitedText} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <Animated.View style={[styles.prohibitedSection, { opacity: fadeAnim }]}>
      <View style={styles.headerContainer}>
        <Ionicons name="alert-circle-outline" size={18} color={PremiumColors.text.secondary} />
        <Text style={styles.sectionTitle}>Prohibited Items</Text>
      </View>
      
      <View style={styles.gridContainer}>
        <ItemRow rowItems={firstRow} />
        {secondRow.length > 0 && <ItemRow rowItems={secondRow} />}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  prohibitedSection: {
    backgroundColor: PremiumColors.background.primary,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  gridContainer: {
    gap: 10,
  },
  scrollView: {
    overflow: 'visible',
  },
  rowContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  prohibitedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32, 32, 32, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(170, 170, 170, 0.15)',
    gap: 8,
    maxWidth: width * 0.5,
  },
  prohibitedText: {
    fontSize: 12,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
  },
});

