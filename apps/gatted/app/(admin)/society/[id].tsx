import { PageHeader, SectionTitle } from '@/components';
import ContextMenu from '@/components/admin/ContextMenu';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Block = {
    id: string;
    name: string;
    society_id: string | null;
    total_floors: number | null;
    is_archived?: boolean;
    unit_count?: number;
};

type Society = {
    id: string;
    name: string;
    city: string | null;
};

export default function SocietyBlocks() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [society, setSociety] = useState<Society | null>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);

    // Add/Edit Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [blockName, setBlockName] = useState('');
    const [blockFloors, setBlockFloors] = useState('');


    const fetchData = useCallback(async () => {
        try {
            // Fetch society info
            const { data: societyData } = await supabase
                .from('societies')
                .select('id, name, city')
                .eq('id', id)
                .single();

            setSociety(societyData);

            // Fetch blocks with unit counts
            const { data: blocksData } = await supabase
                .from('blocks')
                .select('*')
                .eq('society_id', id)
                .order('name');

            const blocksWithCounts = await Promise.all(
                (blocksData || []).map(async (block) => {
                    const { count } = await supabase
                        .from('units')
                        .select('id', { count: 'exact', head: true })
                        .eq('block_id', block.id);
                    return { ...block, unit_count: count || 0 };
                })
            );

            setBlocks(blocksWithCounts);
        } catch (error) {
            console.error('Error fetching blocks:', error);
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

    const openAddModal = () => {
        setEditingBlock(null);
        setBlockName('');
        setBlockFloors('');
        setModalVisible(true);
    };

    const openEditModal = (block: Block) => {
        setEditingBlock(block);
        setBlockName(block.name);
        setBlockFloors(String(block.total_floors || ''));
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!blockName.trim()) {
            Alert.alert('Error', 'Block name is required');
            return;
        }

        try {
            if (editingBlock) {
                // Update existing block
                const { error } = await supabase
                    .from('blocks')
                    .update({
                        name: blockName.trim(),
                        total_floors: parseInt(blockFloors) || 0
                    })
                    .eq('id', editingBlock.id);
                if (error) throw error;
                Alert.alert('Success', 'Block updated');
            } else {
                // Create new block
                const { error } = await supabase
                    .from('blocks')
                    .insert({
                        name: blockName.trim(),
                        society_id: id,
                        total_floors: parseInt(blockFloors) || 0,
                        // is_archived: false,
                    });
                if (error) throw error;
                Alert.alert('Success', 'Block created');
            }
            setModalVisible(false);
            fetchData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleArchive = (block: Block) => {
        Alert.alert(
            '⚠️ Delete Block?',
            block.unit_count && block.unit_count > 0
                ? `This block has ${block.unit_count} units.\n\n⚠️ This action is PERMANENT.`
                : 'Delete this block? This action is PERMANENT.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase
                                .from('blocks')
                                // .update({ is_archived: true }) // Column does not exist
                                .delete()
                                .eq('id', block.id);
                            fetchData();
                            Alert.alert('Success', 'Block deleted');
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const getMenuOptions = (block: Block) => [
        {
            label: 'View Units',
            icon: 'eye-outline',
            onPress: () => router.push(`/(admin)/block/${block.id}`),
        },
        {
            label: 'Edit Block',
            icon: 'pencil-outline',
            onPress: () => openEditModal(block),
            editModeOnly: true,
        },
        {
            label: 'Archive Block',
            icon: 'archive-outline',
            onPress: () => handleArchive(block),
            editModeOnly: true,
            destructive: true,
        },
    ];

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
                <Ionicons name="cube-outline" size={48} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No blocks in this society</Text>
            <Text style={styles.emptySubtitle}>
                Add blocks to organize units within this society.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Add First Block</Text>
            </TouchableOpacity>
        </View>
    );

    const renderBlockCard = (block: Block) => (
        <View key={block.id} style={styles.card}>
            <TouchableOpacity
                style={styles.cardMain}
                onPress={() => router.push(`/(admin)/block/${block.id}`)}
            >
                <View style={styles.cardIcon}>
                    <Ionicons name="cube" size={24} color="#059669" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{block.name}</Text>
                    <View style={styles.cardStats}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{block.total_floors || 0}</Text>
                            <Text style={styles.statLabel}>Floors</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{block.unit_count || 0}</Text>
                            <Text style={styles.statLabel}>Units</Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
            <View style={styles.cardMenu}>
                <ContextMenu options={getMenuOptions(block)} isEditMode={isEditMode} />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <PageHeader
                title={society?.name || 'Loading...'}
                subtitle="Blocks"
                showBack
                onBack={() => router.back()}
            />

            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
                <TouchableOpacity
                    style={[styles.modeButton, !isEditMode && styles.modeButtonActive]}
                    onPress={() => setIsEditMode(false)}
                >
                    <Text style={[styles.modeButtonText, !isEditMode && styles.modeButtonTextActive]}>
                        View Mode
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, isEditMode && styles.modeButtonActive]}
                    onPress={() => setIsEditMode(true)}
                >
                    <Text style={[styles.modeButtonText, isEditMode && styles.modeButtonTextActive]}>
                        Edit Mode
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                        contentContainerStyle={blocks.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
                    >
                        {blocks.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <>
                                <View style={styles.sectionHeader}>
                                    <SectionTitle>Blocks ({blocks.length})</SectionTitle>
                                </View>
                                {blocks.map(renderBlockCard)}
                            </>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Add Block FAB */}
            {blocks.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={openAddModal}>
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Add/Edit Modal */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingBlock ? 'Edit Block' : 'Add New Block'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Block Name (e.g., Block A)"
                            value={blockName}
                            onChangeText={setBlockName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Number of Floors"
                            value={blockFloors}
                            onChangeText={setBlockFloors}
                            keyboardType="numeric"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveBtnText}>
                                    {editingBlock ? 'Save' : 'Add Block'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    modeButtonActive: { backgroundColor: '#2563eb' },
    modeButtonText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    modeButtonTextActive: { color: '#fff' },
    content: { flex: 1, paddingHorizontal: 20, marginTop: 16 },
    sectionHeader: { marginBottom: 12 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    cardMain: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
    cardStats: { flexDirection: 'row', alignItems: 'center' },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    statDivider: { width: 1, height: 24, backgroundColor: '#e2e8f0', marginHorizontal: 16 },
    cardMenu: { position: 'absolute', top: 12, right: 8 },
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
    emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    emptyButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#059669',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1e293b', textAlign: 'center' },
    input: { backgroundColor: '#f1f5f9', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#f1f5f9' },
    saveBtn: { backgroundColor: '#2563eb' },
    cancelBtnText: { color: '#64748b', fontWeight: '600' },
    saveBtnText: { color: '#fff', fontWeight: '600' },
});
