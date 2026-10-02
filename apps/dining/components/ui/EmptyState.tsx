import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  variant?: 'default' | 'restaurants' | 'events' | 'bookings' | 'search';
}

export function EmptyState({ 
  icon = 'information-circle-outline', 
  title, 
  description, 
  actionText, 
  onAction,
  variant = 'default'
}: EmptyStateProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'restaurants':
        return {
          icon: 'restaurant-outline' as keyof typeof Ionicons.glyphMap,
          iconColor: '#FF6B35',
          backgroundColor: '#FFF5F2',
        };
      case 'events':
        return {
          icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
          iconColor: '#9C27B0',
          backgroundColor: '#F3E5F5',
        };
      case 'bookings':
        return {
          icon: 'bookmark-outline' as keyof typeof Ionicons.glyphMap,
          iconColor: '#2196F3',
          backgroundColor: '#E3F2FD',
        };
      case 'search':
        return {
          icon: 'search-outline' as keyof typeof Ionicons.glyphMap,
          iconColor: '#757575',
          backgroundColor: '#F5F5F5',
        };
      default:
        return {
          icon: icon,
          iconColor: '#757575',
          backgroundColor: '#F5F5F5',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: variantStyles.backgroundColor }]}>
        <Ionicons 
          name={variantStyles.icon} 
          size={48} 
          color={variantStyles.iconColor} 
        />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      {actionText && onAction && (
        <View style={styles.actionContainer}>
          <Button
            onPress={onAction}
            variant="default"
            size="default"
            style={styles.actionButton}
          >
            {actionText}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    minHeight: 300,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 280,
  },
  actionButton: {
    paddingVertical: 16,
  },
});