import { Card } from '@/components/Card';
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
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type VisitorStats = {
    total: number;
    today: number;
    pending: number;
};

type IssueStats = {
    total: number;
    open: number;
    inProgress: number;
};

export default function ManagerHome() {
    const router = useRouter();
    const { profile, currentRole } = useAuth();

    const [visitorStats, setVisitorStats] = useState<VisitorStats>({ total: 0, today: 0, pending: 0 });
    const [issueStats, setIssueStats] = useState<IssueStats>({ total: 0, open: 0, inProgress: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = useCallback(async () => {
        try {
            const societyId = currentRole?.society_id;
            if (!societyId) return;

            // Load visitor stats
            const { data: visitors } = await supabase
                .from('visitors')
                .select('id, status, created_at')
                .eq('society_id', societyId);

            const today = new Date().toISOString().split('T')[0];
            const todayVisitors = visitors?.filter(v => v.created_at?.startsWith(today)) || [];
            const pendingVisitors = visitors?.filter(v => v.status === 'pending') || [];

            setVisitorStats({
                total: visitors?.length || 0,
                today: todayVisitors.length,
                pending: pendingVisitors.length,
            });

            // Load issue stats
            const { data: issues } = await supabase
                .from('issues')
                .select('id, status')
                .eq('society_id', societyId);

            setIssueStats({
                total: issues?.length || 0,
                open: issues?.filter(i => i.status === 'open').length || 0,
                inProgress: issues?.filter(i => i.status === 'in-progress').length || 0,
            });

        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [currentRole?.society_id]);

    useEffect(() => {
        loadStats();
    }, [currentRole?.society_id, loadStats]);


    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            <PageHeader
                greeting="Manager Dashboard"
                title={profile?.full_name || 'Manager'}
                subtitle={currentRole?.society?.name || 'Society'}
                secondaryRightAction={{
                    icon: 'notifications-outline',
                    color: '#64748b',
                    onPress: () => router.push('/(manager)/notifications'),
                }}
                rightAction={{
                    icon: 'person-circle-outline',
                    color: '#3b82f6',
                    onPress: () => router.push('/(manager)/profile'),
                }}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
                }
            >
                <SectionTitle>Overview</SectionTitle>

                <StatRow>
                    <StatCard
                        icon="people-outline"
                        iconColor="#8b5cf6"
                        value={visitorStats.today}
                        label="Today's Visitors"
                        backgroundColor="#ede9fe"
                    />
                    <StatCard
                        icon="time-outline"
                        iconColor="#f59e0b"
                        value={visitorStats.pending}
                        label="Pending"
                        backgroundColor="#fef3c7"
                    />
                </StatRow>

                <StatRow>
                    <StatCard
                        icon="build-outline"
                        iconColor="#ef4444"
                        value={issueStats.open}
                        label="Open Issues"
                        backgroundColor="#fee2e2"
                    />
                    <StatCard
                        icon="construct-outline"
                        iconColor="#3b82f6"
                        value={issueStats.inProgress}
                        label="In Progress"
                        backgroundColor="#dbeafe"
                    />
                </StatRow>

                <SectionTitle>Quick Actions</SectionTitle>

                <ActionButton
                    icon="megaphone"
                    title="Manage Announcements"
                    variant="info"
                    onPress={() => router.push('/(manager)/announcements')}
                />

                <ActionButton
                    icon="clipboard-outline"
                    title="View All Visitors"
                    variant="success"
                    onPress={() => router.push('/(manager)/visitors')}
                />

                <ActionButton
                    icon="list-outline"
                    title="Manage Issues"
                    variant="danger"
                    onPress={() => router.push('/(manager)/issues')}
                />

                <ActionButton
                    icon="business-outline"
                    title="Manage Units"
                    variant="primary"
                    onPress={() => Alert.alert('Coming Soon', 'Unit management will be available in a future update.')}
                />

                <SectionTitle>Recent Activity</SectionTitle>
                <Card>
                    <Text style={styles.activityText}>No recent activity</Text>
                </Card>

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
    activityText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
    },
    spacer: {
        height: 40,
    },
});
