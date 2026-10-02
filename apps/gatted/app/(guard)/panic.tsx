import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';

export default function PanicScreen() {
    const router = useRouter();
    const { profile, currentRole } = useAuth();
    const [isActivating, setIsActivating] = useState(false);
    const [notes, setNotes] = useState('');
    const [alertSent, setAlertSent] = useState(false);

    const handlePanicAlert = async () => {
        Alert.alert(
            '🚨 EMERGENCY ALERT',
            'This will immediately notify all managers. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'SEND ALERT',
                    style: 'destructive',
                    onPress: sendPanicAlert,
                },
            ]
        );
    };

    const sendPanicAlert = async () => {
        setIsActivating(true);
        Vibration.vibrate([0, 500, 200, 500]); // Alert vibration pattern

        try {
            // Log the panic alert as an announcement
            const { error } = await supabase.from('announcements').insert({
                society_id: currentRole?.society_id,
                title: '🚨 EMERGENCY ALERT',
                message: `Emergency alert triggered by ${profile?.full_name || 'Guard'}.\n\nLocation: Main Gate\nTime: ${new Date().toLocaleString('en-IN')}\n\n${notes ? `Notes: ${notes}` : 'No additional details provided.'}`,
                target_type: 'role' as const,
                target_role: 'manager' as const,
                created_by: profile?.id,
            });

            if (error) throw error;

            // TODO: In production, also trigger push notifications here

            setAlertSent(true);
            Alert.alert(
                '✅ Alert Sent',
                'All managers have been notified. Help is on the way.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error sending panic alert:', error);
            Alert.alert('Error', 'Failed to send alert. Please try calling emergency services.');
        } finally {
            setIsActivating(false);
        }
    };

    const handleCancel = () => {
        if (alertSent) {
            setAlertSent(false);
            setNotes('');
        }
        router.back();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency Alert</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {alertSent ? (
                    <View style={styles.successContainer}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                        </View>
                        <Text style={styles.successTitle}>Alert Sent!</Text>
                        <Text style={styles.successText}>
                            All managers have been notified.{'\n'}Stay calm, help is on the way.
                        </Text>
                        <TouchableOpacity style={styles.doneButton} onPress={handleCancel}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.warningBanner}>
                            <Ionicons name="warning" size={24} color="#fef3c7" />
                            <Text style={styles.warningText}>
                                Use only in genuine emergencies
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.panicButton, isActivating && styles.panicButtonActive]}
                            onPress={handlePanicAlert}
                            disabled={isActivating}
                            activeOpacity={0.8}
                        >
                            {isActivating ? (
                                <ActivityIndicator size="large" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="alert-circle" size={64} color="#fff" />
                                    <Text style={styles.panicButtonText}>SOS</Text>
                                    <Text style={styles.panicButtonSubtext}>Press to Alert Managers</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.notesContainer}>
                            <Text style={styles.notesLabel}>Additional Details (Optional)</Text>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Describe the emergency..."
                                placeholderTextColor="#94a3b8"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <Text style={styles.disclaimer}>
                            Pressing SOS will immediately notify all society managers with an emergency alert.
                        </Text>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#dc2626',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 10,
        marginBottom: 40,
    },
    warningText: {
        color: '#fef3c7',
        fontSize: 14,
        fontWeight: '500',
    },
    panicButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#b91c1c',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 4,
        borderColor: '#fff',
    },
    panicButtonActive: {
        backgroundColor: '#7f1d1d',
    },
    panicButtonText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 8,
    },
    panicButtonSubtext: {
        color: '#fecaca',
        fontSize: 12,
        marginTop: 4,
    },
    notesContainer: {
        width: '100%',
        marginTop: 40,
    },
    notesLabel: {
        color: '#fecaca',
        fontSize: 14,
        marginBottom: 8,
    },
    notesInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    disclaimer: {
        color: '#fecaca',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
        paddingHorizontal: 20,
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    successText: {
        fontSize: 16,
        color: '#fecaca',
        textAlign: 'center',
        lineHeight: 24,
    },
    doneButton: {
        marginTop: 40,
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 12,
    },
    doneButtonText: {
        color: '#dc2626',
        fontSize: 18,
        fontWeight: '600',
    },
});
