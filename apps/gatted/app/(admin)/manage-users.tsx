import { PageHeader } from '@/components';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type UserProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    role?: string;
    society_id?: string | null;
    society_name?: string;
    user_roles?: { role: string; society_id: string; society?: { name: string } }[];
};

type Society = {
    id: string;
    name: string;
};

export default function ManageUsers() {
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [societies, setSocieties] = useState<Society[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSociety, setSelectedSociety] = useState<string>('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchSocieties();
    }, []);

    // Role color mapping for badges
    const getRoleColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'admin': return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
            case 'manager': return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' };
            case 'guard': return { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' };
            case 'resident': return { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe' };
            case 'owner': return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
            case 'tenant': return { bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff' };
            default: return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
        }
    };

    const fetchSocieties = async () => {
        const { data, error } = await supabase
            .from('societies')
            .select('id, name')
            .order('name');

        if (!error && data) {
            setSocieties(data);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch profiles and their roles with society info
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    user_roles!user_roles_user_id_fkey (role, society_id, society:societies(name))
                `);

            if (profilesError) throw profilesError;

            // Flatten structure for easier display
            const formattedUsers = profiles.map((p) => ({
                ...p,
                role: p.user_roles?.[0]?.role || 'N/A',
                society_id: p.user_roles?.[0]?.society_id || null,
                society_name: (p.user_roles?.[0]?.society as { name: string } | null)?.name || 'No Society'
            }));

            setUsers(formattedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (user: UserProfile) => {
        setSelectedUser(user);
        // Pre-select user's current society if they have one
        setSelectedSociety(user.society_id || (societies[0]?.id || ''));
        setModalVisible(true);
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        // Confirmation dialog
        Alert.alert(
            'Confirm Role Change',
            `Change ${selectedUser?.full_name || 'this user'}'s role to ${newRole.toUpperCase()}?${newRole === 'admin' ? '\n\n⚠️ Admin role has full system access!' : ''}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => performRoleUpdate(userId, newRole)
                }
            ]
        );
    };

    const performRoleUpdate = async (userId: string, newRole: string) => {
        if (!selectedSociety && newRole !== 'admin') {
            Alert.alert('Error', 'Please select a society for this user');
            return;
        }

        setUpdating(true);
        try {
            // First check if role entry exists for this user
            const { data: existingRole } = await supabase
                .from('user_roles')
                .select('id, society_id')
                .eq('user_id', userId)
                .single();

            let error;
            if (existingRole) {
                // Update existing role
                const { error: updateError } = await supabase
                    .from('user_roles')
                    .update({
                        role: newRole as any,
                        society_id: selectedSociety || existingRole.society_id
                    })
                    .eq('user_id', userId);
                error = updateError;
            } else {
                // Insert new role WITH society_id (FIXED)
                const { error: insertError } = await supabase
                    .from('user_roles')
                    .insert({
                        user_id: userId,
                        role: newRole as any,
                        society_id: selectedSociety, // ✅ NOW REQUIRED
                        is_active: true
                    });
                error = insertError;
            }

            if (error) throw error;

            Alert.alert('Success', 'User role updated successfully');
            setModalVisible(false);
            fetchUsers();
        } catch (error: any) {
            console.error('Error updating role:', error);
            Alert.alert('Error', error.message || 'Failed to update user role');
        } finally {
            setUpdating(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.phone || '').includes(searchQuery)
    );

    const renderUserItem = ({ item }: { item: UserProfile }) => {
        const roleColors = getRoleColor(item.role || '');
        return (
            <TouchableOpacity
                style={styles.userCard}
                onPress={() => openModal(item)}
            >
                <View style={[styles.avatarContainer, { backgroundColor: roleColors.bg }]}>
                    <Text style={[styles.avatarText, { color: roleColors.text }]}>
                        {(item.full_name || 'U').charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.full_name || 'Unknown User'}</Text>
                    <Text style={styles.userEmail}>{item.email || item.phone}</Text>
                    <View style={styles.roleRow}>
                        <View style={[styles.roleBadge, { backgroundColor: roleColors.bg, borderColor: roleColors.border }]}>
                            <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
                                {item.role?.toUpperCase() || 'N/A'}
                            </Text>
                        </View>
                        <Text style={styles.societyName}>{item.society_name}</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <PageHeader
                title="Manage Users"
                subtitle="View and edit user roles"
                showBack
                onBack={() => router.back()}
            />

            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderUserItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No users found.</Text>
                        }
                    />
                )}
            </View>

            {/* Role Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Role</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            {selectedUser?.full_name || 'User'}
                        </Text>

                        {/* Society Selector */}
                        <Text style={styles.sectionLabel}>Assign to Society:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.societyScroll}>
                            {societies.map((society) => (
                                <TouchableOpacity
                                    key={society.id}
                                    style={[
                                        styles.societyChip,
                                        selectedSociety === society.id && styles.societyChipSelected
                                    ]}
                                    onPress={() => setSelectedSociety(society.id)}
                                >
                                    <Text style={[
                                        styles.societyChipText,
                                        selectedSociety === society.id && styles.societyChipTextSelected
                                    ]}>
                                        {society.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Role Options */}
                        <Text style={styles.sectionLabel}>Select Role:</Text>
                        {['resident', 'guard', 'manager', 'admin'].map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[
                                    styles.roleOption,
                                    selectedUser?.role === role && styles.roleOptionSelected
                                ]}
                                onPress={() => handleRoleUpdate(selectedUser!.id, role)}
                                disabled={updating}
                            >
                                <View style={styles.roleInfo}>
                                    <Text style={[
                                        styles.roleOptionText,
                                        selectedUser?.role === role && styles.roleOptionTextSelected
                                    ]}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Text>
                                    <Text style={styles.roleDescription}>
                                        {role === 'admin' && 'Full system access'}
                                        {role === 'manager' && 'Society management'}
                                        {role === 'guard' && 'Gate operations'}
                                        {role === 'resident' && 'Unit access only'}
                                    </Text>
                                </View>
                                {updating ? (
                                    <ActivityIndicator size="small" color="#2563eb" />
                                ) : selectedUser?.role === role ? (
                                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                                ) : null}
                            </TouchableOpacity>
                        ))}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },
    listContainer: {
        paddingBottom: 20,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e0e7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4338ca',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
    },
    userRole: {
        fontSize: 12,
        fontWeight: '500',
        color: '#3b82f6',
    },
    roleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    societyName: {
        fontSize: 12,
        color: '#64748b',
    },
    emptyText: {
        textAlign: 'center',
        color: '#64748b',
        marginTop: 40,
        fontSize: 16,
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
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 16,
        fontWeight: '600',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 8,
    },
    societyScroll: {
        marginBottom: 16,
    },
    societyChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    societyChipSelected: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    societyChipText: {
        fontSize: 14,
        color: '#64748b',
    },
    societyChipTextSelected: {
        color: '#2563eb',
        fontWeight: '600',
    },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        marginBottom: 12,
    },
    roleOptionSelected: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#2563eb',
    },
    roleInfo: {
        flex: 1,
    },
    roleOptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#475569',
    },
    roleOptionTextSelected: {
        color: '#2563eb',
        fontWeight: '600',
    },
    roleDescription: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
});
