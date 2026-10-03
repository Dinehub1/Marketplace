import { PageHeader, SectionTitle } from '@/components';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Unit = {
    id: string;
    unit_number: string;
    floor: number | null;
    block_id: string | null;
    is_archived?: boolean;
    is_assigned?: boolean;
};

type Block = {
    id: string;
    name: string;
    society_id: string | null;
};

export default function BlockUnits() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [block, setBlock] = useState<Block | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);


    const fetchData = useCallback(async () => {
        try {
            // Fetch block info
            const { data: blockData } = await supabase
                .from('blocks')
                .select('id, name, society_id')
                .eq('id', id)
                .single();

            setBlock(blockData);

            // Fetch units
            const { data: unitsData } = await supabase
                .from('units')
                .select('*')
                .eq('block_id', id)
                .order('floor', { ascending: true })
                .order('unit_number', { ascending: true });

            // Check if units have residents assigned
            const unitsWithAssignment = await Promise.all(
                (unitsData || []).map(async (unit) => {
                    const { count } = await supabase
                        .from('unit_residents')
                        .select('id', { count: 'exact', head: true })
                        .eq('unit_id', unit.id);
                    return { ...unit, is_assigned: (count || 0) > 0 };
                })
            );

            setUnits(unitsWithAssignment);
        } catch (error) {
            console.error('Error fetching units:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, fetchData]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Group units by floor
    const floorGroups = units.reduce((acc, unit) => {
        const floor = unit.floor || 0;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(unit);
        return acc;
    }, {} as Record<number, Unit[]>);

    const sortedFloors = Object.keys(floorGroups)
        .map(Number)
        .sort((a, b) => a - b);

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
                <Ionicons name="home-outline" size={48} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No units in this block</Text>
            <Text style={styles.emptySubtitle}>
                Units can be added from the Blocks screen.
            </Text>
        </View>
    );

    const renderUnitRow = (unit: Unit) => (
        <View key={unit.id} style={styles.unitRow}>
            <View style={styles.unitInfo}>
                <View style={[styles.unitIcon, { backgroundColor: unit.is_assigned ? '#d1fae5' : '#f1f5f9' }]}>
                    <Ionicons name="home" size={18} color={unit.is_assigned ? '#059669' : '#94a3b8'} />
                </View>
                <Text style={styles.unitNumber}>{unit.unit_number}</Text>
            </View>
            <Text style={styles.floorLabel}>Floor {unit.floor || 0}</Text>
            <View style={styles.assignmentStatus}>
                {unit.is_assigned ? (
                    <>
                        <Ionicons name="checkmark-circle" size={18} color="#059669" />
                        <Text style={styles.assignedText}>Assigned</Text>
                    </>
                ) : (
                    <Text style={styles.unassignedText}>Unassigned</Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <PageHeader
                title={block?.name || 'Loading...'}
                subtitle="Units"
                showBack
                onBack={() => router.back()}
            />

            {/* Info Banner - Read Only */}
            <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#64748b" />
                <Text style={styles.infoBannerText}>
                    Units are read-only in this view. Editing is not available in MVP.
                </Text>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                        contentContainerStyle={units.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
                    >
                        {units.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <>
                                <View style={styles.sectionHeader}>
                                    <SectionTitle>Units ({units.length})</SectionTitle>
                                </View>

                                {/* Summary Stats */}
                                <View style={styles.summaryCard}>
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{units.length}</Text>
                                        <Text style={styles.summaryLabel}>Total Units</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Text style={[styles.summaryValue, { color: '#059669' }]}>
                                            {units.filter(u => u.is_assigned).length}
                                        </Text>
                                        <Text style={styles.summaryLabel}>Assigned</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Text style={[styles.summaryValue, { color: '#94a3b8' }]}>
                                            {units.filter(u => !u.is_assigned).length}
                                        </Text>
                                        <Text style={styles.summaryLabel}>Vacant</Text>
                                    </View>
                                </View>

                                {/* Units grouped by floor */}
                                {sortedFloors.map(floor => (
                                    <View key={floor} style={styles.floorSection}>
                                        <Text style={styles.floorHeader}>Floor {floor}</Text>
                                        <View style={styles.floorUnits}>
                                            {floorGroups[floor].map(renderUnitRow)}
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fef3c7',
        borderRadius: 8,
        gap: 8,
    },
    infoBannerText: { flex: 1, fontSize: 13, color: '#92400e' },
    content: { flex: 1, paddingHorizontal: 20, marginTop: 16 },
    sectionHeader: { marginBottom: 12 },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
    summaryLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
    summaryDivider: { width: 1, backgroundColor: '#e2e8f0' },
    floorSection: { marginBottom: 20 },
    floorHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    floorUnits: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    unitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    unitInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    unitIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unitNumber: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    floorLabel: { fontSize: 13, color: '#94a3b8', marginRight: 16 },
    assignmentStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    assignedText: { fontSize: 13, color: '#059669', fontWeight: '500' },
    unassignedText: { fontSize: 13, color: '#94a3b8' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIcon: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
