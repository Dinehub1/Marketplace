import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

export type Notification = {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'visitor' | 'alert';
    read: boolean;
    created_at: string;
    metadata?: Record<string, any>;
};

type UseNotificationsOptions = {
    userId: string | null | undefined;
    limit?: number;
};

export function useNotifications({ userId, limit = 50 }: UseNotificationsOptions) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNotifications = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            setError(null);

            const { data, error: queryError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (queryError) throw queryError;

            const notifs = (data || []) as Notification[];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        } catch (err: any) {
            console.error('Error loading notifications:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId, limit]);

    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ read: true, updated_at: new Date().toISOString() })
                .eq('id', notificationId);

            if (updateError) throw updateError;

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            return true;
        } catch (err: any) {
            console.error('Error marking notification as read:', err);
            return false;
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return false;

        try {
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ read: true, updated_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('read', false);

            if (updateError) throw updateError;

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);

            return true;
        } catch (err: any) {
            console.error('Error marking all notifications as read:', err);
            return false;
        }
    }, [userId]);

    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (deleteError) throw deleteError;

            const notif = notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (notif && !notif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            return true;
        } catch (err: any) {
            console.error('Error deleting notification:', err);
            return false;
        }
    }, [notifications]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        refresh: loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };
}
