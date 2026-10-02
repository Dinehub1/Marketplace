/**
 * LoadingSpinner Component
 * A centered loading indicator
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface LoadingSpinnerProps {
    color?: string;
    size?: 'small' | 'large';
    style?: ViewStyle;
    fullScreen?: boolean;
}

export function LoadingSpinner({
    color,
    size = 'large',
    style,
    fullScreen = true,
}: LoadingSpinnerProps) {
    const theme = useTheme();
    const spinnerColor = color || theme.colors.primary[500];
    const backgroundColor = theme.colors.background;

    return (
        <View
            style={[
                fullScreen ? styles.fullScreen : styles.inline,
                { backgroundColor: fullScreen ? backgroundColor : 'transparent' },
                style,
            ]}
        >
            <ActivityIndicator size={size} color={spinnerColor} />
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inline: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
});
