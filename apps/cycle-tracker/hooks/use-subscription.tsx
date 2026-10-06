/**
 * Subscription state for the whole app.
 *
 * One provider, mounted in app/_layout.tsx, owns the RevenueCat state. A hook per screen would give
 * each screen its own copy, and a purchase on the paywall would leave Insights still locked until
 * it remounted.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getPlans,
  getSubscriptionStatus,
  initializePurchases,
  Plan,
  purchaseSubscription,
  restorePurchases,
  SubscriptionState,
} from '@/services/purchases';

type SubscriptionContextValue = {
  isPro: boolean;
  subscription: SubscriptionState;
  plans: Plan[];
  loading: boolean;
  purchasing: boolean;
  error: string | null;
  purchase: (tierId: string) => Promise<SubscriptionState>;
  restore: () => Promise<SubscriptionState>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    activeTier: null,
    expirationDate: null,
    willRenew: false,
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initializePurchases();
      const [status, available] = await Promise.all([
        getSubscriptionStatus(),
        getPlans().catch((err) => {
          console.warn('[Subscription] Could not load plans:', err);
          return [] as Plan[];
        }),
      ]);
      if (mounted) {
        setState(status);
        setPlans(available);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const purchase = useCallback(async (tierId: string) => {
    try {
      setPurchasing(true);
      setError(null);
      const updated = await purchaseSubscription(tierId);
      setState(updated);
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Purchase could not be completed');
      throw err;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      setPurchasing(true);
      setError(null);
      const restored = await restorePurchases();
      setState(restored);
      return restored;
    } catch (err: any) {
      setError(err?.message || 'Could not restore purchases');
      throw err;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const value = useMemo(
    () => ({ isPro: state.isPro, subscription: state, plans, loading, purchasing, error, purchase, restore }),
    [state, plans, loading, purchasing, error, purchase, restore]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside <SubscriptionProvider>');
  return ctx;
}
