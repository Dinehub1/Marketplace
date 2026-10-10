import { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";

/**
 * Entitlement IDs
 */
export const ENTITLEMENT_PDF_PRO = "pdf_pro";
export const ENTITLEMENT_ALL_ACCESS = "brandcollabs_all_access";

let configured = false;
let configureAttempted = false;

/**
 * Resolves the appropriate RevenueCat public API key for the current platform.
 */
function getPlatformApiKey(): string | null {
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || null;
  }
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || null;
  }
  return null;
}

/**
 * Initializes RevenueCat SDK with platform-specific keys and optional Supabase user ID.
 *
 * Gracefully degrades if keys are missing or on web:
 * - Logs diagnostic info in DEV mode
 * - Leaves purchases disabled
 * - NEVER enables mock entitlements in production
 */
export async function initPurchases(appUserId?: string | null): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  if (configured) {
    if (appUserId) {
      try {
        await Purchases.logIn(appUserId);
      } catch (err) {
        if (__DEV__) {
          console.warn("[Purchases] Failed to log in with user ID:", err);
        }
      }
    }
    return true;
  }

  if (configureAttempted) {
    return configured;
  }

  configureAttempted = true;
  const apiKey = getPlatformApiKey();

  if (!apiKey) {
    if (__DEV__) {
      console.log(
        `[Purchases] No RevenueCat API key provided for platform "${Platform.OS}". ` +
          "In-app purchases and subscriptions will remain disabled until configured.",
      );
    }
    return false;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    } else {
      Purchases.setLogLevel(LOG_LEVEL.WARN);
    }

    await Purchases.configure({
      apiKey,
      appUserID: appUserId || null,
    });

    configured = true;
    return true;
  } catch (error) {
    console.error("[Purchases] Failed to configure RevenueCat:", error);
    return false;
  }
}

/**
 * Returns whether RevenueCat has been successfully initialized.
 */
export function isPurchasesConfigured(): boolean {
  return configured;
}

/**
 * Fetches the default offering for paywalls.
 */
export async function getDefaultOffering(): Promise<PurchasesOffering | null> {
  if (!configured) {
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? offerings.all?.["default"] ?? null;
  } catch (error) {
    if (__DEV__) {
      console.warn("[Purchases] Failed to fetch offerings:", error);
    }
    return null;
  }
}

export type PurchaseResult =
  | { success: true; customerInfo: CustomerInfo }
  | { success: false; userCancelled: boolean; error: string };

/**
 * Purchases a selected package (subscription or consumable).
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!configured) {
    return {
      success: false,
      userCancelled: false,
      error: "Purchases are currently unavailable on this device.",
    };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error: any) {
    const userCancelled = Boolean(error.userCancelled);
    return {
      success: false,
      userCancelled,
      error: userCancelled ? "Purchase cancelled" : error.message || "Purchase failed",
    };
  }
}

export type RestoreResult =
  | { success: true; customerInfo: CustomerInfo }
  | { success: false; error: string };

/**
 * Restores previously purchased in-app purchases and subscriptions.
 * Required by Apple App Store Review Guidelines.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!configured) {
    return {
      success: false,
      error: "Purchases are currently unavailable on this device.",
    };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Could not restore purchases at this time.",
    };
  }
}

/**
 * Checks whether an entitlement is active.
 *
 * CRITICAL SECURITY INVARIANT:
 * If Purchases is not configured or in production without an active store receipt,
 * this function MUST return false. Never unlock features in production without
 * verified entitlement.
 */
export async function checkEntitlement(entitlementId: string): Promise<boolean> {
  if (!configured) {
    return false;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const active = customerInfo.entitlements.active;
    return Boolean(active[entitlementId] || active[ENTITLEMENT_ALL_ACCESS]);
  } catch (error) {
    if (__DEV__) {
      console.warn(`[Purchases] Failed to check entitlement "${entitlementId}":`, error);
    }
    return false;
  }
}

