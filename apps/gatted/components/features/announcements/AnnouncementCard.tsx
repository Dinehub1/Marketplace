import { getRelativeTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AnnouncementType = 'info' | 'warning' | 'urgent' | 'event';
type AnnouncementTarget = 'all' | 'role' | 'block' | 'unit';

export interface AnnouncementCardProps {
    id: string;
    title: string;
    message: string;
    type?: AnnouncementType;
    targetType?: AnnouncementTarget;
    createdAt: string | null;
    expiresAt?: string | null;
    createdBy?: string | null;
    isRead?: boolean;
    onPress?: () => void;
    onMarkRead?: () => void;
}

const typeConfig: Record<AnnouncementType, { color: string; bg: string; icon: string }> = {
    info: { color: '#3b82f6', bg: '#dbeafe', icon: 'information-circle' },
    warning: { color: '#f59e0b', bg: '#fef3c7', icon: 'warning' },
    urgent: { color: '#ef4444', bg: '#fee2e2', icon: 'alert-circle' },
    event: { color: '#8b5cf6', bg: '#ede9fe', icon: 'calendar' },
};

export function AnnouncementCard({
    id,
    title,
    message,
    type = 'info',
    targetType,
    createdAt,
    expiresAt,
    createdBy,
    isRead = false,
    onPress,
    onMarkRead,
}: AnnouncementCardProps) {
    const config = typeConfig[type] || typeConfig.info;

    return (
        <TouchableOpacity
            style={[styles.card, !isRead && styles.unread]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon as any} size={22} color={config.color} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.time}>{getRelativeTime(createdAt || '')}</Text>
                </View>
                {!isRead && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.message} numberOfLines={3}>
                {message}
            </Text>

            <View style={styles.footer}>
                {targetType && (
                    <View style={styles.targetBadge}>
                        <Ionicons name="people-outline" size={12} color="#64748b" />
                        <Text style={styles.targetText}>
                            {targetType === 'all' ? 'Everyone' : targetType}
                        </Text>
                    </View>
                )}

                {onMarkRead && !isRead && (
                    <TouchableOpacity
                        style={styles.markReadButton}
                        onPress={onMarkRead}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.markReadText}>Mark as read</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
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
    unread: {
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    time: {
        fontSize: 12,
        color: '#94a3b8',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
    },
    message: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    targetBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
    },
    targetText: {
        fontSize: 11,
        color: '#64748b',
        textTransform: 'capitalize',
    },
    markReadButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    markReadText: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '500',
    },
});
