/**
 * SectionTitle Component
 * A consistent section heading
 */
import React, { ReactNode } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface SectionTitleProps {
    children: ReactNode;
    style?: TextStyle;
}

export function SectionTitle({ children, style }: SectionTitleProps) {
    const theme = useTheme();
    const { colors, spacing, typography } = theme;

    return (
        <Text
            style={[
                styles.title,
                {
                    color: colors.text.primary,
                    marginTop: spacing[5],
                    marginBottom: spacing[3],
                    fontSize: typography.fontSize.lg,
                },
                style,
            ]}
        >
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    title: {
        fontWeight: '600',
    },
});
