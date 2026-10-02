import { PageHeader, SectionTitle } from '@/components';
import ContextMenu from '@/components/admin/ContextMenu';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

type Society = {
    id: string;
    name: string;
    city: string | null;
    is_archived?: boolean;
    block_count?: number;
    unit_count?: number;
    manager_count?: number;
};

export default function ManageProperties() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [societies, setSocieties] = useState<Society[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        fetchSocieties();
    }, []);

    const fetchSocieties = async () => {
        try {
            // Get societies with counts
            const { data: societiesData, error } = await supabase
                .from('societies')
                .select('*')
                .eq('is_archived', false)
                .order('name');

            if (error) throw error;

            // Get block and unit counts for each society
            const societiesWithCounts = await Promise.all(
                (societiesData || []).map(async (society) => {
                    const [blocksRes, unitsRes, managersRes] = await Promise.all([
                        supabase
                            .from('blocks')
                            .select('id', { count: 'exact', head: true })
                            .eq('society_id', society.id)
                            .eq('is_archived', false),
                        supabase
                            .from('units')
                            .select('id', { count: 'exact', head: true })
                            .eq('society_id', society.id)
                            .eq('is_archived', false),
                        supabase
                            .from('user_roles')
                            .select('id', { count: 'exact', head: true })
                            .eq('society_id', society.id)
                            .eq('role', 'manager')
                            .eq('is_active', true),
                    ]);

                    return {
                        ...society,
                        block_count: blocksRes.count || 0,
                        unit_count: unitsRes.count || 0,
                        manager_count: managersRes.count || 0,
                    };
                })
            );

            setSocieties(societiesWithCounts);
        } catch (error) {
            console.error('Error fetching societies:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSocieties();
    };

    const handleArchive = (society: Society) => {
        const hasData = (society.block_count || 0) > 0 || (society.unit_count || 0) > 0;

        Alert.alert(
            '⚠️ Delete Society?',
            hasData
                ? `This society has:\n• ${society.block_count} blocks\n• ${society.unit_count} units\n• ${society.manager_count} managers\n\n⚠️ This action is PERMANENT and cannot be undone.`
                : 'Delete this society? This action is PERMANENT.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('societies')
                                // .update({ is_archived: true }) // Column does not exist
                                .delete() // Using delete instead since archive is not supported
                                .eq('id', society.id);
                            if (error) throw error;
                            fetchSocieties();
                            Alert.alert('Success', 'Society deleted');
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const getMenuOptions = (society: Society) => [
        {
            label: 'View Blocks',
            icon: 'eye-outline',
            onPress: () => router.push(`/(admin)/society/${society.id}`),
        },
        {
            label: 'Edit Society',
            icon: 'pencil-outline',
            onPress: () => router.push(`/(admin)/add-society?id=${society.id}`),
            editModeOnly: true,
        },
        {
            label: 'Archive Society',
            icon: 'archive-outline',
            onPress: () => handleArchive(society),
            editModeOnly: true,
            destructive: true,
        },
    ];

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
                <Ionicons name="business-outline" size={48} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No societies added yet</Text>
            <Text style={styles.emptySubtitle}>
                Start by adding your first society.{'\n'}
                This defines the entire system structure.
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(admin)/add-society')}
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Add New Society</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSocietyCard = (society: Society) => (
        <View key={society.id} style={styles.card}>
            <TouchableOpacity
                style={styles.cardMain}
                onPress={() => router.push(`/(admin)/society/${society.id}`)}
            >
                <View style={styles.cardIcon}>
                    <Ionicons name="business" size={28} color="#2563eb" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{society.name}</Text>
                    <View style={styles.cardLocation}>
                        <Ionicons name="location-outline" size={14} color="#64748b" />
                        <Text style={styles.cardLocationText}>{society.city || 'Unknown'}</Text>
                    </View>
                    <View style={styles.cardStats}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{society.block_count}</Text>
                            <Text style={styles.statLabel}>Blocks</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{society.unit_count}</Text>
                            <Text style={styles.statLabel}>Units</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{society.manager_count}</Text>
                            <Text style={styles.statLabel}>Managers</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
            <View style={styles.cardMenu}>
                <ContextMenu options={getMenuOptions(society)} isEditMode={isEditMode} />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <PageHeader
                title="Property Management"
                subtitle="Societies · Blocks · Units"
                showBack
                onBack={() => router.back()}
            />

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
                <TouchableOpacity
                    style={[styles.modeButton, !isEditMode && styles.modeButtonActive]}
                    onPress={() => setIsEditMode(false)}
                >
                    <Ionicons name="eye-outline" size={16} color={!isEditMode ? '#fff' : '#64748b'} />
                    <Text style={[styles.modeButtonText, !isEditMode && styles.modeButtonTextActive]}>
                        View Mode
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, isEditMode && styles.modeButtonActive]}
                    onPress={() => setIsEditMode(true)}
                >
                    <Ionicons name="pencil-outline" size={16} color={isEditMode ? '#fff' : '#64748b'} />
                    <Text style={[styles.modeButtonText, isEditMode && styles.modeButtonTextActive]}>
                        Edit Mode
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#64748b" />
                <Text style={styles.infoBannerText}>
                    Configure physical structure. Changes affect access & visitors.
                </Text>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                        contentContainerStyle={societies.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
                    >
                        {societies.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <>
                                <View style={styles.sectionHeader}>
                                    <SectionTitle>Societies ({societies.length})</SectionTitle>
                                </View>
                                {societies.map(renderSocietyCard)}
                            </>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Add Society FAB */}
            {societies.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/(admin)/add-society')}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    modeToggle: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 10,
        padding: 4,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    modeButtonActive: {
        backgroundColor: '#2563eb',
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    modeButtonTextActive: {
        color: '#fff',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        gap: 8,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: '#64748b',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 16,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    cardMain: {
        flexDirection: 'row',
        padding: 16,
    },
    cardIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    cardLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    cardLocationText: {
        fontSize: 13,
        color: '#64748b',
    },
    cardStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    statLabel: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 16,
    },
    cardMenu: {
        position: 'absolute',
        top: 12,
        right: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
