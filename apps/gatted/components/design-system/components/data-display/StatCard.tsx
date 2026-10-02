/**
 * StatCard Component
 * A compact card for displaying statistics with an icon (horizontal layout).
 * White surface with a tinted icon chip — `backgroundColor` tints the chip.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    value: number | string;
    label: string;
    backgroundColor: string;
    style?: ViewStyle;
}

export function StatCard({
    icon,
    iconColor,
    value,
    label,
    backgroundColor,
    style,
}: StatCardProps) {
    const theme = useTheme();
    const { colors, spacing, typography } = theme;

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.white,
                    borderColor: colors.gray[200],
                    borderRadius: 14,
                    paddingVertical: spacing[3],
                    paddingHorizontal: spacing[3],
                },
                style,
            ]}
        >
            <View style={styles.topRow}>
                <View style={[styles.iconChip, { backgroundColor }]}>
                    <Ionicons name={icon} size={16} color={iconColor} />
                </View>
                <Text
                    style={[
                        styles.value,
                        {
                            color: colors.text.primary,
                            marginLeft: spacing[2],
                            fontSize: typography.fontSize['2xl'],
                        },
                    ]}
                >
                    {value}
                </Text>
            </View>
            <Text
                style={[
                    styles.label,
                    {
                        color: colors.text.secondary,
                        marginTop: spacing[1],
                        fontSize: typography.fontSize.xs,
                    },
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minHeight: 52,
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconChip: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontWeight: 'bold',
    },
    label: {
        fontWeight: '500',
    },
});
