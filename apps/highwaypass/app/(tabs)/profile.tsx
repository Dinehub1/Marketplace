import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { colors, spacing, radii } from '@/lib/theme';

export default function ProfileScreen() {
    const { session } = useAppStore();
    const [passes, setPasses] = useState<any[]>([]);

    useEffect(() => {
        if (!session) return;
        supabase
            .from('passes')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => setPasses(data || []));
    }, [session]);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => supabase.auth.signOut() },
        ]);
    };

    const phone = session?.user?.phone || '';

    return (
        <ScrollView style={s.container} contentContainerStyle={s.scroll}>
            <Text style={s.header}>Profile</Text>

            {/* User Card */}
            <View style={s.userCard}>
                <View style={s.avatar}>
                    <Text style={s.avatarText}>{phone.slice(-2)}</Text>
                </View>
                <Text style={s.userName}>{phone}</Text>
                <Text style={s.userPhone}>HighwayPass User</Text>
            </View>

            {/* Purchase History */}
            {passes.length > 0 && (
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Purchase History</Text>
                    {passes.map((p) => (
                        <View key={p.id} style={s.historyCard}>
                            <View style={s.historyHeader}>
                                <Text style={s.historyTitle}>Annual Pass</Text>
                                <View style={[s.badge, p.status === 'ACTIVE' ? s.badgeGreen : s.badgeGray]}>
                                    <Text style={[s.badgeText, p.status === 'ACTIVE' ? s.badgeTextGreen : s.badgeTextGray]}>{p.status}</Text>
                                </View>
                            </View>
                            <Text style={s.historyVrn}>{p.vrn}</Text>
                            <View style={s.historyMeta}>
                                <Text style={s.historyMetaText}>₹{p.price}</Text>
                                <Text style={s.historyMetaText}>•</Text>
                                <Text style={s.historyMetaText}>{new Date(p.created_at).toLocaleDateString('en-IN')}</Text>
                                <Text style={s.historyMetaText}>•</Text>
                                <Text style={s.historyMetaText}>{p.trips_used}/{p.trips_total} trips</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Settings */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Settings</Text>
                {[
                    { icon: '🔔', label: 'Notifications' },
                    { icon: '📄', label: 'Terms & Conditions' },
                    { icon: '🔒', label: 'Privacy Policy' },
                    { icon: '❓', label: 'Help & FAQs' },
                    { icon: '📞', label: 'Helpline: 1033' },
                ].map((item, i) => (
                    <TouchableOpacity key={i} style={s.settingsRow}>
                        <Text style={s.settingsIcon}>{item.icon}</Text>
                        <Text style={s.settingsLabel}>{item.label}</Text>
                        <Text style={s.settingsChevron}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout */}
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                <Text style={s.logoutText}>🚪  Logout</Text>
            </TouchableOpacity>

            <Text style={s.version}>HighwayPass v1.0.0</Text>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, paddingBottom: 100 },
    header: { fontSize: 24, fontWeight: '700', color: colors.white, marginTop: spacing.xxl, marginBottom: spacing.lg },

    userCard: { alignItems: 'center', marginBottom: spacing.xl },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gray700, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
    avatarText: { fontSize: 24, fontWeight: '800', color: colors.green },
    userName: { fontSize: 18, fontWeight: '700', color: colors.white },
    userPhone: { fontSize: 13, color: colors.gray400, marginTop: 2 },

    section: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.gray400, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },

    historyCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.bgCardBorder, marginBottom: spacing.sm },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyTitle: { fontSize: 15, fontWeight: '700', color: colors.white },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm },
    badgeGreen: { backgroundColor: colors.greenLight },
    badgeGray: { backgroundColor: 'rgba(100,116,139,0.2)' },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    badgeTextGreen: { color: colors.green },
    badgeTextGray: { color: colors.gray400 },
    historyVrn: { fontSize: 13, color: colors.gray300, fontWeight: '600', marginTop: 4, letterSpacing: 1 },
    historyMeta: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
    historyMetaText: { fontSize: 12, color: colors.gray500 },

    settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.bgCardBorder },
    settingsIcon: { fontSize: 18, marginRight: spacing.md },
    settingsLabel: { flex: 1, fontSize: 15, color: colors.gray300 },
    settingsChevron: { fontSize: 20, color: colors.gray500 },

    logoutBtn: { marginTop: spacing.lg, paddingVertical: 14, alignItems: 'center' },
    logoutText: { fontSize: 15, color: colors.red, fontWeight: '600' },

    version: { textAlign: 'center', color: colors.gray500, fontSize: 11, marginTop: spacing.lg },
});
