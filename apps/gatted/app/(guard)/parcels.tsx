import { UnitSelector } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import type { Parcel as ParcelType } from '@/types';
import { showConfirm, showError, showSuccess } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type Parcel = ParcelType & {
    unit?: { unit_number: string } | null;
    resident?: { full_name: string } | null;
};

export default function ParcelsScreen() {
    const router = useRouter();
    const { currentRole, profile } = useAuth();
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [selectedUnitId, setSelectedUnitId] = useState('');
    const [selectedUnitNumber, setSelectedUnitNumber] = useState('');
    const [courierName, setCourierName] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [description, setDescription] = useState('');


    const loadParcels = useCallback(async (isRefresh = false) => {
        if (!currentRole?.society_id) {
            console.log('No society_id found');
            return;
        }

        if (!isRefresh) setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('parcels')
                .select('*')
                .eq('society_id', currentRole.society_id)
                .in('status', ['received', 'notified'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading parcels:', error);
                showError(error.message || 'Failed to load parcels');
                return;
            }

            if (data) {
                // Fetch unit numbers separately
                const parcelsWithUnits = await Promise.all(data.map(async (parcel: ParcelType) => {
                    let unitData = null;
                    if (parcel.unit_id) {
                        const { data } = await supabase
                            .from('units')
                            .select('unit_number')
                            .eq('id', parcel.unit_id)
                            .single();
                        unitData = data;
                    }

                    return {
                        ...parcel,
                        unit: unitData
                    };
                }));

                setParcels(parcelsWithUnits as Parcel[]);
            }
        } catch (err) {
            console.error('Error loading parcels:', err);
            showError('Failed to load parcels');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [currentRole?.society_id]);

    useEffect(() => {
        if (currentRole?.society_id) {
            loadParcels();
        }
    }, [currentRole?.society_id, loadParcels]);

    const onRefresh = () => {
        setRefreshing(true);
        loadParcels(true);
    };

    const handleUnitSelect = (unitId: string, unitNumber: string) => {
        setSelectedUnitId(unitId);
        setSelectedUnitNumber(unitNumber);
    };

    const handleLogParcel = async () => {
        if (!selectedUnitId) {
            showError('Please select a unit');
            return;
        }

        if (!currentRole?.society_id) {
            showError('Society not found');
            return;
        }

        setIsSubmitting(true);

        try {
            // Find resident for this unit (get primary or first active resident)
            const { data: userRole, error: residentError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('unit_id', selectedUnitId)
                .eq('role', 'resident')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            if (residentError) {
                console.log('Note: No resident found for unit:', residentError);
            }

            // Insert parcel
            const { error } = await supabase
                .from('parcels')
                .insert({
                    society_id: currentRole.society_id,
                    unit_id: selectedUnitId,
                    resident_id: userRole?.user_id || null,
                    courier_name: courierName.trim() || null,
                    tracking_number: trackingNumber.trim() || null,
                    description: description.trim() || null,
                    received_by: profile?.id,
                    status: 'received',
                });

            if (error) {
                console.error('Error inserting parcel:', error);
                throw error;
            }

            showSuccess(`Parcel logged for unit ${selectedUnitNumber}`);
            setShowForm(false);
            resetForm();
            loadParcels();
        } catch (err: any) {
            console.error('Error logging parcel:', err);
            showError(err?.message || 'Failed to log parcel');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedUnitId('');
        setSelectedUnitNumber('');
        setCourierName('');
        setTrackingNumber('');
        setDescription('');
    };

    const handleMarkCollected = async (parcelId: string, unitNumber: string) => {
        showConfirm(
            `Confirm parcel for ${unitNumber} has been collected?`,
            async () => {
                try {
                    const { error } = await supabase
                        .from('parcels')
                        .update({
                            status: 'collected',
                            collected_at: new Date().toISOString(),
                            collected_by: profile?.id,
                        })
                        .eq('id', parcelId);

                    if (error) throw error;
                    showSuccess('Parcel marked as collected');
                    loadParcels();
                } catch {
                    showError('Failed to update parcel');
                }
            },
            { title: 'Mark as Collected', confirmText: 'Confirm', cancelText: 'Cancel' }
        );
    };

    const renderParcel = ({ item }: { item: Parcel }) => (
        <View style={styles.parcelCard}>
            <View style={styles.parcelIcon}>
                <Ionicons name="cube" size={24} color="#f59e0b" />
            </View>
            <View style={styles.parcelInfo}>
                <Text style={styles.parcelUnit}>Unit: {item.unit?.unit_number || 'N/A'}</Text>
                {item.courier_name && (
                    <Text style={styles.parcelDetail}>{item.courier_name}</Text>
                )}
                {item.tracking_number && (
                    <Text style={styles.parcelDetail}>#{item.tracking_number}</Text>
                )}
                <Text style={styles.parcelTime}>
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.collectButton}
                onPress={() => handleMarkCollected(item.id, item.unit?.unit_number || 'Unknown')}
            >
                <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
                <Text style={styles.collectButtonText}>Mark Collected</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Parcels</Text>
                <TouchableOpacity onPress={() => setShowForm(!showForm)}>
                    <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            {showForm && currentRole?.society_id && (
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>Log New Parcel</Text>

                    <UnitSelector
                        label="Destination Unit"
                        societyId={currentRole.society_id}
                        value={selectedUnitId}
                        onSelect={handleUnitSelect}
                        required
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Courier Name (e.g., Amazon, Flipkart)"
                        value={courierName}
                        onChangeText={setCourierName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Tracking Number (optional)"
                        value={trackingNumber}
                        onChangeText={setTrackingNumber}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Description (optional)"
                        value={description}
                        onChangeText={setDescription}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                        onPress={handleLogParcel}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Log Parcel</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Pending Collection ({parcels.length})</Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                ) : parcels.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No pending parcels</Text>
                    </View>
                ) : (
                    <FlatList
                        data={parcels}
                        renderItem={renderParcel}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#3b82f6"
                            />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    formContainer: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 16,
    },
    parcelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    parcelIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    parcelInfo: {
        flex: 1,
    },
    parcelUnit: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    parcelDetail: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    parcelTime: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    collectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#d1fae5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    collectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 12,
    },
});
