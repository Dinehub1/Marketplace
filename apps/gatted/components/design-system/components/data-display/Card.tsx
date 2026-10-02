/**
 * Card Component
 * A basic card container
 */
import React, { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
    const theme = useTheme();
    const { colors, borderRadius, spacing, shadows } = theme;

    const variantStyles: Record<string, ViewStyle> = {
        default: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
        },
        elevated: {
            backgroundColor: colors.surface,
            ...shadows.md,
        },
        outlined: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border,
        },
    };

    const cardStyle = [
        styles.card,
        {
            borderRadius: borderRadius.lg,
            padding: spacing[4],
        },
        variantStyles[variant],
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {},
});
