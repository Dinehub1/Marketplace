import { AnnouncementCard } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Announcement = {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'urgent' | 'event';
    target_type: 'all' | 'role' | 'block' | 'unit' | null;
    created_at: string;
    expires_at: string | null;
};

export default function AnnouncementsManager() {
    const { currentRole } = useAuth();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadAnnouncements = useCallback(async () => {
        try {
            const societyId = currentRole?.society_id;
            if (!societyId) return;

            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('society_id', societyId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedData: Announcement[] = (data || []).map((item: any) => ({
                id: item.id,
                title: item.title,
                message: item.message,
                type: (item.type || 'info') as Announcement['type'],
                target_type: (item.target_type || null) as Announcement['target_type'],
                created_at: item.created_at || new Date().toISOString(),
                expires_at: item.expires_at
            }));

            setAnnouncements(mappedData);
        } catch (error) {
            console.error('Error loading announcements:', error);
            Alert.alert('Error', 'Failed to load announcements');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [currentRole?.society_id]);

    useFocusEffect(
        useCallback(() => {
            loadAnnouncements();
        }, [loadAnnouncements])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadAnnouncements();
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Delete Announcement',
            'Are you sure you want to remove this announcement?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('announcements')
                                .update({ is_active: false })
                                .eq('id', id);

                            if (error) throw error;

                            // Optimistic update
                            setAnnouncements(prev => prev.filter(a => a.id !== id));
                        } catch (error) {
                            console.error('Error deleting announcement:', error);
                            Alert.alert('Error', 'Failed to delete announcement');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Announcements</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
            >
                {announcements.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="megaphone-outline" size={64} color="#94a3b8" />
                        <Text style={styles.emptyTitle}>No Announcements</Text>
                        <Text style={styles.emptyText}>
                            Create an announcement to notify residents.
                        </Text>
                    </View>
                ) : (
                    announcements.map(item => (
                        <View key={item.id} style={styles.cardWrapper}>
                            <AnnouncementCard
                                id={item.id}
                                title={item.title}
                                message={item.message}
                                type={item.type}
                                targetType={item.target_type || undefined}
                                createdAt={item.created_at}
                                expiresAt={item.expires_at}
                                isRead={true} // Managers see standard style
                                onPress={() => { }} // Could open details/edit
                            />
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDelete(item.id)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
                <View style={styles.spacer} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(manager)/create-announcement')}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        maxWidth: '80%',
    },
    cardWrapper: {
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        top: 12, // Adjust based on card padding
        right: 12,
        backgroundColor: '#fee2e2', // Light red bg
        padding: 8,
        borderRadius: 20,
        zIndex: 10,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    spacer: {
        height: 80, // for FAB
    },
});
