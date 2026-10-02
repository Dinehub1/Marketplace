import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActivityFeedItem, ActivityItemData } from './ActivityFeedItem';

interface ActivityFeedProps {
    activities: ActivityItemData[];
    maxItems?: number;
    isLoading?: boolean;
}

export function ActivityFeed({ activities, maxItems = 5, isLoading = false }: ActivityFeedProps) {
    const displayActivities = activities.slice(0, maxItems);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Loading activity...</Text>
                </View>
            </View>
        );
    }

    if (displayActivities.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={32} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No recent activity</Text>
                    <Text style={styles.emptySubtext}>Gate events will appear here</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {displayActivities.map((activity, index) => (
                <ActivityFeedItem
                    key={activity.id}
                    item={activity}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
    },
    emptySubtext: {
        fontSize: 12,
        color: '#cbd5e1',
        marginTop: 4,
    },
});
