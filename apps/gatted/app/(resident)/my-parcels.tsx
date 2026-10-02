import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader, ParcelCard } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Parcel = {
    id: string;
    courier_name: string | null;
    tracking_number: string | null;
    status: string | null;
    created_at: string | null;
    collected_at: string | null;
    unit?: { unit_number: string } | null;
};

export default function MyParcelsScreen() {
    const { currentRole } = useAuth();
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'collected'>('all');

    const loadParcels = useCallback(async () => {
        try {
            if (!currentRole?.unit_id) return;

            let query = supabase
                .from('parcels')
                .select('*, unit:units(unit_number)')
                .eq('unit_id', currentRole.unit_id)
                .order('created_at', { ascending: false });

            if (filter === 'pending') {
                query = query.in('status', ['received', 'notified']);
            } else if (filter === 'collected') {
                query = query.eq('status', 'collected');
            }

            const { data, error } = await query;

            if (error) throw error;
            setParcels(data || []);
        } catch (error) {
            console.error('Error loading parcels:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [currentRole?.unit_id, filter]);

    useEffect(() => {
        loadParcels();
    }, [currentRole?.unit_id, filter, loadParcels]);


    const onRefresh = () => {
        setRefreshing(true);
        loadParcels();
    };

    const renderParcel = ({ item }: { item: Parcel }) => (
        <ParcelCard
            id={item.id}
            courierName={item.courier_name}
            trackingNumber={item.tracking_number}
            unitNumber={item.unit?.unit_number || 'N/A'}
            status={item.status || 'received'}
            createdAt={item.created_at}
            collectedAt={item.collected_at}
            showActions={false}
        />
    );

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <View style={styles.container}>
            <PageHeader title="My Parcels" />

            <View style={styles.filterContainer}>
                {(['all', 'pending', 'collected'] as const).map((f) => (
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
                data={parcels}
                keyExtractor={(item) => item.id}
                renderItem={renderParcel}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="cube-outline"
                        title="No Parcels"
                        message={
                            filter === 'all'
                                ? "You haven't received any parcels yet"
                                : filter === 'pending'
                                    ? 'No pending parcels'
                                    : 'No collected parcels'
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
        backgroundColor: '#f97316',
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
