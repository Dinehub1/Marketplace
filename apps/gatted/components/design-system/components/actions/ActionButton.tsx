/**
 * ActionButton Component
 * A prominent action button with icon, title, and subtitle.
 * Card-style: white surface with a tinted icon chip per variant.
 * The `primary` variant gets the navy + neon brand hero treatment.
 * Supports compact variant for secondary actions.
 */
import { Branding } from '@/constants/branding';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type ActionButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info';

export interface ActionButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    badge?: number | string;
    variant?: ActionButtonVariant;
    backgroundColor?: string;
    onPress: () => void;
    style?: ViewStyle;
    iconSize?: number;
    /** Compact mode: 56px height, smaller icons, no subtitle */
    compact?: boolean;
}

const brand = Branding.colors;

export function ActionButton({
    icon,
    title,
    subtitle,
    badge,
    variant = 'primary',
    backgroundColor,
    onPress,
    style,
    iconSize,
    compact = false,
}: ActionButtonProps) {
    const theme = useTheme();
    const { colors, borderRadius, spacing, shadows, typography } = theme;

    // Per-variant icon chip tint (light background + saturated icon)
    const chipColors: Record<ActionButtonVariant, { bg: string; icon: string }> = {
        primary: { bg: 'rgba(163, 230, 53, 0.15)', icon: brand.neon },
        success: { bg: colors.success.light, icon: colors.success.dark },
        danger: { bg: colors.danger.light, icon: colors.danger.dark },
        warning: { bg: colors.warning.light, icon: colors.warning.dark },
        info: { bg: colors.info.light, icon: colors.info.dark },
    };

    const isHero = variant === 'primary' && !backgroundColor;
    const chip = chipColors[variant];

    const cardBg = backgroundColor || (isHero ? brand.navyLight : colors.white);
    const onCard = backgroundColor || isHero;
    const titleColor = onCard ? brand.textOnDark : colors.text.primary;
    const subtitleColor = isHero ? brand.mutedOnDark : onCard ? 'rgba(255,255,255,0.9)' : colors.text.secondary;
    const chevronColor = isHero ? brand.neon : onCard ? '#fff' : colors.gray[400];

    // Compact mode dimensions
    const buttonIconSize = iconSize ?? (compact ? 20 : 26);
    const buttonPadding = compact ? spacing[3] : spacing[4];
    const buttonRadius = compact ? borderRadius.lg : borderRadius.xl;
    const buttonMinHeight = compact ? 56 : 90;
    const chipSize = compact ? 40 : 52;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                shadows.md,
                {
                    backgroundColor: cardBg,
                    borderRadius: buttonRadius,
                    padding: buttonPadding,
                    marginBottom: spacing[2],
                    minHeight: buttonMinHeight,
                    borderWidth: 1,
                    borderColor: isHero ? 'rgba(163, 230, 53, 0.25)' : onCard ? 'transparent' : colors.gray[200],
                },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View
                style={[
                    styles.iconChip,
                    {
                        width: chipSize,
                        height: chipSize,
                        borderRadius: compact ? 12 : 16,
                        backgroundColor: backgroundColor ? 'rgba(255,255,255,0.18)' : chip.bg,
                        marginRight: compact ? spacing[3] : spacing[4],
                    },
                ]}
            >
                <Ionicons
                    name={icon}
                    size={buttonIconSize}
                    color={backgroundColor ? '#fff' : chip.icon}
                />
            </View>
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={[
                        styles.title,
                        {
                            color: titleColor,
                            fontSize: compact ? typography.fontSize.lg : typography.fontSize.xl,
                            marginBottom: compact ? 0 : 4,
                        }
                    ]}>
                        {title}
                    </Text>
                    {badge !== undefined && badge !== 0 && (
                        <View style={[
                            styles.badge,
                            {
                                marginLeft: spacing[2],
                                backgroundColor: onCard ? 'rgba(255, 255, 255, 0.25)' : chip.bg,
                            },
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                {
                                    fontSize: typography.fontSize.sm,
                                    color: onCard ? '#fff' : chip.icon,
                                },
                            ]}>{badge}</Text>
                        </View>
                    )}
                </View>
                {!compact && subtitle && (
                    <Text style={[styles.subtitle, { color: subtitleColor, fontSize: typography.fontSize.md }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={compact ? 20 : 24} color={chevronColor} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconChip: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontWeight: 'bold',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontWeight: '600',
    },
    subtitle: {},
});
