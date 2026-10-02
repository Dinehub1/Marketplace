import { PageHeader } from '@/components';
import { Card, StatusBadge } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Issue = {
    id: string;
    title: string;
    description: string | null;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'rejected';
    created_at: string | null;
    updated_at: string | null;
};

const priorityConfig = {
    low: { color: '#10b981', bg: '#d1fae5', label: 'Low' },
    medium: { color: '#f59e0b', bg: '#fef3c7', label: 'Medium' },
    high: { color: '#ef4444', bg: '#fee2e2', label: 'High' },
    urgent: { color: '#dc2626', bg: '#fecaca', label: 'Urgent' },
};

export default function MyIssuesScreen() {
    const { profile } = useAuth();
    const router = useRouter();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

    const loadIssues = useCallback(async () => {
        try {
            if (!profile?.id) return;

            let query = supabase
                .from('issues')
                .select('*')
                .eq('reported_by', profile.id)
                .order('created_at', { ascending: false });

            if (filter === 'open') {
                query = query.in('status', ['open', 'in-progress']);
            } else if (filter === 'resolved') {
                query = query.in('status', ['resolved', 'closed']);
            }

            const { data, error } = await query;

            if (error) throw error;
            setIssues(data || []);
        } catch (error) {
            console.error('Error loading issues:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [profile?.id, filter]);

    useEffect(() => {
        loadIssues();
    }, [profile?.id, filter, loadIssues]);


    const onRefresh = () => {
        setRefreshing(true);
        loadIssues();
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderIssue = ({ item }: { item: Issue }) => {
        const priority = priorityConfig[item.priority] || priorityConfig.medium;

        return (
            <View style={styles.issueCard}>
                <Card>
                    <View style={styles.issueHeader}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.issueTitle} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={styles.category}>{item.category}</Text>
                        </View>
                        <StatusBadge status={item.status} />
                    </View>

                    {item.description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}

                    <View style={styles.footer}>
                        <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                            <Text style={[styles.priorityText, { color: priority.color }]}>
                                {priority.label}
                            </Text>
                        </View>
                        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                    </View>
                </Card>
            </View>
        );
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            <PageHeader
                title="My Issues"
                rightAction={{
                    icon: 'add-circle-outline',
                    color: '#3b82f6',
                    onPress: () => router.push('/(resident)/raise-issue'),
                }}
            />

            <View style={styles.filterContainer}>
                {(['all', 'open', 'resolved'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={issues}
                keyExtractor={(item) => item.id}
                renderItem={renderIssue}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="construct-outline"
                        title="No Issues Found"
                        message={filter === 'all'
                            ? "You haven't reported any issues yet"
                            : `No ${filter} issues`}
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
    issueCard: {
        marginBottom: 12,
    },
    issueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    titleContainer: {
        flex: 1,
        marginRight: 12,
    },
    issueTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    category: {
        fontSize: 12,
        color: '#64748b',
        textTransform: 'capitalize',
    },
    description: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 12,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    date: {
        fontSize: 12,
        color: '#94a3b8',
    },
});
