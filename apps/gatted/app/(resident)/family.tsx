import { PageHeader } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type FamilyMember = {
    id: string; // unit_resident id
    is_primary: boolean;
    user: {
        id: string;
        full_name: string | null;
        phone: string | null;
    } | null;
};

export default function FamilyManagement() {
    const router = useRouter();
    const { currentRole } = useAuth();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [adding, setAdding] = useState(false);


    const fetchMembers = useCallback(async () => {
        if (!currentRole?.unit_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('unit_residents')
                .select(`
                    id,
                    is_primary,
                    user:profiles(id, full_name, phone)
                `)
                .eq('unit_id', currentRole.unit_id);

            if (error) throw error;
            setMembers(data as any);
        } catch (error) {
            console.error('Error fetching members:', error);
            Alert.alert('Error', 'Failed to load family members');
        } finally {
            setLoading(false);
        }
    }, [currentRole]);

    useEffect(() => {
        fetchMembers();
    }, [currentRole, fetchMembers]);

    const handleAddMember = async () => {
        if (!newMemberPhone) return;
        if (!currentRole?.unit_id) return;

        setAdding(true);
        try {
            // 1. Check if user exists with this phone
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone', newMemberPhone)
                .single();

            if (userError || !users) {
                Alert.alert('User Not Found', 'The user must be registered in the app first.');
                setAdding(false);
                return;
            }

            // 2. Add to unit_residents
            const { error: insertError } = await supabase
                .from('unit_residents')
                .insert({
                    unit_id: currentRole.unit_id,
                    user_id: users.id,
                    is_primary: false,
                    move_in_date: new Date().toISOString()
                });

            if (insertError) throw insertError;

            // 3. Add resident role if they don't already have one for this unit
            const { data: existingRole } = await supabase
                .from('user_roles')
                .select('id')
                .eq('user_id', users.id)
                .eq('unit_id', currentRole.unit_id)
                .maybeSingle();

            if (!existingRole) {
                await supabase
                    .from('user_roles')
                    .insert({
                        user_id: users.id,
                        role: 'resident',
                        society_id: currentRole.society_id,
                        unit_id: currentRole.unit_id,
                        is_active: true
                    } as any);
            }

            Alert.alert('Success', 'Family member added!');
            setModalVisible(false);
            setNewMemberPhone('');
            fetchMembers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add member');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${memberName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('unit_residents')
                                .delete()
                                .eq('id', memberId);
                            if (error) throw error;
                            fetchMembers();
                        } catch {
                            Alert.alert('Error', 'Failed to remove member');
                        }
                    }
                }
            ]
        );
    };

    const renderMember = ({ item }: { item: FamilyMember }) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#6366f1" />
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                    {item.user?.full_name || 'Unknown User'}
                    {item.is_primary && <Text style={styles.primaryTag}> (Primary)</Text>}
                </Text>
                <Text style={styles.memberPhone}>{item.user?.phone}</Text>
            </View>
            {!item.is_primary && (
                <TouchableOpacity
                    onPress={() => handleRemoveMember(item.id, item.user?.full_name || 'User')}
                    style={styles.removeBtn}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <PageHeader
                title="My Family"
                subtitle="Manage household members"
                showBack
                onBack={() => router.back()}
                rightAction={{
                    icon: 'add',
                    color: '#2563eb',
                    onPress: () => setModalVisible(true)
                }}
            />

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" />
                ) : (
                    <FlatList
                        data={members}
                        renderItem={renderMember}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No members found.</Text>
                        }
                    />
                )}
            </View>

            {/* Add Member Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Family Member</Text>
                        <Text style={styles.modalSubtitle}>
                            Enter the phone number of the registered user to add them to your unit.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={newMemberPhone}
                            onChangeText={setNewMemberPhone}
                            keyboardType="phone-pad"
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
                                onPress={handleAddMember}
                                disabled={adding}
                            >
                                {adding ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Add</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    primaryTag: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '500',
    },
    memberPhone: {
        fontSize: 14,
        color: '#64748b',
    },
    removeBtn: {
        padding: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#f1f5f9',
    },
    saveBtn: {
        backgroundColor: '#2563eb',
    },
    cancelBtnText: {
        color: '#64748b',
        fontWeight: '600',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
