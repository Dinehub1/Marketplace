import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { colors, spacing, radii } from '@/lib/theme';

interface VerifyResult {
  fastag_id: string;
  status: string;
  vehicle_class: string;
  issuer_bank: string;
  eligible: boolean;
}

export default function BuyPassScreen() {
  const { session, fetchActivePass } = useAppStore();
  const [vrn, setVrn] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<VerifyResult | null>(null);
  const [paying, setPaying] = useState(false);

  const verifyVehicle = async () => {
    if (vrn.length < 6) return Alert.alert('Enter a valid Vehicle Registration Number');
    setVerifying(true);
    // Simulate API call (replace with SurePass API in production)
    await new Promise((r) => setTimeout(r, 1500));
    setVerified({
      fastag_id: '880192384729' + Math.floor(Math.random() * 10),
      status: 'Active',
      vehicle_class: 'Private Car',
      issuer_bank: 'ICICI Bank',
      eligible: true,
    });
    setVerifying(false);
  };

  const handlePay = async () => {
    if (!verified || !session) return;
    setPaying(true);

    try {
      // Try opening UPI app (non-blocking for MVP)
      const upiUrl = `upi://pay?pa=highwaypass@upi&pn=HighwayPass&am=3000&cu=INR&tn=AnnualFASTagPass-${vrn.toUpperCase()}`;
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);
      }

      // Create pass record
      const { data: pass, error: passError } = await supabase
        .from('passes')
        .insert({
          user_id: session.user.id,
          vrn: vrn.toUpperCase(),
          fastag_id: verified.fastag_id,
          vehicle_class: verified.vehicle_class,
          issuer_bank: verified.issuer_bank,
        })
        .select()
        .single();

      if (passError) {
        setPaying(false);
        return Alert.alert('Error', passError.message);
      }

      // Create payment record
      await supabase.from('payments').insert({
        user_id: session.user.id,
        pass_id: pass.id,
        amount: 3000,
        method: 'UPI',
        status: 'SUCCESS',
        reference_id: `HP${Date.now()}`,
      });

      // Refresh active pass so My Pass tab updates immediately
      await fetchActivePass();

      Alert.alert('🎉 Pass Activated!', 'Your Annual Pass is now active. Enjoy 200 toll-free trips!');
      setVrn('');
      setVerified(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.header}>Buy Annual Pass</Text>

      {/* Pass Card */}
      <View style={s.passCard}>
        <View style={s.passCardBorder}>
          <Text style={s.passTitle}>FASTag Annual Pass</Text>
          <Text style={s.passPrice}>₹3,000</Text>
          <View style={s.benefitList}>
            {[
              '200 toll-free trips',
              'Valid for 1 year',
              'All National Highways & Expressways',
              'Private vehicles only',
            ].map((b, i) => (
              <View key={i} style={s.benefitRow}>
                <Text style={s.checkmark}>✅</Text>
                <Text style={s.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
          <Text style={s.passNote}>Whichever limit is reached first</Text>
        </View>
      </View>

      {/* Vehicle Form */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Vehicle Details</Text>
        <Text style={s.inputLabel}>Vehicle Registration Number</Text>
        <TextInput
          style={s.input}
          value={vrn}
          onChangeText={setVrn}
          placeholder="MH01AB1234"
          placeholderTextColor={colors.gray500}
          autoCapitalize="characters"
          onSubmitEditing={verifyVehicle}
        />

        {!verified && !verifying && (
          <TouchableOpacity style={s.verifyBtn} onPress={verifyVehicle}>
            <Text style={s.verifyBtnText}>Verify Vehicle</Text>
          </TouchableOpacity>
        )}

        {verifying && (
          <View style={s.verifyingRow}>
            <ActivityIndicator color={colors.green} />
            <Text style={s.verifyingText}>Verifying...</Text>
          </View>
        )}

        {verified && (
          <View style={s.verifiedCard}>
            <View style={s.verifiedHeader}>
              <Text style={s.verifiedBadge}>✅ Verified</Text>
            </View>
            <DetailRow label="FASTag ID" value={verified.fastag_id} />
            <DetailRow label="Status" value={verified.status} />
            <DetailRow label="Vehicle" value={verified.vehicle_class} />
            <DetailRow label="Issuer" value={verified.issuer_bank} />
          </View>
        )}
      </View>

      {/* Price + Pay */}
      {verified && (
        <View style={s.card}>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Annual Pass Fee</Text>
            <Text style={s.priceValue}>₹3,000</Text>
          </View>
          <TouchableOpacity style={s.payBtn} onPress={handlePay} disabled={paying}>
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.payBtnText}>Pay ₹3,000</Text>
            )}
          </TouchableOpacity>
          <Text style={s.poweredBy}>Powered by HighwayPass • Bank Distribution Partner</Text>
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  header: { fontSize: 24, fontWeight: '700', color: colors.white, marginTop: spacing.xxl, marginBottom: spacing.lg },

  passCard: { marginBottom: spacing.lg },
  passCardBorder: { borderWidth: 1.5, borderColor: colors.gold, borderRadius: radii.lg, padding: spacing.lg, backgroundColor: 'rgba(245,158,11,0.05)' },
  passTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  passPrice: { fontSize: 42, fontWeight: '800', color: colors.white, marginVertical: spacing.sm },
  benefitList: { gap: spacing.sm, marginTop: spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkmark: { fontSize: 14 },
  benefitText: { fontSize: 14, color: colors.gray300 },
  passNote: { fontSize: 11, color: colors.gray500, marginTop: spacing.md, fontStyle: 'italic' },

  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.bgCardBorder, marginBottom: spacing.lg },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.white, marginBottom: spacing.md },
  inputLabel: { fontSize: 13, color: colors.gray400, marginBottom: spacing.xs },
  input: { backgroundColor: colors.gray800, borderRadius: radii.md, padding: spacing.md, color: colors.white, fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  verifyBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.green, borderRadius: radii.md, paddingVertical: 12, alignItems: 'center', marginTop: spacing.md },
  verifyBtnText: { color: colors.green, fontSize: 14, fontWeight: '700' },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, justifyContent: 'center' },
  verifyingText: { color: colors.green, fontSize: 14, fontWeight: '600' },

  verifiedCard: { backgroundColor: colors.greenLight, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.md },
  verifiedHeader: { marginBottom: spacing.sm },
  verifiedBadge: { color: colors.green, fontWeight: '700', fontSize: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 13, color: colors.gray400 },
  detailValue: { fontSize: 13, color: colors.white, fontWeight: '600' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  priceLabel: { fontSize: 16, color: colors.gray300 },
  priceValue: { fontSize: 16, fontWeight: '700', color: colors.white },
  payBtn: { backgroundColor: colors.green, borderRadius: radii.md, paddingVertical: 16, alignItems: 'center' },
  payBtnText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  poweredBy: { textAlign: 'center', color: colors.gray500, fontSize: 11, marginTop: spacing.md },
});
