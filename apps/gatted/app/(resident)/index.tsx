import {
    ActionButton,
    PageHeader,
    SectionTitle,
    StatCard,
    StatRow,
    VisitorApprovalCard,
} from '@/components';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/auth-context';
import { useVisitorApproval } from '@/hooks/useVisitorApproval';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type VisitorSummary = {
    upcoming: number;
    today: number;
    total: number;
};

type IssueSummary = {
    open: number;
    total: number;
};

export default function ResidentHome() {
    const router = useRouter();
    const { profile, currentRole } = useAuth();
    const [visitorSummary, setVisitorSummary] = useState<VisitorSummary>({ upcoming: 0, today: 0, total: 0 });
    const [issueSummary, setIssueSummary] = useState<IssueSummary>({ open: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Use unified visitor approval hook
    const {
        pendingVisitors,
        pendingCount,
        approve,
        deny,
        refresh: refreshVisitors,
        isLoading: visitorsLoading,
    } = useVisitorApproval({
        societyId: currentRole?.society_id,
        userId: profile?.id,
        unitId: currentRole?.unit_id,
        role: 'resident',
    });

    const loadData = useCallback(async () => {
        try {
            const userId = profile?.id;
            if (!userId) return;

            // Load visitor summary
            const { data: visitors } = await supabase
                .from('visitors')
                .select('id, status, expected_date')
                .eq('host_id', userId);

            const now = new Date();
            const today = now.toISOString().split('T')[0];

            const upcoming = visitors?.filter(v =>
                v.expected_date && v.expected_date >= today && ['pending', 'approved'].includes(v.status)
            ).length || 0;

            const todayVisitors = visitors?.filter(v => v.expected_date === today).length || 0;

            setVisitorSummary({
                upcoming,
                today: todayVisitors,
                total: visitors?.length || 0,
            });

            // Load issue summary
            const { data: issues } = await supabase
                .from('issues')
                .select('id, status')
                .eq('reported_by', userId);

            setIssueSummary({
                open: issues?.filter(i => i.status === 'open').length || 0,
                total: issues?.length || 0,
            });

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [profile?.id]);

    useEffect(() => {
        loadData();
    }, [profile?.id, loadData]);


    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadData();
            refreshVisitors();
        }, [loadData, refreshVisitors])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
        refreshVisitors();
    };

    const handleApprove = async (visitorId: string) => {
        const success = await approve(visitorId);
        if (success) {
            Alert.alert('✅ Approved', 'Visitor has been approved for entry. The guard will be notified.');
        } else {
            Alert.alert('Error', 'Failed to approve visitor. Please try again.');
        }
        return success;
    };

    const handleDeny = async (visitorId: string) => {
        const success = await deny(visitorId);
        if (success) {
            Alert.alert('Entry Denied', 'Visitor entry has been denied. The guard will be notified.');
        } else {
            Alert.alert('Error', 'Failed to deny visitor. Please try again.');
        }
        return success;
    };

    if (isLoading && visitorsLoading) {
        return <LoadingSpinner />;
    }

    // Inline unit format: "Name • Unit"
    const unitNumber = currentRole?.unit?.unit_number || 'N/A';
    const displayName = `${profile?.full_name || 'Resident'} • ${unitNumber}`;

    return (
        <View style={styles.container}>
            <PageHeader
                greeting="Welcome back"
                title={displayName}
                secondaryRightAction={{
                    icon: 'notifications-outline',
                    color: pendingCount > 0 ? '#f59e0b' : '#64748b',
                    onPress: () => router.push('/(resident)/notifications'),
                }}
                rightAction={{
                    icon: 'person-circle-outline',
                    color: '#3b82f6',
                    onPress: () => router.push('/(resident)/profile'),
                }}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
            >
                {/* Pending Approvals Section */}
                {pendingCount > 0 && (
                    <View style={styles.pendingSection}>
                        <View style={styles.pendingSectionHeader}>
                            <View style={styles.pendingTitleContainer}>
                                <Ionicons name="hourglass-outline" size={18} color="#f59e0b" />
                                <Text style={styles.pendingSectionTitle}>Pending Approvals</Text>
                            </View>
                            <View style={styles.pendingBadge}>
                                <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
                            </View>
                        </View>
                        {pendingVisitors.map((visitor) => (
                            <VisitorApprovalCard
                                key={visitor.id}
                                visitor={{
                                    id: visitor.id,
                                    visitor_name: visitor.visitor_name,
                                    visitor_phone: visitor.visitor_phone,
                                    unit_number: visitor.unit_number,
                                    purpose: visitor.purpose,
                                    status: visitor.status,
                                    created_at: visitor.created_at,
                                }}
                                role="resident"
                                onApprove={() => handleApprove(visitor.id)}
                                onDeny={() => handleDeny(visitor.id)}
                            />
                        ))}
                    </View>
                )}

                <SectionTitle>Overview</SectionTitle>

                <StatRow>
                    <StatCard
                        icon="people-outline"
                        iconColor="#3b82f6"
                        value={visitorSummary.upcoming + pendingCount}
                        label="Upcoming"
                        backgroundColor="#dbeafe"
                    />
                    <StatCard
                        icon="calendar-outline"
                        iconColor="#10b981"
                        value={visitorSummary.today}
                        label="Today"
                        backgroundColor="#d1fae5"
                    />
                    <StatCard
                        icon="construct-outline"
                        iconColor="#ef4444"
                        value={issueSummary.open}
                        label="Open Issues"
                        backgroundColor="#fee2e2"
                    />
                </StatRow>

                <SectionTitle>Quick Actions</SectionTitle>

                {/* Primary action - kept big */}
                <ActionButton
                    icon="qr-code"
                    title="Pre-approve Visitor"
                    subtitle="Generate QR code or OTP"
                    variant="primary"
                    onPress={() => router.push('/(resident)/pre-approve-visitor')}
                />

                {/* Secondary actions - compact mode */}
                <ActionButton
                    icon="list-outline"
                    title="My Visitors"
                    variant="success"
                    compact
                    onPress={() => router.push('/(resident)/my-visitors')}
                />

                <ActionButton
                    icon="construct-outline"
                    title="My Issues"
                    badge={issueSummary.open > 0 ? issueSummary.open : undefined}
                    variant="danger"
                    compact
                    onPress={() => router.push('/(resident)/my-issues')}
                />

                <ActionButton
                    icon="cube-outline"
                    title="My Parcels"
                    variant="warning"
                    compact
                    onPress={() => router.push('/(resident)/my-parcels')}
                />

                <ActionButton
                    icon="megaphone-outline"
                    title="Announcements"
                    variant="info"
                    compact
                    onPress={() => router.push('/(resident)/announcements')}
                />

                <ActionButton
                    icon="people-outline"
                    title="Manage Family"
                    variant="info"
                    compact
                    onPress={() => router.push('/(resident)/family')}
                />

                <ActionButton
                    icon="add-circle-outline"
                    title="Raise Issue"
                    variant="danger"
                    compact
                    onPress={() => router.push('/(resident)/raise-issue')}
                />

                <View style={styles.spacer} />
            </ScrollView>

            {/* Floating CTA */}
            <TouchableOpacity
                style={styles.floatingCta}
                onPress={() => router.push('/(resident)/pre-approve-visitor')}
                activeOpacity={0.9}
            >
                <Ionicons name="add" size={22} color="#A3E635" />
                <Text style={styles.floatingCtaText}>Pre-approve Visitor</Text>
            </TouchableOpacity>
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
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingBottom: 80, // Space for floating CTA
    },
    pendingSection: {
        marginBottom: 12,
        marginTop: 8,
    },
    pendingSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    pendingTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pendingSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    pendingBadge: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    pendingBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    spacer: {
        height: 20,
    },
    floatingCta: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: '#101A33',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(163, 230, 53, 0.35)',
        shadowColor: '#0B1120',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    floatingCtaText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
