/**
 * PageHeader Component
 * A consistent header for all screen types.
 * Dark navy hero treatment matching the GATTED brand (neon-G icon).
 */
import { Branding } from '@/constants/branding';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface HeaderAction {
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    onPress: () => void;
}

export interface PageHeaderProps {
    greeting?: string;
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: HeaderAction;
    secondaryRightAction?: HeaderAction;
    style?: ViewStyle;
}

const brand = Branding.colors;

// Muted grays passed by older screens disappear on the dark header; lift them.
function onDarkColor(color?: string, fallback: string = brand.textOnDark): string {
    if (!color) return fallback;
    const dim = ['#64748b', '#475569', '#334155', '#1e293b', '#94a3b8'];
    return dim.includes(color.toLowerCase()) ? fallback : color;
}

export function PageHeader({
    greeting,
    title,
    subtitle,
    showBack,
    onBack,
    rightAction,
    secondaryRightAction,
    style,
}: PageHeaderProps) {
    const theme = useTheme();
    const { spacing } = theme;

    return (
        <LinearGradient
            colors={brand.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.header,
                {
                    paddingHorizontal: spacing[5],
                    paddingTop: 56,
                    paddingBottom: spacing[5],
                },
                style,
            ]}
        >
            {showBack && (
                <TouchableOpacity onPress={onBack} style={[styles.backButton, { marginRight: spacing[3] }]}>
                    <Ionicons name="arrow-back" size={20} color={brand.textOnDark} />
                </TouchableOpacity>
            )}
            <View style={styles.headerLeft}>
                {greeting && (
                    <Text style={styles.greeting}>{greeting}</Text>
                )}
                <Text style={[styles.title, { marginTop: spacing[1] }]}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={[styles.subtitle, { marginTop: spacing[0] + 2 }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {secondaryRightAction && (
                <TouchableOpacity onPress={secondaryRightAction.onPress} style={styles.actionButton}>
                    <Ionicons
                        name={secondaryRightAction.icon}
                        size={20}
                        color={onDarkColor(secondaryRightAction.color)}
                    />
                </TouchableOpacity>
            )}
            {rightAction && (
                <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton}>
                    <Ionicons
                        name={rightAction.icon}
                        size={20}
                        color={onDarkColor(rightAction.color, brand.neon)}
                    />
                </TouchableOpacity>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(163, 230, 53, 0.18)',
    },
    headerLeft: {
        flex: 1,
    },
    backButton: {
        padding: 4,
    },
    greeting: {
        fontSize: 13,
        color: Branding.colors.mutedOnDark,
        letterSpacing: 0.4,
    },
    title: {
        fontSize: 21,
        fontWeight: '700',
        color: Branding.colors.textOnDark,
    },
    subtitle: {
        fontSize: 14,
        color: Branding.colors.mutedOnDark,
    },
    actionButton: {
        padding: 9,
        marginLeft: 8,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.10)',
    },
});
