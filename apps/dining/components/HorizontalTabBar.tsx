import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PremiumColors } from '../constants/Colors';

export interface TabItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface HorizontalTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const HorizontalTabBar: React.FC<HorizontalTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, index === 0 && styles.firstTab]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? PremiumColors.accent.primary : PremiumColors.text.tertiary}
              />
              <Text style={[
                styles.tabLabel,
                isActive ? styles.activeTabLabel : styles.inactiveTabLabel
              ]}>
                {tab.label.toUpperCase()}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    position: 'relative',
  },
  firstTab: {
    marginLeft: 0,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  activeTabLabel: {
    color: PremiumColors.accent.primary,
  },
  inactiveTabLabel: {
    color: PremiumColors.text.tertiary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: PremiumColors.accent.primary,
    borderRadius: 1,
  },
});

