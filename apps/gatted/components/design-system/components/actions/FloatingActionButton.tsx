/**
 * FloatingActionButton Component
 * A floating button for primary actions
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface FloatingActionButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
    backgroundColor?: string;
    size?: 'sm' | 'md' | 'lg';
    position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
    style?: ViewStyle;
}

export function FloatingActionButton({
    icon,
    onPress,
    color,
    backgroundColor,
    size = 'md',
    position = 'bottom-right',
    style,
}: FloatingActionButtonProps) {
    const theme = useTheme();
    const { colors, shadows } = theme;

    const sizeStyles = {
        sm: { width: 48, height: 48, iconSize: 20 },
        md: { width: 56, height: 56, iconSize: 24 },
        lg: { width: 64, height: 64, iconSize: 28 },
    };

    const positionStyles: Record<string, ViewStyle> = {
        'bottom-right': { bottom: 24, right: 24 },
        'bottom-left': { bottom: 24, left: 24 },
        'bottom-center': { bottom: 24, left: '50%', marginLeft: -(sizeStyles[size].width / 2) },
    };

    const { width, height, iconSize } = sizeStyles[size];

    return (
        <TouchableOpacity
            style={[
                styles.fab,
                shadows.lg,
                {
                    backgroundColor: backgroundColor || colors.primary[500],
                    width,
                    height,
                    borderRadius: width / 2,
                },
                positionStyles[position],
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons name={icon} size={iconSize} color={color || colors.white} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
