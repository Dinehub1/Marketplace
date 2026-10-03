import { useAppStore } from '@/lib/store';
import { colors, radii, spacing } from '@/lib/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

function ProgressRing({ used, total }: { used: number; total: number }) {
    const size = 160;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = (used / total) * circumference;

    return (
        <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.gray700} strokeWidth={strokeWidth} fill="none" />
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.green} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round" />
            </Svg>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: colors.white }}>{used}</Text>
                <Text style={{ fontSize: 13, color: colors.gray400 }}>of {total} trips</Text>
            </View>
        </View>
    );
}

export default function MyPassScreen() {
    const { activePass, fetchActivePass } = useAppStore();

    useFocusEffect(
        useCallback(() => {
            fetchActivePass();
        }, [])
    );

    if (!activePass) {
        return (
            <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🎫</Text>
                <Text style={s.emptyTitle}>No Active Pass</Text>
                <Text style={s.emptyText}>Buy an Annual Pass to see it here!</Text>
            </View>
        );
    }

    const daysLeft = Math.max(0, Math.ceil((new Date(activePass.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const tripsLeft = activePass.trips_total - activePass.trips_used;
    const estSaved = activePass.trips_used * 65; // avg toll ₹65

    return (
        <ScrollView style={s.container} contentContainerStyle={s.scroll}>
            <Text style={s.header}>My Pass</Text>

            {/* Pass Card */}
            <View style={s.passCard}>
                <View style={s.statusRow}>
                    <View style={s.statusBadge}>
                        <Text style={s.statusText}>ACTIVE</Text>
                    </View>
                    <Text style={s.passTitleSmall}>FASTag Annual Pass</Text>
                </View>
                <Text style={s.vrn}>{activePass.vrn}</Text>

                <ProgressRing used={activePass.trips_used} total={activePass.trips_total} />

                <View style={s.validityRow}>
                    <Text style={s.validityLabel}>Valid until</Text>
                    <Text style={s.validityValue}>{new Date(activePass.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
            </View>

            {/* Quick Stats */}
            <View style={s.statsRow}>
                <View style={s.statCard}>
                    <Text style={s.statEmoji}>💰</Text>
                    <Text style={s.statValue}>₹{estSaved.toLocaleString()}</Text>
                    <Text style={s.statLabel}>Saved</Text>
                </View>
                <View style={s.statCard}>
                    <Text style={s.statEmoji}>🛣️</Text>
                    <Text style={s.statValue}>{activePass.trips_used}</Text>
                    <Text style={s.statLabel}>Trips</Text>
                </View>
                <View style={s.statCard}>
                    <Text style={s.statEmoji}>📅</Text>
                    <Text style={s.statValue}>{daysLeft}</Text>
                    <Text style={s.statLabel}>Days Left</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: 100 },
    header: { fontSize: 24, fontWeight: '700', color: colors.white, marginTop: spacing.xxl, marginBottom: spacing.lg },

    passCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.bgCardBorder, marginBottom: spacing.lg },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    statusBadge: { backgroundColor: colors.greenLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.sm },
    statusText: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    passTitleSmall: { color: colors.gray400, fontSize: 13, fontWeight: '500' },
    vrn: { fontSize: 20, fontWeight: '800', color: colors.white, letterSpacing: 2, marginTop: spacing.xs },

    validityRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.bgCardBorder, paddingTop: spacing.md },
    validityLabel: { color: colors.gray400, fontSize: 13 },
    validityValue: { color: colors.white, fontSize: 13, fontWeight: '600' },

    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.bgCardBorder },
    statEmoji: { fontSize: 24, marginBottom: spacing.xs },
    statValue: { fontSize: 18, fontWeight: '800', color: colors.white },
    statLabel: { fontSize: 11, color: colors.gray400, marginTop: 2 },

    emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
    emptyText: { fontSize: 14, color: colors.gray400, marginTop: spacing.xs },
});
