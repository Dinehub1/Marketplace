import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

export interface SecondaryActionProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    style?: ViewStyle;
}

export function SecondaryAction({ icon, label, onPress, style }: SecondaryActionProps) {
    return (
        <TouchableOpacity style={[styles.action, style]} onPress={onPress} activeOpacity={0.7}>
            <Ionicons name={icon} size={24} color="#64748b" />
            <Text style={styles.label}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    label: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        marginLeft: 12,
    },
});
