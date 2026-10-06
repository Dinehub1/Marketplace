/**
 * RevenueCat Subscription Service for Cycle Tracker
 * Connects Apple App Store (StoreKit) and Google Play Billing.
 *
 * Compliant with App Store Review Guideline 3.1.1 (In-App Purchases).
 *
 * Pro is granted only by an active `pro_access` entitlement from RevenueCat. The simulated
 * purchase below exists for development builds (`__DEV__`) running without a store, such as
 * Expo Go or the web; a store build never reaches it, so a declined card, a network error or a
 * missing product reports an error and unlocks nothing.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomerInfo } from 'react-native-purchases';

export interface SubscriptionTier {
  id: string;
  title: string;
  price: string;
  period: 'monthly' | 'annual';
  description: string;
  badge?: string;
}

export interface SubscriptionState {
  isPro: boolean;
  activeTier: string | null;
  expirationDate: string | null;
  willRenew: boolean;
}

export const TIERS: SubscriptionTier[] = [
  {
    id: 'cycle_pro_monthly',
    title: 'Monthly Pro',
    price: '$3.99 / mo',
    period: 'monthly',
    description: 'AI cycle predictions, fertile window estimates & personalised insights.',
  },
  {
    id: 'cycle_pro_annual',
    title: 'Annual Pro',
    price: '$29.99 / yr',
    period: 'annual',
    description: 'Everything in Monthly, billed once a year.',
    badge: 'BEST VALUE',
  },
];

/**
 * A plan as the paywall shows it. `price` is the store's own localized string when RevenueCat is
 * configured: Apple and Google both reject a paywall whose price differs from the one they charge,
 * so the TIERS prices are only a development stand-in.
 */
export interface Plan extends SubscriptionTier {
  /** Numeric price in the store currency, for the annual saving; null in the dev fallback. */
  amount: number | null;
  /** The intro offer as the store describes it (e.g. "7-day free trial"), or null. */
  trial: string | null;
}

const ENTITLEMENT = 'pro_access';
const DEV_STORAGE_KEY = 'cycle_tracker_dev_sub_state';
const FREE: SubscriptionState = { isPro: false, activeTier: null, expirationDate: null, willRenew: false };

/** Set once `configure` has run; every store call is skipped until then. */
let configured = false;

async function sdk() {
  return (await import('react-native-purchases')).default;
}

function stateFrom(info: CustomerInfo): SubscriptionState {
  const entitlement = info.entitlements.active[ENTITLEMENT];
  if (!entitlement) return FREE;
  return {
    isPro: true,
    activeTier: entitlement.productIdentifier,
    expirationDate: entitlement.expirationDate,
    willRenew: entitlement.willRenew,
  };
}

/**
 * Initialize RevenueCat SDK with platform-specific keys. Safe to call more than once.
 */
export async function initializePurchases(): Promise<void> {
  if (configured) return;
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;

  if (!apiKey) {
    if (!__DEV__) console.error('[RevenueCat] No API key in this build; purchases are unavailable.');
    return;
  }

  try {
    (await sdk()).configure({ apiKey });
    configured = true;
  } catch (err) {
    console.warn('[RevenueCat] Native SDK not linked (e.g. running in Expo Go):', err);
  }
}

/**
 * Get current subscription status. RevenueCat caches customer info on the device, so this
 * still answers offline; a build without a working SDK is treated as free.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionState> {
  if (configured) {
    try {
      return stateFrom(await (await sdk()).getCustomerInfo());
    } catch (err) {
      console.warn('[RevenueCat] Could not read customer info:', err);
      return FREE;
    }
  }
  return __DEV__ ? devState() : FREE;
}

/**
 * The plans to sell, priced by the store. Only plans RevenueCat actually offers are returned, so
 * a product missing from the store never shows up as a button that cannot be bought.
 */
export async function getPlans(): Promise<Plan[]> {
  if (!configured) {
    return __DEV__ ? TIERS.map((t) => ({ ...t, amount: null, trial: null })) : [];
  }
  const offerings = await (await sdk()).getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  const plans: Plan[] = [];
  for (const tier of TIERS) {
    const pkg = packages.find((p) => p.identifier === tier.id || p.product.identifier === tier.id);
    if (!pkg) continue;
    const intro = pkg.product.introPrice;
    plans.push({
      ...tier,
      price: `${pkg.product.priceString} / ${tier.period === 'annual' ? 'yr' : 'mo'}`,
      amount: pkg.product.price,
      trial:
        intro && intro.price === 0
          ? `${intro.periodNumberOfUnits}-${intro.periodUnit.toLowerCase()} free trial`
          : null,
    });
  }
  return plans;
}

/**
 * Purchase a subscription package via Apple StoreKit or Google Play Billing.
 * Throws on cancellation and on any failure; it never grants Pro without a store receipt.
 */
export async function purchaseSubscription(tierId: string): Promise<SubscriptionState> {
  if (!configured) {
    if (__DEV__) return devPurchase(tierId);
    throw new Error('Purchases are not available right now. Please try again later.');
  }

  const Purchases = await sdk();
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find(
    (p) => p.identifier === tierId || p.product.identifier === tierId
  );
  if (!pkg) throw new Error('This plan is not available right now.');

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return stateFrom(customerInfo);
  } catch (err: any) {
    if (err?.userCancelled || err?.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      throw new Error('Purchase cancelled');
    }
    throw new Error(err?.message || 'Purchase could not be completed');
  }
}

/**
 * Restore purchases — MANDATORY for Apple App Store Review
 */
export async function restorePurchases(): Promise<SubscriptionState> {
  if (!configured) {
    if (__DEV__) return devState();
    throw new Error('Purchases are not available right now. Please try again later.');
  }
  return stateFrom(await (await sdk()).restorePurchases());
}

// ── Development-only simulation (never reached in a store build) ─────────────

async function devState(): Promise<SubscriptionState> {
  try {
    const raw = await AsyncStorage.getItem(DEV_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return FREE;
}

async function devPurchase(tierId: string): Promise<SubscriptionState> {
  console.log('[RevenueCat] Development build without a store: simulating purchase of', tierId);
  const state: SubscriptionState = {
    isPro: true,
    activeTier: tierId,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    willRenew: true,
  };
  await AsyncStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(state));
  return state;
}
