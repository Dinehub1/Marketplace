import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ShiftStatusBadgeProps {
    isActive: boolean;
    duration?: string; // e.g., "2h 14m"
}

export function ShiftStatusBadge({ isActive, duration }: ShiftStatusBadgeProps) {
    return (
        <View style={[styles.badge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <View style={[styles.dot, isActive ? styles.activeDot : styles.inactiveDot]} />
            <Text style={[styles.text, isActive ? styles.activeText : styles.inactiveText]}>
                {isActive ? `Active${duration ? ` • ${duration}` : ''}` : 'Off Duty'}
            </Text>
            {isActive && <Ionicons name="time-outline" size={14} color="#A3E635" style={styles.icon} />}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    activeBadge: {
        backgroundColor: 'rgba(163, 230, 53, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(163, 230, 53, 0.35)',
    },
    inactiveBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    activeDot: {
        backgroundColor: '#A3E635',
    },
    inactiveDot: {
        backgroundColor: '#8B97AD',
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
    },
    activeText: {
        color: '#A3E635',
    },
    inactiveText: {
        color: '#B7C0D1',
    },
    icon: {
        marginLeft: 4,
    },
});
