import { getRelativeTime } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NotificationType = 'info' | 'warning' | 'success' | 'visitor' | 'alert' | 'parcel';

export interface NotificationItemProps {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    createdAt: string;
    onPress?: () => void;
    onMarkRead?: () => void;
    onDelete?: () => void;
}

const typeConfig: Record<NotificationType, { icon: string; color: string; bg: string }> = {
    info: { icon: 'information-circle', color: '#3b82f6', bg: '#dbeafe' },
    warning: { icon: 'warning', color: '#f59e0b', bg: '#fef3c7' },
    success: { icon: 'checkmark-circle', color: '#10b981', bg: '#d1fae5' },
    visitor: { icon: 'person', color: '#8b5cf6', bg: '#ede9fe' },
    alert: { icon: 'alert-circle', color: '#ef4444', bg: '#fee2e2' },
    parcel: { icon: 'cube', color: '#f97316', bg: '#ffedd5' },
};

export function NotificationItem({
    id,
    title,
    message,
    type,
    read,
    createdAt,
    onPress,
    onMarkRead,
    onDelete,
}: NotificationItemProps) {
    const config = typeConfig[type] || typeConfig.info;

    return (
        <TouchableOpacity
            style={[styles.container, !read && styles.unread]}
            onPress={() => {
                if (!read && onMarkRead) onMarkRead();
                if (onPress) onPress();
            }}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon as any} size={20} color={config.color} />
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, !read && styles.titleUnread]} numberOfLines={1}>
                        {title}
                    </Text>
                    {!read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>
                    {message}
                </Text>
                <Text style={styles.time}>{getRelativeTime(createdAt)}</Text>
            </View>

            {onDelete && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={onDelete}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={18} color="#94a3b8" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    unread: {
        backgroundColor: '#f8fafc',
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
        flex: 1,
    },
    titleUnread: {
        fontWeight: '600',
        color: '#1e293b',
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3b82f6',
        marginLeft: 8,
    },
    message: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginBottom: 6,
    },
    time: {
        fontSize: 11,
        color: '#94a3b8',
    },
    deleteButton: {
        padding: 4,
        marginLeft: 8,
    },
});
