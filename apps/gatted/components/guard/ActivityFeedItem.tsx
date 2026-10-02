import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ActivityType = 'check-in' | 'check-out' | 'parcel' | 'alert';

export interface ActivityItemData {
    id: string;
    type: ActivityType;
    title: string;
    subtitle: string;
    timestamp: Date;
}

interface ActivityFeedItemProps {
    item: ActivityItemData;
}

const typeConfig: Record<ActivityType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    'check-in': { icon: 'log-in-outline', color: '#10b981' },
    'check-out': { icon: 'log-out-outline', color: '#6366f1' },
    'parcel': { icon: 'cube-outline', color: '#f59e0b' },
    'alert': { icon: 'alert-circle-outline', color: '#ef4444' },
};

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function ActivityFeedItem({ item }: ActivityFeedItemProps) {
    const config = typeConfig[item.type];

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
                <Ionicons name={config.icon} size={18} color={config.color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
            </View>
            <Text style={styles.time}>{formatTimeAgo(item.timestamp)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    time: {
        fontSize: 11,
        color: '#94a3b8',
        marginLeft: 8,
    },
});
