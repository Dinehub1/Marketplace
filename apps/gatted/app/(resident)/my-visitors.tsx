import { Card, CardHeader, StatusBadge } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Visitor = {
    id: string;
    visitor_name: string;
    visitor_type: string | null;
    status: string;
    expected_date: string | null;
    expected_time?: string | null;
    otp?: string | null;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
};

export default function MyVisitorsScreen() {
    const router = useRouter();
    const { profile } = useAuth();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    const loadVisitors = useCallback(async () => {
        try {
            const userId = profile?.id;
            if (!userId) return;

            const now = new Date().toISOString().split('T')[0];

            let query = supabase
                .from('visitors')
                .select('*')
                .eq('host_id', userId)
                .order('expected_date', { ascending: false });

            if (filter === 'upcoming') {
                query = query.gte('expected_date', now);
            } else {
                query = query.lt('expected_date', now);
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
    }, [profile?.id, filter]);

    useEffect(() => {
        loadVisitors();
    }, [profile?.id, filter, loadVisitors]);


    const onRefresh = () => {
        setRefreshing(true);
        loadVisitors();
    };

    const handleCancelVisitor = async (visitorId: string) => {
        Alert.alert(
            'Cancel Visitor',
            'Are you sure you want to cancel this visitor?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('visitors')
                                .update({ status: 'denied' as const })
                                .eq('id', visitorId);

                            if (error) throw error;

                            loadVisitors();
                            Alert.alert('Success', 'Visitor cancelled');
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const renderVisitor = ({ item }: { item: Visitor }) => (
        <Card>
            <CardHeader
                title={item.visitor_name}
                subtitle={`${item.visitor_type} • ${item.expected_date}${item.expected_time ? ` ${item.expected_time}` : ''}`}
                icon="person-outline"
                iconColor="#3b82f6"
            />
            <View style={styles.visitorDetails}>
                {item.otp && (
                    <View style={styles.otpRow}>
                        <Text style={styles.label}>OTP:</Text>
                        <Text style={styles.otpText}>{item.otp}</Text>
                    </View>
                )}
                <View style={styles.statusRow}>
                    <StatusBadge status={item.status} variant="visitor" />
                </View>
                {item.status === 'approved' && filter === 'upcoming' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelVisitor(item.id)}
                    >
                        <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                )}
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Visitors</Text>
                <TouchableOpacity
                    onPress={() => router.push('/(resident)/pre-approve-visitor')}
                    style={styles.addButton}
                >
                    <Ionicons name="add-circle" size={28} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'upcoming' && styles.filterTabActive]}
                    onPress={() => setFilter('upcoming')}
                >
                    <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
                        Upcoming
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'past' && styles.filterTabActive]}
                    onPress={() => setFilter('past')}
                >
                    <Text style={[styles.filterText, filter === 'past' && styles.filterTextActive]}>
                        Past
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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
                ListEmptyComponent={
                    <EmptyState
                        title={`No ${filter} visitors`}
                        message="Pre-approve a visitor to get started"
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    addButton: {
        padding: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 8,
        backgroundColor: '#fff',
    },
    filterTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    filterTabActive: {
        backgroundColor: '#3b82f6',
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
    otpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
    },
    label: {
        fontSize: 14,
        color: '#64748b',
        marginRight: 8,
    },
    otpText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3b82f6',
        letterSpacing: 2,
    },
    statusRow: {
        marginTop: 8,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        marginTop: 8,
        gap: 4,
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '500',
    },
});
