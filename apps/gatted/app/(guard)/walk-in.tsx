import { UnitSelector } from '@/components';
import { useAuth } from '@/contexts/auth-context';
import { useRecentUnits } from '@/hooks/useRecentUnits';
import { useVisitorLookup } from '@/hooks/useVisitorLookup';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Purpose options with icons
const PURPOSE_OPTIONS = [
    { id: 'guest', label: 'Guest', icon: '🧑' },
    { id: 'delivery', label: 'Delivery', icon: '📦' },
    { id: 'service', label: 'Service', icon: '🔧' },
    { id: 'cab', label: 'Cab', icon: '🚕' },
    { id: 'helper', label: 'Helper', icon: '🧹' },
    { id: 'other', label: 'Other', icon: '❓' },
] as const;

type PurposeId = typeof PURPOSE_OPTIONS[number]['id'];

export default function WalkInVisitorScreen() {
    const router = useRouter();
    const { currentRole } = useAuth();
    const { recentUnits, addRecentUnit } = useRecentUnits();

    // Form state
    const [visitorPhone, setVisitorPhone] = useState('');
    const [visitorName, setVisitorName] = useState('');
    const [unitId, setUnitId] = useState('');
    const [unitNumber, setUnitNumber] = useState('');
    const [selectedPurpose, setSelectedPurpose] = useState<PurposeId | null>(null);
    const [otherPurpose, setOtherPurpose] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entryTime, setEntryTime] = useState<Date | null>(null);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

    // Phone lookup for auto-fill and duplicate warning
    const { result: lookupResult, isLoading: isLookingUp } = useVisitorLookup({
        phone: visitorPhone,
        societyId: currentRole?.society_id || '',
    });

    // Auto-fill name from previous visit
    useEffect(() => {
        if (lookupResult?.name && !visitorName) {
            setVisitorName(lookupResult.name);
        }
    }, [lookupResult?.name, visitorName]);

    // Format phone number as XXXXX XXXXX
    const formatPhoneDisplay = (phone: string) => {
        const clean = phone.replace(/\D/g, '').slice(0, 10);
        if (clean.length > 5) {
            return `${clean.slice(0, 5)} ${clean.slice(5)}`;
        }
        return clean;
    };

    const handlePhoneChange = (text: string) => {
        // Remove non-digits and limit to 10
        const digits = text.replace(/\D/g, '').slice(0, 10);
        setVisitorPhone(digits);
    };

    // Get the final purpose string
    const getFinalPurpose = (): string => {
        if (!selectedPurpose) return '';
        if (selectedPurpose === 'other') {
            return otherPurpose.trim();
        }
        const option = PURPOSE_OPTIONS.find(p => p.id === selectedPurpose);
        return option?.label || '';
    };

    // Validation
    const validation = useMemo(() => {
        const cleanPhone = visitorPhone.replace(/\s/g, '');
        const phoneRegex = /^[6-9]\d{9}$/;

        return {
            phone: cleanPhone.length === 10 && phoneRegex.test(cleanPhone),
            name: visitorName.trim().length >= 2,
            unit: !!unitId,
            purpose: selectedPurpose !== null && (selectedPurpose !== 'other' || otherPurpose.trim().length > 0),
        };
    }, [visitorPhone, visitorName, unitId, selectedPurpose, otherPurpose]);

    const isFormValid = validation.phone && validation.name && validation.unit && validation.purpose;

    // Masked phone for confirmation
    const maskedPhone = useMemo(() => {
        const clean = visitorPhone.replace(/\s/g, '');
        if (clean.length >= 10) {
            return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
        }
        return clean;
    }, [visitorPhone]);

    const handleUnitSelect = useCallback((id: string, number: string) => {
        setUnitId(id);
        setUnitNumber(number);
        addRecentUnit(id, number);
    }, [addRecentUnit]);

    const handleSubmit = async () => {
        if (!isFormValid) return;

        setIsSubmitting(true);

        try {
            // Try to find a resident in the unit to assign as host
            const { data: resident } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('unit_id', unitId)
                .in('role', ['resident', 'owner', 'tenant'])
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            const hostId = resident?.user_id || null;
            const purpose = getFinalPurpose();
            const today = new Date().toISOString().split('T')[0];

            // Create visitor as pending (requires resident approval)
            const { data: visitor, error: visitorError } = await supabase
                .from('visitors')
                .insert({
                    society_id: currentRole?.society_id!, // Assumed non-null by check in validation or use ! since we check it elsewhere or handle error
                    unit_id: unitId,
                    host_id: hostId,
                    visitor_name: visitorName.trim(),
                    visitor_phone: visitorPhone.replace(/\s/g, ''),
                    purpose: purpose || null,
                    visitor_type: 'walk-in',
                    status: 'pending',
                    expected_date: today,
                } as any)
                .select()
                .single();

            if (visitorError) {
                setIsSubmitting(false);
                Alert.alert('Error', visitorError.message || 'Failed to register visitor');
                return;
            }

            // Create notification for resident if we have a host
            if (hostId && visitor) {
                await supabase.from('notifications').insert({
                    user_id: hostId,
                    society_id: currentRole?.society_id,
                    title: '🚪 Visitor Waiting',
                    message: `${visitorName.trim()} is at the gate for ${purpose || 'a visit'}. Approve or deny entry.`,
                    type: 'visitor',
                    metadata: {
                        visitor_id: visitor.id,
                        visitor_name: visitorName.trim(),
                        visitor_phone: visitorPhone.replace(/\s/g, ''),
                        purpose: purpose,
                        action_required: true,
                    },
                });
            }

            setIsSubmitting(false);

            // Show success
            setEntryTime(new Date());
            setShowSuccessOverlay(true);

        } catch (error: any) {
            console.error('Error registering visitor:', error);
            Alert.alert('Error', error.message || 'Failed to register visitor');
            setIsSubmitting(false);
        }
    };

    const handleRegisterAnother = () => {
        setVisitorPhone('');
        setVisitorName('');
        setUnitId('');
        setUnitNumber('');
        setSelectedPurpose(null);
        setOtherPurpose('');
        setEntryTime(null);
        setShowSuccessOverlay(false);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>New Walk-in Entry</Text>
                    <Text style={styles.headerSubtitle}>Society Gate • {today}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    {/* Phone Number - First Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <View style={styles.phoneInputContainer}>
                            <View style={styles.phonePrefix}>
                                <Text style={styles.phonePrefixText}>🇮🇳 +91</Text>
                            </View>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="98765 43210"
                                placeholderTextColor="#94a3b8"
                                value={formatPhoneDisplay(visitorPhone)}
                                onChangeText={handlePhoneChange}
                                keyboardType="number-pad"
                                autoFocus={true}
                                maxLength={11} // 10 digits + 1 space
                                editable={!isSubmitting}
                            />
                            {isLookingUp && (
                                <ActivityIndicator size="small" color="#3b82f6" style={styles.phoneLoader} />
                            )}
                        </View>
                        {!validation.phone && visitorPhone.length === 10 && (
                            <Text style={styles.errorText}>Enter valid 10-digit mobile starting with 6-9</Text>
                        )}
                        {lookupResult?.isCheckedInToday && (
                            <View style={styles.warningBadge}>
                                <Ionicons name="warning" size={16} color="#d97706" />
                                <Text style={styles.warningText}>Visitor already checked in today</Text>
                            </View>
                        )}
                    </View>

                    {/* Visitor Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Visitor Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Full name"
                            placeholderTextColor="#94a3b8"
                            value={visitorName}
                            onChangeText={setVisitorName}
                            editable={!isSubmitting}
                            autoCapitalize="words"
                        />
                        {lookupResult?.name && visitorName === lookupResult.name && (
                            <Text style={styles.autoFillHint}>Auto-filled from previous visit</Text>
                        )}
                        {!validation.name && visitorName.length > 0 && visitorName.length < 2 && (
                            <Text style={styles.errorText}>Name too short</Text>
                        )}
                    </View>

                    {/* Unit Selection */}
                    <UnitSelector
                        label="Unit"
                        societyId={currentRole?.society_id || ''}
                        value={unitId}
                        onSelect={handleUnitSelect}
                        recentUnits={recentUnits}
                        required
                    />

                    {/* Purpose Chips */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Purpose *</Text>
                        <View style={styles.purposeChipsContainer}>
                            {PURPOSE_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.purposeChip,
                                        selectedPurpose === option.id && styles.purposeChipSelected,
                                    ]}
                                    onPress={() => setSelectedPurpose(option.id)}
                                    disabled={isSubmitting}
                                >
                                    <Text style={styles.purposeChipIcon}>{option.icon}</Text>
                                    <Text
                                        style={[
                                            styles.purposeChipLabel,
                                            selectedPurpose === option.id && styles.purposeChipLabelSelected,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Other purpose text input */}
                        {selectedPurpose === 'other' && (
                            <TextInput
                                style={[styles.input, styles.otherPurposeInput]}
                                placeholder="Specify purpose..."
                                placeholderTextColor="#94a3b8"
                                value={otherPurpose}
                                onChangeText={setOtherPurpose}
                                editable={!isSubmitting}
                            />
                        )}
                    </View>

                    {/* Confirmation Summary */}
                    {isFormValid && (
                        <View style={styles.confirmationCard}>
                            <View style={styles.confirmationHeader}>
                                <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                                <Text style={styles.confirmationTitle}>Confirming Entry</Text>
                            </View>
                            <Text style={styles.confirmationDetails}>
                                Phone: {maskedPhone} • Unit: {unitNumber}
                            </Text>
                            <Text style={styles.confirmationDetails}>
                                Purpose: {getFinalPurpose()}
                            </Text>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!isFormValid || isSubmitting) && styles.buttonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="hourglass" size={24} color="#fff" />
                                <Text style={styles.submitButtonText}>Register & Notify Resident</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Entry time display after success */}
                    {entryTime && !showSuccessOverlay && (
                        <Text style={styles.entryTimeText}>
                            Entry Time: {formatTime(entryTime)}
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* Success Overlay */}
            {showSuccessOverlay && (
                <View style={styles.successOverlay}>
                    <View style={styles.successCard}>
                        <View style={styles.successIconContainer}>
                            <Ionicons name="hourglass-outline" size={64} color="#f59e0b" />
                        </View>
                        <Text style={styles.successTitle}>Visitor Registered</Text>
                        <Text style={styles.successMessage}>
                            {visitorName} is waiting for resident approval
                        </Text>
                        <Text style={styles.successNotification}>
                            📲 Notification sent to resident for approval
                        </Text>
                        {entryTime && (
                            <Text style={styles.successTime}>
                                Registered at: {formatTime(entryTime)}
                            </Text>
                        )}
                        <View style={styles.successActions}>
                            <TouchableOpacity
                                style={styles.successButtonPrimary}
                                onPress={handleRegisterAnother}
                            >
                                <Ionicons name="add-circle" size={20} color="#fff" />
                                <Text style={styles.successButtonPrimaryText}>Register Another</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.successButtonSecondary}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.successButtonSecondaryText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    form: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 22,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#1e293b',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    phonePrefix: {
        paddingHorizontal: 12,
        height: '100%',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
    },
    phonePrefixText: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    phoneInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#1e293b',
        letterSpacing: 0.5,
    },
    phoneLoader: {
        marginRight: 12,
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 6,
    },
    warningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
        gap: 6,
    },
    warningText: {
        fontSize: 13,
        color: '#d97706',
        fontWeight: '500',
    },
    autoFillHint: {
        fontSize: 12,
        color: '#22c55e',
        marginTop: 6,
    },
    purposeChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    purposeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 6,
        minWidth: '30%',
    },
    purposeChipSelected: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    purposeChipIcon: {
        fontSize: 16,
    },
    purposeChipLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    purposeChipLabelSelected: {
        color: '#FFFFFF',
    },
    otherPurposeInput: {
        marginTop: 12,
    },
    confirmationCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    confirmationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    confirmationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e40af',
    },
    confirmationDetails: {
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 22,
    },
    submitButton: {
        flexDirection: 'row',
        height: 52,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: '#cbd5e1',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    entryTimeText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 16,
    },
    successOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    successCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
    },
    successIconContainer: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 12,
    },
    successNotification: {
        fontSize: 14,
        color: '#22c55e',
        fontWeight: '500',
        marginBottom: 8,
    },
    successTime: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 24,
    },
    successActions: {
        width: '100%',
        gap: 12,
    },
    successButtonPrimary: {
        flexDirection: 'row',
        height: 50,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    successButtonPrimaryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    successButtonSecondary: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    successButtonSecondaryText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '500',
    },
});
