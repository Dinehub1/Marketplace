/**
 * CycleAI Pro paywall.
 *
 * Sold only through App Store / Google Play billing (via RevenueCat): Pro unlocks digital features
 * inside the app, which Guideline 3.1.1 and Play's payments policy reserve for store billing.
 *
 * What review checks on this screen, and where it is handled:
 *   - prices are the store's own localized strings (getPlans), never hard-coded ones;
 *   - a visible Restore Purchases button;
 *   - auto-renewal terms, plus Terms of Use and Privacy Policy links (constants/legal.ts);
 *   - a way out: the close button, since a paywall that cannot be dismissed is a rejection.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MANAGE_SUBSCRIPTION_URL, PRIVACY_POLICY_URL, STORE_ACCOUNT, TERMS_URL } from '@/constants/legal';
import { BorderRadius, Colors, Fonts, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSubscription } from '@/hooks/use-subscription';
import type { Plan } from '@/services/purchases';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'sparkles',
    title: 'AI cycle predictions',
    body: 'Next period and cycle length estimated from your own logs, with a confidence score.',
  },
  {
    icon: 'heart-circle',
    title: 'Fertile window estimates',
    body: 'See your likely fertile days ahead of time.',
  },
  {
    icon: 'analytics',
    title: 'Personalised insights',
    body: 'Patterns in your symptoms, mood and flow, explained in plain words.',
  },
  {
    icon: 'bulb',
    title: 'Daily AI tips',
    body: 'Suggestions that follow your phase, refreshed whenever you log.',
  },
];

export default function PaywallScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();
  const { isPro, subscription, plans, loading, purchasing, purchase, restore } = useSubscription();

  const [selected, setSelected] = useState<string | null>(null);

  // Default to the annual plan once the store has answered.
  useEffect(() => {
    if (selected || plans.length === 0) return;
    setSelected((plans.find((p) => p.period === 'annual') ?? plans[0]).id);
  }, [plans, selected]);

  const saving = useMemo(() => annualSaving(plans), [plans]);
  const chosen = plans.find((p) => p.id === selected) ?? null;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const handlePurchase = async () => {
    if (!chosen) return;
    try {
      const result = await purchase(chosen.id);
      if (result.isPro) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('Welcome to Pro', 'Your AI insights are unlocked.', [{ text: 'Continue', onPress: close }]);
      }
    } catch (err: any) {
      if (err?.message === 'Purchase cancelled') return;
      Alert.alert('Purchase failed', err?.message || 'Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      const result = await restore();
      Alert.alert(
        result.isPro ? 'Purchases restored' : 'Nothing to restore',
        result.isPro
          ? 'Your Pro subscription is active again.'
          : `No active CycleAI Pro subscription was found for this ${STORE_ACCOUNT}.`,
        result.isPro ? [{ text: 'Continue', onPress: close }] : undefined
      );
    } catch (err: any) {
      Alert.alert('Restore failed', err?.message || 'Please try again.');
    }
  };

  const open = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => {});

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={close}
          style={[styles.close, { backgroundColor: colors.backgroundSecondary }]}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primaryLight, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Ionicons name="sparkles" size={36} color="#ffffff" />
        </LinearGradient>

        <Text style={[styles.title, { color: colors.text }]}>CycleAI Pro</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isPro ? 'Your AI insights are unlocked.' : 'Understand your cycle with AI built on your own logs.'}
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefit}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '1f' }]}>
                <Ionicons name={b.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>{b.title}</Text>
                <Text style={[styles.benefitBody, { color: colors.textSecondary }]}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {isPro ? (
          <View style={[styles.activeCard, { backgroundColor: colors.backgroundTertiary, borderColor: colors.primary }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, { color: colors.text }]}>Pro is active</Text>
              {subscription.expirationDate && (
                <Text style={[styles.benefitBody, { color: colors.textSecondary }]}>
                  {subscription.willRenew ? 'Renews' : 'Ends'} on {formatDate(subscription.expirationDate)}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => open(MANAGE_SUBSCRIPTION_URL)} accessibilityRole="link">
              <Text style={[styles.link, { color: colors.primary }]}>Manage</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ActivityIndicator style={{ marginVertical: Spacing.xl }} color={colors.primary} />
        ) : plans.length === 0 ? (
          <Text style={[styles.unavailable, { color: colors.textSecondary }]}>
            Subscriptions aren&apos;t available right now. Please try again later.
          </Text>
        ) : (
          <View style={styles.plans}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={plan.id === selected}
                saving={plan.period === 'annual' ? saving : null}
                colors={colors}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelected(plan.id);
                }}
              />
            ))}
          </View>
        )}

        {!isPro && plans.length > 0 && (
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={!chosen || purchasing}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: colors.primary, opacity: !chosen || purchasing ? 0.6 : 1 }]}
            accessibilityRole="button"
          >
            {purchasing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.ctaText}>{chosen?.trial ? `Start ${chosen.trial}` : 'Subscribe'}</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={styles.restore} accessibilityRole="button">
          <Text style={[styles.link, { color: colors.primary }]}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={[styles.legal, { color: colors.textTertiary }]}>
          {chosen?.trial
            ? `After the ${chosen.trial}, ${chosen.price.replace(' / ', ' per ')} is charged to your ${STORE_ACCOUNT} account. `
            : `Payment is charged to your ${STORE_ACCOUNT} account when you confirm. `}
          The subscription renews automatically unless cancelled at least 24 hours before the end of the
          current period. Manage or cancel any time in your {STORE_ACCOUNT} subscription settings. CycleAI
          offers estimates for information only and is not medical advice or contraception.
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => open(TERMS_URL)} accessibilityRole="link">
            <Text style={[styles.legalLink, { color: colors.textSecondary }]}>Terms of Use</Text>
          </TouchableOpacity>
          {PRIVACY_POLICY_URL ? (
            <>
              <Text style={{ color: colors.textTertiary }}>·</Text>
              <TouchableOpacity onPress={() => open(PRIVACY_POLICY_URL)} accessibilityRole="link">
                <Text style={[styles.legalLink, { color: colors.textSecondary }]}>Privacy Policy</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  plan,
  selected,
  saving,
  colors,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  saving: number | null;
  colors: (typeof Colors)['light'];
  onPress: () => void;
}) {
  const label = plan.badge ?? (saving ? `SAVE ${saving}%` : null);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.plan,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.backgroundTertiary : colors.cardBackground,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.planHead}>
          <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
          {label && (
            <View style={[styles.planBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.planBadgeText}>{label}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.benefitBody, { color: colors.textSecondary }]}>
          {plan.trial ? `${plan.trial}, then ` : ''}
          {plan.price}
        </Text>
        {saving && plan.period === 'annual' && plan.badge && (
          <Text style={[styles.saving, { color: colors.success }]}>Save {saving}% vs monthly</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

/** Percent saved by paying yearly, from the store's own numbers; null when they are unknown. */
function annualSaving(plans: Plan[]): number | null {
  const monthly = plans.find((p) => p.period === 'monthly')?.amount;
  const annual = plans.find((p) => p.period === 'annual')?.amount;
  if (!monthly || !annual) return null;
  const pct = Math.round((1 - annual / (monthly * 12)) * 100);
  return pct > 0 ? pct : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  close: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xl, alignItems: 'stretch' },
  badge: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontFamily: Fonts.bold, fontSize: 30, lineHeight: 38, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: Spacing.xs },
  benefits: { marginTop: Spacing.lg, gap: Spacing.md },
  benefit: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  benefitIcon: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontFamily: Fonts.semibold, fontSize: 16, lineHeight: 22 },
  benefitBody: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  plans: { marginTop: Spacing.lg, gap: Spacing.sm },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  planTitle: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 24 },
  planBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  planBadgeText: { fontFamily: Fonts.bold, fontSize: 11, color: '#ffffff', letterSpacing: 0.5 },
  saving: { fontFamily: Fonts.semibold, fontSize: 13, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  activeCard: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  unavailable: { fontFamily: Fonts.regular, fontSize: 15, textAlign: 'center', marginVertical: Spacing.xl },
  cta: {
    marginTop: Spacing.lg,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: Fonts.bold, fontSize: 17, color: '#ffffff' },
  restore: { alignSelf: 'center', paddingVertical: Spacing.md },
  link: { fontFamily: Fonts.semibold, fontSize: 15 },
  legal: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  legalLink: { fontFamily: Fonts.medium, fontSize: 12, textDecorationLine: 'underline' },
});
