import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type VisitorStatus = 'pending' | 'approved' | 'denied' | 'checked-in' | 'checked-out';

export interface VisitorApprovalCardProps {
    visitor: {
        id: string;
        visitor_name: string;
        visitor_phone?: string | null;
        unit_number?: string;
        purpose?: string | null;
        status: VisitorStatus;
        created_at: string;
    };
    role: 'guard' | 'resident' | 'manager';
    onApprove?: () => Promise<boolean>;
    onDeny?: () => Promise<boolean>;
    onCheckIn?: () => Promise<boolean>;
    onActionComplete?: () => void;
}

/**
 * Unified visitor approval card used across Guard, Resident, and Manager views.
 * Displays role-appropriate actions based on visitor status.
 */
export function VisitorApprovalCard({
    visitor,
    role,
    onApprove,
    onDeny,
    onCheckIn,
    onActionComplete,
}: VisitorApprovalCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const maskPhone = (phone: string | null | undefined) => {
        if (!phone || phone.length < 4) return phone || '';
        return `${phone.slice(0, 5)}•••${phone.slice(-2)}`;
    };

    const handleAction = async (action: 'approve' | 'deny' | 'checkIn', handler?: () => Promise<boolean>) => {
        if (!handler || isProcessing) return;

        setIsProcessing(true);
        setProcessingAction(action);

        const success = await handler();

        setIsProcessing(false);
        setProcessingAction(null);

        if (success && onActionComplete) {
            onActionComplete();
        }
    };

    const getStatusConfig = () => {
        switch (visitor.status) {
            case 'pending':
                return { icon: 'hourglass-outline', color: '#f59e0b', bg: '#fef3c7', text: 'Pending' };
            case 'approved':
                return { icon: 'checkmark-circle', color: '#22c55e', bg: '#dcfce7', text: 'Approved' };
            case 'denied':
                return { icon: 'close-circle', color: '#ef4444', bg: '#fee2e2', text: 'Denied' };
            case 'checked-in':
                return { icon: 'enter', color: '#3b82f6', bg: '#dbeafe', text: 'Inside' };
            case 'checked-out':
                return { icon: 'exit', color: '#64748b', bg: '#f1f5f9', text: 'Left' };
            default:
                return { icon: 'help-circle', color: '#64748b', bg: '#f1f5f9', text: 'Unknown' };
        }
    };

    const statusConfig = getStatusConfig();
    const showResidentActions = role === 'resident' && visitor.status === 'pending';
    const showGuardCheckIn = role === 'guard' && visitor.status === 'approved';
    const showGuardWaiting = role === 'guard' && visitor.status === 'pending';

    return (
        <View style={[styles.card, { borderLeftColor: statusConfig.color }]}>
            <View style={styles.header}>
                <View style={styles.visitorInfo}>
                    <View style={[styles.avatar, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name="person" size={20} color={statusConfig.color} />
                    </View>
                    <View style={styles.nameSection}>
                        <Text style={styles.visitorName} numberOfLines={1}>
                            {visitor.visitor_name}
                        </Text>
                        <Text style={styles.details}>
                            {maskPhone(visitor.visitor_phone)}
                            {visitor.purpose ? ` • ${visitor.purpose}` : ''}
                        </Text>
                        {visitor.unit_number && (
                            <Text style={styles.unitText}>Unit: {visitor.unit_number}</Text>
                        )}
                    </View>
                </View>
                <View style={styles.rightSection}>
                    <Text style={styles.time}>{formatTime(visitor.created_at)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.text}
                        </Text>
                    </View>
                </View>
            </View>

            {showGuardWaiting && (
                <View style={styles.waitingMessage}>
                    <Ionicons name="time-outline" size={16} color="#f59e0b" />
                    <Text style={styles.waitingText}>Waiting for resident approval</Text>
                </View>
            )}

            {showResidentActions && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.denyButton, isProcessing && styles.buttonDisabled]}
                        onPress={() => handleAction('deny', onDeny)}
                        disabled={isProcessing}
                    >
                        {processingAction === 'deny' ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                            <>
                                <Ionicons name="close" size={18} color="#ef4444" />
                                <Text style={styles.denyButtonText}>Deny</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.approveButton, isProcessing && styles.buttonDisabled]}
                        onPress={() => handleAction('approve', onApprove)}
                        disabled={isProcessing}
                    >
                        {processingAction === 'approve' ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={18} color="#fff" />
                                <Text style={styles.approveButtonText}>Approve</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {showGuardCheckIn && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.checkInButton, isProcessing && styles.buttonDisabled]}
                        onPress={() => handleAction('checkIn', onCheckIn)}
                        disabled={isProcessing}
                    >
                        {processingAction === 'checkIn' ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="enter" size={18} color="#fff" />
                                <Text style={styles.checkInButtonText}>Check In Visitor</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    visitorInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    nameSection: {
        flex: 1,
    },
    visitorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    details: {
        fontSize: 13,
        color: '#64748b',
    },
    unitText: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    time: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    waitingMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        padding: 10,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    waitingText: {
        fontSize: 13,
        color: '#92400e',
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    denyButton: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    denyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },
    approveButton: {
        backgroundColor: '#22c55e',
    },
    approveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    checkInButton: {
        backgroundColor: '#3b82f6',
    },
    checkInButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
