import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AnnouncementCard, PageHeader } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Announcement = {
    id: string;
    title: string;
    message: string;
    target_type: 'all' | 'role' | 'block' | 'unit' | null;
    created_at: string | null;
    expires_at: string | null;
    created_by: string | null;
    announcement_reads?: { id: string }[];
};

export default function AnnouncementsScreen() {
    const { profile, currentRole } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'unread' | 'all'>('unread');

    const loadAnnouncements = useCallback(async () => {
        try {
            if (!currentRole?.society_id || !profile?.id) return;

            const { data, error } = await supabase
                .from('announcements')
                .select(`
                    *,
                    announcement_reads!left(id)
                `)
                .eq('society_id', currentRole.society_id)
                .eq('announcement_reads.user_id', profile.id)
                .or(`target_type.eq.all,target_role.eq.resident`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            let filtered = data || [];
            if (filter === 'unread') {
                filtered = filtered.filter(a => !a.announcement_reads || a.announcement_reads.length === 0);
            }

            setAnnouncements(filtered);
        } catch (error) {
            console.error('Error loading announcements:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [currentRole?.society_id, profile?.id, filter]);

    useEffect(() => {
        loadAnnouncements();
    }, [currentRole?.society_id, profile?.id, filter, loadAnnouncements]);


    const onRefresh = () => {
        setRefreshing(true);
        loadAnnouncements();
    };

    const markAsRead = async (announcementId: string) => {
        try {
            if (!profile?.id) return;

            // Check if already read
            const announcement = announcements.find(a => a.id === announcementId);
            if (announcement?.announcement_reads && announcement.announcement_reads.length > 0) {
                return;
            }

            const { error } = await supabase
                .from('announcement_reads')
                .insert({
                    announcement_id: announcementId,
                    user_id: profile.id,
                    read_at: new Date().toISOString(),
                });

            if (error) throw error;

            // Update local state
            setAnnouncements(prev =>
                prev.map(a =>
                    a.id === announcementId
                        ? { ...a, announcement_reads: [{ id: 'temp' }] }
                        : a
                )
            );
        } catch (error) {
            console.error('Error marking announcement as read:', error);
        }
    };

    const renderAnnouncement = ({ item }: { item: Announcement }) => {
        const isRead = item.announcement_reads && item.announcement_reads.length > 0;

        return (
            <AnnouncementCard
                id={item.id}
                title={item.title}
                message={item.message}
                targetType={item.target_type || undefined}
                createdAt={item.created_at}
                expiresAt={item.expires_at}
                isRead={isRead}
                onMarkRead={() => markAsRead(item.id)}
            />
        );
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            <PageHeader title="Announcements" />

            <View style={styles.filterContainer}>
                {(['unread', 'all'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'unread' ? 'Unread' : 'All'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={announcements}
                keyExtractor={(item) => item.id}
                renderItem={renderAnnouncement}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="megaphone-outline"
                        title="No Announcements"
                        message={
                            filter === 'unread'
                                ? "You're all caught up!"
                                : 'No announcements yet'
                        }
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e2e8f0',
    },
    filterButtonActive: {
        backgroundColor: '#3b82f6',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
});
