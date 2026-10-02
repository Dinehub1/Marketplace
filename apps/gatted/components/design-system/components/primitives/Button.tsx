/**
 * Button Component
 * A versatile button with multiple variants and sizes
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
    testID?: string;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    style,
    testID,
}: ButtonProps) {
    const theme = useTheme();
    const { colors, borderRadius, spacing } = theme;

    const variantStyles: Record<ButtonVariant, ViewStyle> = {
        primary: { backgroundColor: colors.primary[500] },
        secondary: { backgroundColor: colors.gray[100] },
        outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary[500] },
        ghost: { backgroundColor: 'transparent' },
        danger: { backgroundColor: colors.danger.main },
    };

    const textColors: Record<ButtonVariant, string> = {
        primary: colors.white,
        secondary: colors.gray[800],
        outline: colors.primary[500],
        ghost: colors.primary[500],
        danger: colors.white,
    };

    const sizeStyles: Record<ButtonSize, ViewStyle> = {
        sm: { paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
        md: { paddingHorizontal: spacing[6], paddingVertical: spacing[3] + 2 },
        lg: { paddingHorizontal: spacing[8], paddingVertical: spacing[4] + 2 },
    };

    const fontSizes: Record<ButtonSize, number> = {
        sm: 14,
        md: 16,
        lg: 18,
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { borderRadius: borderRadius.lg },
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            testID={testID}
        >
            {loading ? (
                <ActivityIndicator color={textColors[variant]} size="small" />
            ) : (
                <Text
                    style={[
                        styles.text,
                        { color: textColors[variant], fontSize: fontSizes[size] },
                        disabled && styles.disabledText,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontWeight: '600',
    },
    disabledText: {
        opacity: 0.7,
    },
});
