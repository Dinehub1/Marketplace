/**
 * EmptyState Component
 * Displays a friendly message when content is empty
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title?: string;
    message: string;
    style?: ViewStyle;
}

export function EmptyState({
    icon = 'folder-open-outline',
    title,
    message,
    style,
}: EmptyStateProps) {
    const theme = useTheme();
    const { colors, spacing, typography } = theme;

    return (
        <View style={[styles.container, { padding: spacing[8] }, style]}>
            <Ionicons name={icon} size={64} color={colors.gray[300]} />
            {title && (
                <Text
                    style={[
                        styles.title,
                        {
                            color: colors.text.primary,
                            marginTop: spacing[4],
                            fontSize: typography.fontSize.xl,
                        },
                    ]}
                >
                    {title}
                </Text>
            )}
            <Text
                style={[
                    styles.message,
                    {
                        color: colors.text.secondary,
                        marginTop: spacing[2],
                        fontSize: typography.fontSize.md,
                    },
                ]}
            >
                {message}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontWeight: '600',
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
    },
});
