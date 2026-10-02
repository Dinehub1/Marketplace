import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface LoadingProps {
    color?: string;
    size?: 'small' | 'large';
}

export function LoadingSpinner({ color = '#8b5cf6', size = 'large' }: LoadingProps) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
});
