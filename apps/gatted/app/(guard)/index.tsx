import { VisitorApprovalCard } from '@/components';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
    ActivityFeed,
    GuardPageHeader,
    ShiftControls,
} from '@/components/guard';
import { useAuth } from '@/contexts/auth-context';
import { useActivityFeed, useGuardDashboard, useGuardShift } from '@/hooks';
import { useVisitorApproval } from '@/hooks/useVisitorApproval';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GuardHome() {
    const { profile, currentRole } = useAuth();
    const router = useRouter();

    const societyId = currentRole?.society_id;
    const guardId = profile?.id;

    // Hooks for data fetching
    const { stats, isLoading: statsLoading, refresh: refreshStats } = useGuardDashboard({ societyId });
    const { activities, isLoading: activitiesLoading, refresh: refreshActivities } = useActivityFeed({ societyId, limit: 5 });
    const {
        isShiftActive,
        shiftDuration,
        shiftStartTime,
        isLoading: shiftLoading,
        startShift,
        endShift,
        refresh: refreshShift
    } = useGuardShift({ guardId, societyId });

    // Visitor approval for pending/approved visitors
    const {
        approvedVisitors,
        pendingCount,
        approvedCount,
        checkIn,
        refresh: refreshVisitors,
        isLoading: visitorsLoading,
    } = useVisitorApproval({
        societyId,
        userId: guardId,
        role: 'guard',
    });

    const [refreshing, setRefreshing] = useState(false);

    const isLoading = statsLoading || activitiesLoading || shiftLoading || visitorsLoading;

    // Refresh on focus
    useFocusEffect(
        useCallback(() => {
            refreshStats();
            refreshActivities();
            refreshShift();
            refreshVisitors();
        }, [refreshStats, refreshActivities, refreshShift, refreshVisitors])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refreshStats(), refreshActivities(), refreshShift(), refreshVisitors()]);
        setRefreshing(false);
    }, [refreshStats, refreshActivities, refreshShift, refreshVisitors]);

    const handleStartShift = async () => {
        try {
            await startShift();
        } catch {
            Alert.alert('Error', 'Failed to start shift. Please try again.');
        }
    };

    const handleEndShift = async () => {
        Alert.alert(
            'End Shift',
            'Are you sure you want to end your shift?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Shift',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await endShift();
                        } catch {
                            Alert.alert('Error', 'Failed to end shift. Please try again.');
                        }
                    }
                },
            ]
        );
    };

    const handleEmergency = () => {
        router.push('/(guard)/panic');
    };

    const handleCheckIn = async (visitorId: string) => {
        if (!guardId) return false;
        const success = await checkIn(visitorId, guardId);
        if (success) {
            Alert.alert('✅ Checked In', 'Visitor has been checked in successfully.');
            refreshActivities();
        } else {
            Alert.alert('Error', 'Failed to check in visitor. Please try again.');
        }
        return success;
    };

    if (isLoading && !refreshing) {
        return <LoadingSpinner />;
    }

    const QuickActionItem = ({
        icon,
        title,
        color,
        onPress,
        badge
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        title: string;
        color: string;
        onPress: () => void;
        badge?: number;
    }) => (
        <TouchableOpacity
            style={styles.actionCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.actionIconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.actionTitle}>{title}</Text>
            {badge ? (
                <View style={[styles.actionBadge, { backgroundColor: color }]}>
                    <Text style={styles.actionBadgeText}>{badge}</Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );

    const StatItem = ({
        value,
        label,
        icon,
        color,
        bgColor
    }: {
        value: number | string;
        label: string;
        icon: keyof typeof Ionicons.glyphMap;
        color: string;
        bgColor: string;
    }) => (
        <View style={styles.statItem}>
            <View style={styles.statHeader}>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
                <View style={[styles.statIconChip, { backgroundColor: bgColor }]}>
                    <Ionicons name={icon} size={16} color={color} />
                </View>
            </View>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <GuardPageHeader
                guardName={profile?.full_name || 'Guard'}
                societyName={currentRole?.society?.name || 'Society'}
                isShiftActive={isShiftActive}
                shiftDuration={shiftDuration}
                onNotificationPress={() => router.push('/(guard)/notifications')}
                onProfilePress={() => router.push('/(guard)/profile')}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {/* Check In / Approval Section */}
                {(pendingCount > 0 || approvedCount > 0) && (
                    <View style={styles.tasksSection}>
                        {pendingCount > 0 && (
                            <TouchableOpacity style={styles.taskBanner} activeOpacity={0.8}>
                                <View style={styles.taskInfo}>
                                    <View style={[styles.taskIcon, { backgroundColor: '#fff7ed' }]}>
                                        <Ionicons name="hourglass" size={20} color="#f59e0b" />
                                    </View>
                                    <View>
                                        <Text style={styles.taskTitle}>Waiting for Approval</Text>
                                        <Text style={styles.taskSubtitle}>{pendingCount} visitors waiting</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        )}

                        {approvedCount > 0 && approvedVisitors.map((visitor) => (
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
                                role="guard"
                                onCheckIn={() => handleCheckIn(visitor.id)}
                            />
                        ))}
                    </View>
                )}

                {/* Compact Stats Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                </View>
                <View style={styles.statsGrid}>
                    <StatItem
                        value={stats.visitorsToday}
                        label="Visitors"
                        icon="people"
                        color="#3b82f6"
                        bgColor="#eff6ff"
                    />
                    <StatItem
                        value={stats.insideNow}
                        label="Inside"
                        icon="log-in"
                        color="#10b981"
                        bgColor="#ecfdf5"
                    />
                    <StatItem
                        value={stats.pendingParcels}
                        label="Parcels"
                        icon="cube"
                        color="#f59e0b"
                        bgColor="#fffbeb"
                    />
                    <StatItem
                        value={stats.openIssues}
                        label="Issues"
                        icon="alert-circle"
                        color="#ef4444"
                        bgColor="#fef2f2"
                    />
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>
                <View style={styles.actionsGrid}>
                    <QuickActionItem
                        title="New Entry"
                        icon="person-add"
                        color="#3b82f6"
                        onPress={() => router.push('/(guard)/walk-in')}
                    />
                    <QuickActionItem
                        title="Expected"
                        icon="qr-code"
                        color="#10b981"
                        onPress={() => router.push('/(guard)/expected-visitor')}
                    />
                    <QuickActionItem
                        title="Checkout"
                        icon="log-out"
                        color="#6366f1"
                        onPress={() => router.push('/(guard)/checkout')}
                    />
                    <QuickActionItem
                        title="Parcels"
                        icon="cube"
                        color="#f59e0b"
                        badge={stats.pendingParcels > 0 ? stats.pendingParcels : undefined}
                        onPress={() => router.push('/(guard)/parcels')}
                    />
                </View>

                {/* Emergency Button - Full Width */}
                <TouchableOpacity
                    style={styles.emergencyButton}
                    onPress={handleEmergency}
                    activeOpacity={0.8}
                >
                    <View style={styles.emergencyContent}>
                        <View style={styles.emergencyIcon}>
                            <Ionicons name="warning" size={24} color="#ef4444" />
                        </View>
                        <View>
                            <Text style={styles.emergencyTitle}>Emergency Alert</Text>
                            <Text style={styles.emergencySubtitle}>Notify residents & admin</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ef4444" />
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                </View>

                <ActivityFeed
                    activities={activities}
                    maxItems={5}
                    isLoading={activitiesLoading && !refreshing}
                />

                <ShiftControls
                    isShiftActive={isShiftActive}
                    shiftStartTime={shiftStartTime}
                    onStartShift={handleStartShift}
                    onEndShift={handleEndShift}
                    isLoading={shiftLoading}
                />

                <View style={styles.spacer} />
            </ScrollView>
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
    },
    scrollContent: {
        padding: 16,
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statItem: {
        width: '48%', // Approx half with gap
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    statIconChip: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },

    // Actions Grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        position: 'relative',
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        textAlign: 'center',
    },
    actionBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    actionBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },

    // Emergency
    emergencyButton: {
        marginTop: 20,
        backgroundColor: '#fef2f2',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    emergencyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emergencyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emergencyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ef4444',
    },
    emergencySubtitle: {
        fontSize: 12,
        color: '#f87171',
    },

    // Tasks / Pending
    tasksSection: {
        marginBottom: 8,
    },
    taskBanner: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    taskInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    taskIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    taskSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },

    spacer: {
        height: 48,
    },
});
