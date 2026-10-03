import { Card, CardHeader, StatusBadge } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Issue = {
    id: string;
    title: string;
    description: string | null;
    category: string;
    priority: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'rejected';
    created_at: string | null;
    unit?: {
        unit_number: string;
    } | null;
    reporter?: {
        full_name: string | null;
    } | null;
};

export default function IssuesScreen() {
    const { currentRole } = useAuth();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'open' | 'in-progress'>('open');

    const loadIssues = useCallback(async () => {
        try {
            const societyId = currentRole?.society_id;
            if (!societyId) return;

            let query = supabase
                .from('issues')
                .select(`
                    id,
                    title,
                    description,
                    category,
                    priority,
                    status,
                    created_at,
                    unit:units(unit_number),
                    reporter:profiles!issues_reported_by_fkey(full_name)
                `)
                .eq('society_id', societyId)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
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
    }, [currentRole?.society_id, filter]);

    useEffect(() => {
        loadIssues();
    }, [currentRole?.society_id, filter, loadIssues]);


    const onRefresh = () => {
        setRefreshing(true);
        loadIssues();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return '#ef4444';
            case 'medium':
                return '#f59e0b';
            case 'low':
                return '#10b981';
            default:
                return '#64748b';
        }
    };

    const handleStatusUpdate = (issue: Issue) => {
        Alert.alert(
            'Update Status',
            `Change status for "${issue.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'In Progress',
                    onPress: () => updateIssueStatus(issue.id, 'in-progress'),
                },
                {
                    text: 'Resolve',
                    onPress: () => updateIssueStatus(issue.id, 'resolved'),
                },
                {
                    text: 'Close',
                    onPress: () => updateIssueStatus(issue.id, 'closed'),
                    style: 'destructive',
                },
            ]
        );
    };

    const updateIssueStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('issues')
                .update({
                    status: newStatus as 'open' | 'in-progress' | 'resolved' | 'closed' | 'rejected',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;
            showSuccess(`Issue marked as ${newStatus}`);
            loadIssues();
        } catch (error: any) {
            console.error('Error updating status:', error);
            showError(error.message || 'Failed to update status');
        }
    };

    const renderIssue = ({ item }: { item: Issue }) => (
        <TouchableOpacity onPress={() => handleStatusUpdate(item)} activeOpacity={0.7}>
            <Card>
                <CardHeader
                    title={item.title}
                    subtitle={`${item.category} • Unit ${item.unit?.unit_number || 'N/A'}`}
                    icon="construct-outline"
                    iconColor={getPriorityColor(item.priority)}
                />
                <View style={styles.issueDetails}>
                    {item.description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}
                    <View style={styles.metaRow}>
                        <View style={styles.priorityBadge}>
                            <Ionicons name="flag" size={12} color={getPriorityColor(item.priority)} />
                            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                                {item.priority.toUpperCase()}
                            </Text>
                        </View>
                        <StatusBadge status={item.status as 'open' | 'in-progress' | 'resolved' | 'closed' | 'rejected'} variant="issue" />
                    </View>
                    {item.reporter && (
                        <Text style={styles.reporter}>Reported by: {item.reporter.full_name}</Text>
                    )}
                    <Text style={styles.hintText}>Tap to update status</Text>
                </View>
            </Card>
        </TouchableOpacity>
    );

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Issues</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'open' && styles.filterTabActive]}
                    onPress={() => setFilter('open')}
                >
                    <Text style={[styles.filterText, filter === 'open' && styles.filterTextActive]}>
                        Open
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'in-progress' && styles.filterTabActive]}
                    onPress={() => setFilter('in-progress')}
                >
                    <Text style={[styles.filterText, filter === 'in-progress' && styles.filterTextActive]}>
                        In Progress
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Issues List */}
            <FlatList
                data={issues}
                renderItem={renderIssue}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
                }
                ListEmptyComponent={
                    <EmptyState
                        title="No Issues"
                        message={`No ${filter === 'all' ? '' : filter} issues found`}
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
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 8,
        backgroundColor: '#fff',
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    filterTabActive: {
        backgroundColor: '#ef4444',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 20,
        flexGrow: 1,
    },
    issueDetails: {
        gap: 8,
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '600',
    },
    reporter: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    hintText: {
        fontSize: 10,
        color: '#3b82f6',
        marginTop: 8,
        textAlign: 'right',
        fontStyle: 'italic',
    },
});
