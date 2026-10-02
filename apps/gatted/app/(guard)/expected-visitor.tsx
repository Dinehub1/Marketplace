import { useAuth } from '@/contexts/auth-context';
import { supabaseHelpers } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type VerifyMode = 'otp' | 'qr';

type ExpectedVisitor = {
    id: string;
    visitor_name: string;
    otp: string | null;
    otp_expires_at: string | null;
    expected_time: string | null;
    unit?: { unit_number: string } | null;
    host?: { full_name: string | null } | null;
};

export default function ExpectedVisitorScreen() {
    const router = useRouter();
    const { currentRole, profile } = useAuth();
    const [mode, setMode] = useState<VerifyMode>('otp');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expectedVisitors, setExpectedVisitors] = useState<ExpectedVisitor[]>([]);
    const [loadingVisitors, setLoadingVisitors] = useState(true);
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);


    const loadExpectedVisitors = useCallback(async () => {
        if (!currentRole?.society_id) return;

        setLoadingVisitors(true);
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabaseHelpers.getExpectedVisitors(currentRole.society_id, today);

        if (!error && data) {
            setExpectedVisitors(data);
        }
        setLoadingVisitors(false);
    }, [currentRole?.society_id]);

    useEffect(() => {
        loadExpectedVisitors();
    }, [loadExpectedVisitors]);

    const checkInVisitor = async (visitorId: string, visitorName: string, otp?: string) => {
        setIsLoading(true);
        const { error } = await supabaseHelpers.logVisitorEntry(visitorId, profile?.id ?? '', otp);
        setIsLoading(false);

        if (error) {
            console.error('Check-in error details:', error);
            const errorMessage = error.message || 'Failed to check in visitor';
            Alert.alert('Check-in Failed', errorMessage);
            return false;
        }

        Alert.alert(
            '✅ Visitor Checked In',
            `${visitorName} has been checked in successfully.`,
            [{ text: 'OK', onPress: () => loadExpectedVisitors() }]
        );
        return true;
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        const visitor = expectedVisitors.find(v => v.otp === otp);

        if (!visitor) {
            Alert.alert('Error', 'Invalid OTP. Please check and try again.');
            setIsLoading(false);
            return;
        }

        if (!visitor.otp_expires_at || new Date(visitor.otp_expires_at) < new Date()) {
            Alert.alert('Error', 'OTP has expired. Please ask the resident to generate a new one.');
            setIsLoading(false);
            return;
        }

        const success = await checkInVisitor(visitor.id, visitor.visitor_name, otp);
        if (success) setOtp('');
    };

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        try {
            const qrData = JSON.parse(data);
            const { visitorId, otp: qrOtp, visitorName } = qrData;

            if (!visitorId || !qrOtp) {
                Alert.alert('Error', 'Invalid QR code format', [
                    { text: 'OK', onPress: () => setScanned(false) }
                ]);
                return;
            }

            const visitor = expectedVisitors.find(v => v.id === visitorId && v.otp === qrOtp);

            if (!visitor) {
                Alert.alert('Error', 'Visitor not found or invalid QR code', [
                    { text: 'OK', onPress: () => setScanned(false) }
                ]);
                return;
            }

            if (!visitor.otp_expires_at || new Date(visitor.otp_expires_at) < new Date()) {
                Alert.alert('Error', 'QR code has expired', [
                    { text: 'OK', onPress: () => setScanned(false) }
                ]);
                return;
            }

            await checkInVisitor(visitor.id, visitorName || visitor.visitor_name, qrOtp);
            setScanned(false);
        } catch {
            Alert.alert('Error', 'Could not read QR code', [
                { text: 'OK', onPress: () => setScanned(false) }
            ]);
        }
    };

    const handleCheckInVisitor = async (visitorId: string, visitorName: string) => {
        Alert.alert(
            'Check In Visitor',
            `Check in ${visitorName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Check In', onPress: () => checkInVisitor(visitorId, visitorName) },
            ]
        );
    };

    const renderVisitorCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.visitorCard}
            onPress={() => handleCheckInVisitor(item.id, item.visitor_name)}
        >
            <View style={styles.visitorInfo}>
                <Text style={styles.visitorName}>{item.visitor_name}</Text>
                <Text style={styles.visitorUnit}>Unit: {item.unit?.unit_number || 'N/A'}</Text>
                <Text style={styles.visitorHost}>Host: {item.host?.full_name || 'Unknown'}</Text>
                {item.expected_time && (
                    <Text style={styles.visitorTime}>Expected: {item.expected_time}</Text>
                )}
            </View>
            <View style={[styles.statusBadge, styles.pendingBadge]}>
                <Text style={styles.statusText}>Tap to Check In</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Expected Visitors</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, mode === 'otp' && styles.tabActive]}
                    onPress={() => setMode('otp')}
                >
                    <Ionicons name="keypad" size={20} color={mode === 'otp' ? '#fff' : '#64748b'} />
                    <Text style={[styles.tabText, mode === 'otp' && styles.tabTextActive]}>OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, mode === 'qr' && styles.tabActive]}
                    onPress={() => setMode('qr')}
                >
                    <Ionicons name="qr-code" size={20} color={mode === 'qr' ? '#fff' : '#64748b'} />
                    <Text style={[styles.tabText, mode === 'qr' && styles.tabTextActive]}>Scan QR</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {mode === 'otp' ? (
                    /* OTP Input Section */
                    <View style={styles.otpSection}>
                        <Text style={styles.sectionTitle}>Verify by OTP</Text>
                        <Text style={styles.sectionSubtitle}>Enter the 6-digit OTP from visitor</Text>

                        <TextInput
                            style={styles.otpInput}
                            placeholder="000000"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!isLoading}
                        />

                        <TouchableOpacity
                            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
                            onPress={handleVerifyOTP}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Verify & Check In</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* QR Scanner Section */
                    <View style={styles.qrSection}>
                        {!permission ? (
                            <Text style={styles.permissionText}>Requesting camera permission...</Text>
                        ) : !permission.granted ? (
                            <View style={styles.permissionContainer}>
                                <Ionicons name="camera-outline" size={48} color="#94a3b8" />
                                <Text style={styles.permissionText}>Camera permission is required to scan QR codes</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
                                    <Text style={styles.retryButtonText}>Grant Permission</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.scannerContainer}>
                                <CameraView
                                    style={styles.scanner}
                                    facing="back"
                                    barcodeScannerSettings={{
                                        barcodeTypes: ['qr'],
                                    }}
                                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                                />
                                <View style={styles.scannerOverlay}>
                                    <View style={styles.scannerFrame} />
                                </View>
                                <Text style={styles.scannerHint}>Point camera at visitor&apos;s QR code</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Expected Visitors List */}
                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>Today&apos;s Expected Visitors ({expectedVisitors.length})</Text>

                    {loadingVisitors ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
                    ) : expectedVisitors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No expected visitors today</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={expectedVisitors}
                            renderItem={renderVisitorCard}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    tabActive: {
        backgroundColor: '#10b981',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    otpSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    qrSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        minHeight: 280,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
    },
    otpInput: {
        height: 64,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 20,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 16,
    },
    verifyButton: {
        height: 56,
        backgroundColor: '#10b981',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    scannerContainer: {
        width: '100%',
        height: 240,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    scanner: {
        ...StyleSheet.absoluteFill,
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: 200,
        height: 200,
        borderWidth: 2,
        borderColor: '#10b981',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    scannerHint: {
        textAlign: 'center',
        color: '#64748b',
        fontSize: 14,
        marginTop: 12,
    },
    permissionContainer: {
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        color: '#64748b',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    listSection: {
        flex: 1,
    },
    visitorCard: {
        flexDirection: 'row',
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
    visitorInfo: {
        flex: 1,
    },
    visitorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    visitorUnit: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
    },
    visitorHost: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
    },
    visitorTime: {
        fontSize: 14,
        color: '#64748b',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    pendingBadge: {
        backgroundColor: '#10b981',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 12,
    },
});
