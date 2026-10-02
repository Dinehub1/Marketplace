import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { NotificationItem, PageHeader, SectionTitle } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/hooks/useNotifications';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

export function NotificationsScreen() {
    const { profile } = useAuth();
    const {
        notifications,
        unreadCount,
        isLoading,
        refresh,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications({ userId: profile?.id });

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    if (isLoading && !refreshing && notifications.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            <PageHeader
                title="Notifications"
                subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                rightAction={
                    unreadCount > 0
                        ? {
                            icon: 'checkmark-done-outline',
                            color: '#3b82f6',
                            onPress: markAllAsRead,
                        }
                        : undefined
                }
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
            >
                {notifications.length === 0 ? (
                    <EmptyState
                        icon="notifications-off-outline"
                        title="No Notifications"
                        message="You're all caught up! Check back later for updates."
                    />
                ) : (
                    <>
                        {unreadCount > 0 && <SectionTitle>New</SectionTitle>}
                        {notifications
                            .filter(n => !n.read)
                            .map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    id={notification.id}
                                    title={notification.title}
                                    message={notification.message}
                                    type={notification.type as any}
                                    read={notification.read}
                                    createdAt={notification.created_at}
                                    onMarkRead={() => markAsRead(notification.id)}
                                    onDelete={() => deleteNotification(notification.id)}
                                />
                            ))}

                        {notifications.some(n => n.read) && <SectionTitle>Earlier</SectionTitle>}
                        {notifications
                            .filter(n => n.read)
                            .map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    id={notification.id}
                                    title={notification.title}
                                    message={notification.message}
                                    type={notification.type as any}
                                    read={notification.read}
                                    createdAt={notification.created_at}
                                    onDelete={() => deleteNotification(notification.id)}
                                />
                            ))}
                    </>
                )}

                <View style={styles.spacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    spacer: {
        height: 40,
    },
});
