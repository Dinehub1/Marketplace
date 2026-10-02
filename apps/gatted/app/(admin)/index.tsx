import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
    ActionButton,
    PageHeader,
    SectionTitle,
    StatCard,
    StatRow,
} from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

type Stats = {
    totalUsers: number;
    totalSocieties: number;
    activeGuards: number;
    openIssues: number;
};

export default function AdminHome() {
    const { signOut, profile } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalSocieties: 0, activeGuards: 0, openIssues: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        try {
            // Get total users count
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Get total societies count
            const { count: societiesCount } = await supabase
                .from('societies')
                .select('*', { count: 'exact', head: true });

            // Get active guards count
            const { count: guardsCount } = await supabase
                .from('user_roles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'guard')
                .eq('is_active', true);

            // Get open issues count
            const { count: issuesCount } = await supabase
                .from('issues')
                .select('*', { count: 'exact', head: true })
                .in('status', ['open', 'in-progress']);

            setStats({
                totalUsers: usersCount || 0,
                totalSocieties: societiesCount || 0,
                activeGuards: guardsCount || 0,
                openIssues: issuesCount || 0,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const handleComingSoon = (feature: string) => {
        Alert.alert('Coming Soon', `${feature} will be available in a future update.`);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            <PageHeader
                greeting="Admin Dashboard"
                title={profile?.full_name || 'Admin'}
                subtitle="System Management"
                rightAction={{
                    icon: 'log-out-outline',
                    color: '#ef4444',
                    onPress: signOut,
                }}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
                }
            >
                <SectionTitle>System Overview</SectionTitle>

                <StatRow>
                    <StatCard
                        icon="people-outline"
                        iconColor="#8b5cf6"
                        value={stats.totalUsers}
                        label="Total Users"
                        backgroundColor="#ede9fe"
                    />
                    <StatCard
                        icon="business-outline"
                        iconColor="#3b82f6"
                        value={stats.totalSocieties}
                        label="Societies"
                        backgroundColor="#dbeafe"
                    />
                </StatRow>

                <StatRow>
                    <StatCard
                        icon="shield-checkmark-outline"
                        iconColor="#10b981"
                        value={stats.activeGuards}
                        label="Active Guards"
                        backgroundColor="#d1fae5"
                    />
                    <StatCard
                        icon="warning-outline"
                        iconColor="#f59e0b"
                        value={stats.openIssues}
                        label="Open Issues"
                        backgroundColor="#fef3c7"
                    />
                </StatRow>

                <SectionTitle>Quick Actions</SectionTitle>

                <ActionButton
                    icon="person-add-outline"
                    title="Manage Users"
                    subtitle="Add, edit, or deactivate users"
                    variant="primary"
                    onPress={() => router.push('/(admin)/manage-users')}
                />

                <ActionButton
                    icon="business-outline"
                    title="Manage Societies"
                    subtitle="Configure societies and settings"
                    variant="success"
                    onPress={() => router.push('/(admin)/manage-units')}
                />

                <ActionButton
                    icon="stats-chart-outline"
                    title="View Reports"
                    subtitle="Analytics and insights"
                    variant="info"
                    onPress={() => handleComingSoon('View Reports')}
                />

                <ActionButton
                    icon="settings-outline"
                    title="System Settings"
                    subtitle="Configure app preferences"
                    backgroundColor="#64748b"
                    onPress={() => handleComingSoon('System Settings')}
                />

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
