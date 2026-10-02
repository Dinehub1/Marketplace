import { Card, CardHeader, StatusBadge } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Visitor = {
    id: string;
    visitor_name: string;
    visitor_type: string | null;
    status: string;
    expected_date: string | null;
    expected_time?: string | null;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    unit?: {
        unit_number: string;
    } | null;
};

export default function VisitorsScreen() {
    const { currentRole } = useAuth();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('today');

    const loadVisitors = useCallback(async () => {
        try {
            const societyId = currentRole?.society_id;
            if (!societyId) return;

            let query = supabase
                .from('visitors')
                .select(`
                    id,
                    visitor_name,
                    visitor_type,
                    status,
                    expected_date,
                    expected_time,
                    checked_in_at,
                    checked_out_at,
                    unit:units(unit_number)
                `)
                .eq('society_id', societyId)
                .order('created_at', { ascending: false });

            if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                query = query.eq('expected_date', today);
            } else if (filter === 'pending') {
                query = query.eq('status', 'pending');
            }

            const { data, error } = await query;

            if (error) throw error;
            setVisitors(data || []);
        } catch (error) {
            console.error('Error loading visitors:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [currentRole?.society_id, filter]);

    useEffect(() => {
        loadVisitors();
    }, [currentRole?.society_id, filter, loadVisitors]);


    const onRefresh = () => {
        setRefreshing(true);
        loadVisitors();
    };

    const renderVisitor = ({ item }: { item: Visitor }) => (
        <Card>
            <CardHeader
                title={item.visitor_name}
                subtitle={`Unit: ${item.unit?.unit_number || 'N/A'}`}
                icon="person-outline"
                iconColor="#8b5cf6"
            />
            <View style={styles.visitorDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{item.visitor_type}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{item.expected_date}</Text>
                </View>
                {item.expected_time && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Time:</Text>
                        <Text style={styles.detailValue}>{item.expected_time}</Text>
                    </View>
                )}
                <View style={styles.statusRow}>
                    <StatusBadge status={item.status} variant="visitor" />
                </View>
            </View>
        </Card>
    );

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Visitors</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'today' && styles.filterTabActive]}
                    onPress={() => setFilter('today')}
                >
                    <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>
                        Today
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
                        Pending
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

            {/* Visitor List */}
            <FlatList
                data={visitors}
                renderItem={renderVisitor}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
                }
                ListEmptyComponent={
                    <EmptyState
                        title="No Visitors"
                        message={`No ${filter === 'all' ? '' : filter} visitors found`}
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
        backgroundColor: '#8b5cf6',
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
    visitorDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    detailValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    statusRow: {
        marginTop: 8,
    },
});