/**
 * Convenience check for PDF Pro access.
 */
export async function checkPdfPro(): Promise<boolean> {
  return checkEntitlement(ENTITLEMENT_PDF_PRO);
}

/**
 * Links a Supabase / Auth user ID with RevenueCat on sign in.
 * Returns CustomerInfo associated with this identified user.
 */
export async function syncPurchasesUser(supabaseUserId: string): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    const { customerInfo } = await Purchases.logIn(supabaseUserId);
    if (__DEV__) {
      console.log(`[Purchases] Successfully linked user "${supabaseUserId}" with RevenueCat.`);
    }
    return customerInfo;
  } catch (error) {
    if (__DEV__) {
      console.warn("[Purchases] Error syncing user with RevenueCat:", error);
    }
    return null;
  }
}

/**
 * Resets user ID to anonymous on sign out.
 */
export async function resetPurchasesUser(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    const customerInfo = await Purchases.logOut();
    if (__DEV__) {
      console.log("[Purchases] Logged out from RevenueCat (reset to anonymous device ID).");
    }
    return customerInfo;
  } catch (error) {
    if (__DEV__) {
      console.warn("[Purchases] Error logging out user from RevenueCat:", error);
    }
    return null;
  }
}

/**
 * Automatically subscribes a Supabase client's auth state changes to RevenueCat.
 * Call this once during app initialization if using `@supabase/supabase-js`.
 */
export function setupSupabasePurchasesSync(supabaseClient: {
  auth: {
    getSession: () => Promise<{ data: { session: { user?: { id?: string } } | null } }>;
    onAuthStateChange: (
      callback: (event: string, session: { user?: { id?: string } } | null) => void
    ) => { data: { subscription: { unsubscribe: () => void } } };
  };
}) {
  // Check active session immediately
  supabaseClient.auth
    .getSession()
    .then(({ data: { session } }) => {
      if (session?.user?.id) {
        void syncPurchasesUser(session.user.id);
      }
    })
    .catch(() => {});

  // Subscribe to ongoing auth state transitions (LOGIN, LOGOUT, TOKEN_REFRESHED)
  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user?.id) {
      void syncPurchasesUser(session.user.id);
    } else if (event === "SIGNED_OUT") {
      void resetPurchasesUser();
    }
  });

  return () => subscription.unsubscribe();
}

/**
 * React hook to reactively check and track an entitlement's status.
 */
export function useEntitlement(entitlementId: string): {
  isPro: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!configured) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    try {
      const active = await checkEntitlement(entitlementId);
      setIsPro(active);
    } catch {
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, [entitlementId]);

  useEffect(() => {
    let mounted = true;

    // Listen for real-time customer info changes (renewals, cancellations, purchases)
    const listener = (info: CustomerInfo) => {
      if (!mounted) return;
      const active = info.entitlements.active;
      const hasAccess = Boolean(active[entitlementId] || active[ENTITLEMENT_ALL_ACCESS]);
      setIsPro(hasAccess);
      setLoading(false);
    };

    if (configured) {
      Purchases.addCustomerInfoUpdateListener(listener);
    }

    const checkInitialStatus = async () => {
      if (!configured) {
        if (mounted) {
          setIsPro(false);
          setLoading(false);
        }
        return;
      }
      try {
        const active = await checkEntitlement(entitlementId);
        if (mounted) {
          setIsPro(active);
        }
      } catch {
        if (mounted) {
          setIsPro(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void checkInitialStatus();

    return () => {
      mounted = false;
      if (configured) {
        Purchases.removeCustomerInfoUpdateListener(listener);
      }
    };
  }, [entitlementId]);

  return { isPro, loading, refresh };
}

/**
 * React hook for PDF Pro status.
 */
export function usePdfPro() {
  return useEntitlement(ENTITLEMENT_PDF_PRO);
}
