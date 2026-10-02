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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type Visitor = {
    id: string;
    visitor_name: string;
    vehicle_number: string | null;
    status: string;
    checked_in_at: string | null;
    unit?: {
        unit_number: string;
        block?: {
            name: string;
        }
    };
};

export default function VisitorCheckout() {
    const router = useRouter();
    const { currentRole, profile } = useAuth();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [checkingOut, setCheckingOut] = useState<string | null>(null);


    const fetchActiveVisitors = useCallback(async () => {
        if (!currentRole?.society_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('visitors')
                .select(`
                    id,
                    visitor_name,
                    vehicle_number,
                    status,
                    checked_in_at,
                    unit:units (
                        unit_number,
                        block:blocks(name)
                    )
                `)
                .eq('society_id', currentRole.society_id)
                .eq('status', 'checked-in');

            if (error) throw error;
            setVisitors(data as any);
        } catch (error) {
            console.error('Error fetching visitors:', error);
            Alert.alert('Error', 'Failed to load active visitors');
        } finally {
            setLoading(false);
        }
    }, [currentRole]);

    useEffect(() => {
        fetchActiveVisitors();
    }, [currentRole, fetchActiveVisitors]);

    const handleCheckout = async (visitor: Visitor) => {
        Alert.alert(
            'Confirm Checkout',
            `Check out ${visitor.visitor_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Check Out',
                    style: 'destructive',
                    onPress: async () => {
                        performCheckout(visitor.id);
                    }
                }
            ]
        );
    };

    const performCheckout = async (visitorId: string) => {
        setCheckingOut(visitorId);
        try {
            // Use RPC function for proper validation and audit trail
            const { error } = await supabase.rpc('checkout_visitor', {
                visitor_uuid: visitorId,
                guard_uuid: profile!.id
            });

            if (error) throw error;

            Alert.alert('Success', 'Visitor checked out successfully');
            fetchActiveVisitors();
        } catch (error: any) {
            console.error('Checkout error:', error);
            Alert.alert('Error', error.message || 'Failed to check out visitor');
        } finally {
            setCheckingOut(null);
        }
    };

    const filteredVisitors = visitors.filter(v =>
        v.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.vehicle_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.unit?.unit_number || '').includes(searchQuery)
    );

    const renderVisitor = ({ item }: { item: Visitor }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.visitorName}>{item.visitor_name}</Text>
                    <Text style={styles.visitorDetails}>
                        {item.unit?.block?.name} - {item.unit?.unit_number}
                    </Text>
                    {item.vehicle_number && (
                        <View style={styles.vehicleBadge}>
                            <Ionicons name="car-outline" size={14} color="#64748b" />
                            <Text style={styles.vehicleText}>{item.vehicle_number}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() => handleCheckout(item)}
                    disabled={!!checkingOut}
                >
                    {checkingOut === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.checkoutBtnText}>Check Out</Text>
                    )}
                </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <Text style={styles.timeText}>
                In since: {new Date(item.checked_in_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <PageHeader
                title="Visitor Checkout"
                subtitle="Currently inside society"
                showBack
                onBack={() => router.back()}
            />

            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search name, vehicle, or unit..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={filteredVisitors}
                        renderItem={renderVisitor}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="checkmark-circle-outline" size={64} color="#d1fae5" />
                                <Text style={styles.emptyText}>No visitors currently inside.</Text>
                            </View>
                        }
                    />
                )}
            </View>
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    visitorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    visitorDetails: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    vehicleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    vehicleText: {
        fontSize: 12,
        color: '#475569',
        marginLeft: 4,
        fontWeight: '500',
    },
    checkoutBtn: {
        backgroundColor: '#ef4444',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    checkoutBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    timeText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
    },
});
