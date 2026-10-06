import { useCallback, useEffect, useState } from 'react';
import {
  getSubscriptionStatus,
  initializePurchases,
  purchaseSubscription,
  restorePurchases,
  SubscriptionState,
  SubscriptionTier,
  TIERS,
} from '@/services/purchases';

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    activeTier: null,
    expirationDate: null,
    willRenew: false,
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initializePurchases();
      const status = await getSubscriptionStatus();
      if (mounted) {
        setState(status);
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

  return {
    isPro: state.isPro,
    subscription: state,
    tiers: TIERS,
    loading,
    purchasing,
    error,
    purchase,
    restore,
  };
}
