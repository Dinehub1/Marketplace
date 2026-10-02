import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

export interface FormSectionProps {
    title?: string;
    children: React.ReactNode;
    style?: ViewStyle;
}

export function FormSection({ title, children, style }: FormSectionProps) {
    return (
        <View style={[styles.section, style]}>
            {title && <Text style={styles.title}>{title}</Text>}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },
});
