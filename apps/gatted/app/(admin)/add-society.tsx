import { PageHeader } from '@/components';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddSociety() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [societyName, setSocietyName] = useState('');
    const [city, setCity] = useState('');


    const fetchSociety = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('societies')
                .select('*')
                .eq('id', id!)
                .single();

            if (error) throw error;
            if (data) {
                setSocietyName(data.name);
                setCity(data.city || '');
            }
        } catch (error) {
            console.error('Error fetching society:', error);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchSociety();
        }
    }, [id, fetchSociety]);

    const handleSave = async () => {
        if (!societyName.trim()) {
            Alert.alert('Error', 'Society name is required');
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('societies')
                    .update({
                        name: societyName.trim(),
                        city: city.trim() || 'Unknown',
                    })
                    .eq('id', id);
                if (error) throw error;
                Alert.alert('Success', 'Society updated', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                const { error } = await supabase
                    .from('societies')
                    .insert({
                        name: societyName.trim(),
                        city: city.trim() || 'Unknown',
                        is_archived: false,
                    });
                if (error) throw error;
                Alert.alert('Success', 'Society created', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <PageHeader
                title={isEditing ? 'Edit Society' : 'Add New Society'}
                subtitle="Society Configuration"
                showBack
                onBack={() => router.back()}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="business" size={32} color="#2563eb" />
                        </View>
                        <Text style={styles.infoTitle}>
                            {isEditing ? 'Update Society Details' : 'Create a New Society'}
                        </Text>
                        <Text style={styles.infoSubtitle}>
                            A society is the top-level entity that contains blocks and units.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        <Text style={styles.label}>Society Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Green Valley Apartments"
                            value={societyName}
                            onChangeText={setSocietyName}
                            autoFocus={!isEditing}
                        />

                        <Text style={styles.label}>City</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Bangalore"
                            value={city}
                            onChangeText={setCity}
                        />
                    </View>

                    {/* Tips */}
                    <View style={styles.tipsCard}>
                        <Text style={styles.tipsTitle}>💡 Tips</Text>
                        <View style={styles.tipRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#059669" />
                            <Text style={styles.tipText}>Use the full official name</Text>
                        </View>
                        <View style={styles.tipRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#059669" />
                            <Text style={styles.tipText}>City helps with multi-location management</Text>
                        </View>
                        <View style={styles.tipRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#059669" />
                            <Text style={styles.tipText}>You can add blocks after creating the society</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Action */}
                <View style={styles.bottomAction}>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Ionicons name={isEditing ? 'checkmark' : 'add'} size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Society'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    infoCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    infoIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#dbeafe',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    infoSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },
    formSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 20,
    },
    tipsCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
        marginBottom: 12,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    tipText: {
        fontSize: 13,
        color: '#166534',
    },
    bottomAction: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
