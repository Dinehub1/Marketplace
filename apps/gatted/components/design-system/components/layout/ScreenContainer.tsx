/**
 * ScreenContainer Component
 * A consistent screen wrapper with safe area handling
 */
import React, { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface ScreenContainerProps {
    children: ReactNode;
    style?: ViewStyle;
    scrollable?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    contentContainerStyle?: ViewStyle;
}

export function ScreenContainer({
    children,
    style,
    scrollable = false,
    refreshing = false,
    onRefresh,
    contentContainerStyle,
}: ScreenContainerProps) {
    const theme = useTheme();
    const { colors, spacing } = theme;

    const containerStyle = [
        styles.container,
        { backgroundColor: colors.background },
        style,
    ];

    if (scrollable) {
        return (
            <ScrollView
                style={containerStyle}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingHorizontal: spacing[5] },
                    contentContainerStyle,
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary[500]}
                        />
                    ) : undefined
                }
            >
                {children}
            </ScrollView>
        );
    }

    return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
});
