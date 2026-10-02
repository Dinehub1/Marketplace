/**
 * StatRow Component
 * A horizontal container for stat cards
 */
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface StatRowProps {
    children: ReactNode;
    style?: ViewStyle;
}

export function StatRow({ children, style }: StatRowProps) {
    const theme = useTheme();
    const { spacing } = theme;

    return (
        <View
            style={[
                styles.container,
                { gap: spacing[3], marginBottom: spacing[4] },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
});
