import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../../constants';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  backgroundColor?: string;
  titleColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightIcon,
  onRightIconPress,
  backgroundColor = Colors.white,
  titleColor = Colors.textPrimary,
}) => {
  return (
    <>
      <StatusBar
        barStyle={backgroundColor === Colors.white ? 'dark-content' : 'light-content'}
        backgroundColor={backgroundColor}
      />
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={titleColor}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSection}>
          {title && (
            <Text
              style={[styles.title, { color: titleColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={rightIcon}
                size={24}
                color={titleColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    paddingBottom: Spacing.md,
    minHeight: Platform.OS === 'ios' ? 88 : (StatusBar.currentHeight || 0) + 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: Spacing.sm,
    margin: -Spacing.sm,
  },
  title: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    textAlign: 'center',
  },
});
