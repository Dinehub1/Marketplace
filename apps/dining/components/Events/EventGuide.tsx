import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PremiumColors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface GuideItem {
  icon: string;
  title: string;
  value: string;
}

interface EventGuideProps {
  guideItems: GuideItem[];
}

export const EventGuide: React.FC<EventGuideProps> = ({ guideItems }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!guideItems || guideItems.length === 0) {
    return null;
  }

  // Group items into columns of 3 (vertical stacks)
  const columns: GuideItem[][] = [];
  for (let i = 0; i < guideItems.length; i += 3) {
    columns.push(guideItems.slice(i, i + 3));
  }

  // Calculate proper width for cards with padding
  const SECTION_HORIZONTAL_PADDING = 20;
  const CARD_SPACING = 20; // Space between cards when scrolling
  const cardWidth = width - (SECTION_HORIZONTAL_PADDING * 2);

  return (
    <Animated.View style={[styles.eventGuideSection, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>Event Guide</Text>
      <View style={styles.scrollViewWrapper}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={styles.guideScrollContainer}
          style={styles.scrollView}
        >
          {columns.map((column, columnIndex) => (
            <View
              key={columnIndex}
              style={[
                styles.guideColumn,
                { 
                  width: cardWidth,
                  marginRight: columnIndex < columns.length - 1 ? CARD_SPACING : 0,
                }
              ]}
            >
              {column.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.guideItem}>
                  <LinearGradient
                    colors={['rgba(30, 30, 35, 0.9)', 'rgba(20, 20, 25, 0.9)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.guideIconContainer}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={PremiumColors.text.secondary} 
                    />
                  </LinearGradient>
                  <View style={styles.guideContent}>
                    <Text style={styles.guideTitle}>{item.title}</Text>
                    <Text style={styles.guideValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  eventGuideSection: {
    backgroundColor: PremiumColors.background.primary,
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  scrollViewWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    overflow: 'visible',
  },
  guideScrollContainer: {
    paddingHorizontal: 20,
  },
  guideColumn: {
    gap: 15,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(32, 32, 32, 0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  guideIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 2,
  },
  guideValue: {
    fontSize: 13,
    color: PremiumColors.text.tertiary,
  },
});

