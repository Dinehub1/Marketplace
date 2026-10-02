/**
 * ListItem Component
 * A versatile list item with icon and chevron
 */
import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface ListItemProps {
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBackgroundColor?: string;
    title: string;
    subtitle?: string;
    rightContent?: ReactNode;
    showChevron?: boolean;
    onPress?: () => void;
    style?: ViewStyle;
}

export function ListItem({
    icon,
    iconColor,
    iconBackgroundColor,
    title,
    subtitle,
    rightContent,
    showChevron = true,
    onPress,
    style,
}: ListItemProps) {
    const theme = useTheme();
    const { colors, borderRadius, spacing, typography } = theme;

    const content = (
        <>
            {icon && (
                <View
                    style={[
                        styles.iconContainer,
                        {
                            backgroundColor: iconBackgroundColor || colors.gray[100],
                            borderRadius: borderRadius.md,
                            marginRight: spacing[3],
                        },
                    ]}
                >
                    <Ionicons name={icon} size={20} color={iconColor || colors.primary[500]} />
                </View>
            )}
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text.primary, fontSize: typography.fontSize.lg }]}>
                    {title}
                </Text>
                {subtitle && (
                    <Text
                        style={[
                            styles.subtitle,
                            { color: colors.text.secondary, marginTop: spacing[0] + 2, fontSize: typography.fontSize.md },
                        ]}
                    >
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightContent}
            {showChevron && onPress && (
                <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            )}
        </>
    );

    const containerStyle = [
        styles.container,
        {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing[4],
            marginBottom: spacing[3],
        },
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontWeight: '500',
    },
    subtitle: {},
});
