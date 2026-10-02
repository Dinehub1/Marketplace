import { getRelativeTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ParcelStatus = 'received' | 'notified' | 'collected';

export interface ParcelCardProps {
    id: string;
    courierName: string | null;
    trackingNumber: string | null;
    unitNumber: string;
    status: ParcelStatus | string;
    createdAt: string | null;
    collectedAt: string | null;
    onCollect?: () => void;
    showActions?: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    received: { color: '#f59e0b', bg: '#fef3c7', icon: 'cube', label: 'Received' },
    notified: { color: '#3b82f6', bg: '#dbeafe', icon: 'notifications', label: 'Notified' },
    collected: { color: '#10b981', bg: '#d1fae5', icon: 'checkmark-circle', label: 'Collected' },
};

export function ParcelCard({
    id,
    courierName,
    trackingNumber,
    unitNumber,
    status,
    createdAt,
    collectedAt,
    onCollect,
    showActions = true,
}: ParcelCardProps) {
    const config = statusConfig[status] || statusConfig.received;
    const isCollected = status === 'collected';

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon as any} size={24} color={config.color} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.courier}>{courierName || 'Unknown Courier'}</Text>
                    <Text style={styles.unit}>Unit {unitNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
            </View>

            {trackingNumber && (
                <View style={styles.trackingContainer}>
                    <Ionicons name="barcode-outline" size={16} color="#64748b" />
                    <Text style={styles.trackingNumber}>{trackingNumber}</Text>
                </View>
            )}

            <View style={styles.footer}>
                <Text style={styles.date}>
                    {isCollected && collectedAt
                        ? `Collected ${getRelativeTime(collectedAt)}`
                        : `Received ${getRelativeTime(createdAt || '')}`}
                </Text>

                {showActions && !isCollected && onCollect && (
                    <TouchableOpacity style={styles.collectButton} onPress={onCollect}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.collectButtonText}>Mark Collected</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    courier: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    unit: {
        fontSize: 13,
        color: '#64748b',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    trackingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        marginBottom: 12,
    },
    trackingNumber: {
        fontSize: 13,
        color: '#475569',
        fontFamily: 'monospace',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    date: {
        fontSize: 12,
        color: '#94a3b8',
    },
    collectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    collectButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
});
