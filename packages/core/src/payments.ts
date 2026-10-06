/**
 * @hermes/core - Unified Multi-Gateway Payment & In-App Purchase Utilities
 *
 * Provides shared types, contracts, and helpers across all apps in the monorepo:
 *  - Razorpay: Domestic UPI / Cards & International Cards for real-world/web services
 *  - PayPal: Direct International gateway (USD, EUR, GBP, etc.) for web & physical bookings
 *  - RevenueCat: In-App Purchases & Subscriptions for Apple App Store (StoreKit) & Google Play Billing
 *
 * ARCHITECTURAL RULE:
 *  - Digital goods & subscriptions inside mobile apps MUST use RevenueCat (Apple StoreKit / Google Play).
 *  - Real-world services (dining, rides, doctor visits) and web checkouts use Razorpay / PayPal.
 */

// ── 1. Gateway & Currency Architecture ──────────────────────────────────────

export type PaymentGateway = "razorpay" | "paypal" | "revenuecat";

export type SupportedCurrency = "INR" | "USD" | "EUR" | "GBP" | "CAD" | "AUD";

export type ProductPurchaseType =
  | "digital_inapp"      // Subscriptions / digital features inside mobile apps -> RevenueCat
  | "realworld_service"  // Table bookings, cab rides, clinic appointments -> Razorpay / PayPal
  | "web_service";       // Web paywalls, credits, digital downloads on web -> Razorpay / PayPal

export type MonorepoProject =
  | "dining"
  | "gatted"
  | "quick-driver"
  | "doctor-appointment"
  | "highwaypass"
  | "money-map"
  | "cycle-tracker"
  | "smokefree"
  | "mobile"
  | "web"
  | string;

/**
 * Returns true if Apple App Store / Google Play In-App Purchase is strictly required.
 * Digital goods unlocked in iOS/Android apps require IAP; real-world services and web do not.
 */
export function isIAPRequired(type: ProductPurchaseType, platform: "ios" | "android" | "web"): boolean {
  if (platform === "web") return false;
  return type === "digital_inapp";
}

/**
 * Determine the appropriate payment gateway for a given context.
 */
export function getGatewayForTransaction(params: {
  purchaseType: ProductPurchaseType;
  platform: "ios" | "android" | "web";
  isInternational?: boolean;
  preferPayPal?: boolean;
}): PaymentGateway {
  if (params.platform !== "web" && params.purchaseType === "digital_inapp") {
    return "revenuecat";
  }
  if (params.preferPayPal || (params.isInternational && params.preferPayPal)) {
    return "paypal";
  }
  return "razorpay";
}

// ── 2. Razorpay Interfaces & Helpers (Preserved & Extended) ─────────────────

export interface RazorpayOrder {
  id: string;
  entity?: string;
  amount: number; // in paise (e.g. 4900 for ₹49)
  amount_paid?: number;
  amount_due?: number;
  currency: string;
  receipt?: string;
  status: "created" | "attempted" | "paid";
  notes?: Record<string, string>;
  created_at?: number;
}

export interface CreateOrderParams {
  amountInr: number;
  receipt?: string;
  project?: MonorepoProject;
  currency?: string;
  notes?: Record<string, string>;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}

export interface CheckoutConfigOptions {
  keyId: string;
  orderId: string;
  amountPaise: number;
  name: string;
  description?: string;
  currency?: string;
  image?: string;
  themeColor?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
}

/** Convert Rupees to Paise (₹100 -> 10000 paise) */
export function formatPaise(inr: number): number {
  return Math.round(inr * 100);
}

/** Convert Paise to Rupees (10000 paise -> ₹100) */
export function formatRupees(paise: number): number {
  return paise / 100;
}

/**
 * Build the standard options dictionary for Razorpay Checkout
 * Compatible with both web Checkout script and React Native Razorpay SDK
 */
export function buildCheckoutConfig(options: CheckoutConfigOptions) {
  return {
    key: options.keyId,
    amount: options.amountPaise,
    currency: options.currency || "INR",
    name: options.name,
    description: options.description || "",
    image: options.image || "https://sheharbazaar.dropby.co.in/favicon.ico",
    order_id: options.orderId,
    prefill: {
      name: options.prefill?.name || "",
      email: options.prefill?.email || "",
      contact: options.prefill?.contact || "",
    },
    notes: options.notes || {},
    theme: {
      color: options.themeColor || "#2563EB",
    },
  };
}

// ── 3. PayPal Interfaces (International Web & Real-World Bookings) ──────────

export type PayPalEnvironment = "sandbox" | "live";

export interface PayPalOrderLink {
  href: string;
  rel: "self" | "approve" | "update" | "capture";
  method: "GET" | "POST" | "PATCH" | "DELETE";
}

export interface PayPalOrder {
  id: string;
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
  intent: "CAPTURE" | "AUTHORIZE";
  purchase_units?: Array<{
    reference_id?: string;
    amount: {
      currency_code: string;
      value: string; // e.g. "9.99"
    };
    description?: string;
  }>;
  links: PayPalOrderLink[];
  create_time?: string;
}

export interface CreatePayPalOrderParams {
  amount: number; // Decimal (e.g. 9.99)
  currency: SupportedCurrency;
  receipt?: string;
  project?: MonorepoProject;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  notes?: Record<string, string>;
}

export interface CapturePayPalOrderResult {
  id: string;
  status: "COMPLETED" | "FAILED" | "PENDING";
  orderId: string;
  payer?: {
    email_address?: string;
    payer_id?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
  capturedAmount?: {
    currency_code: string;
    value: string;
  };
}

export interface PayPalWebhookEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type:
    | "CHECKOUT.ORDER.APPROVED"
    | "PAYMENT.CAPTURE.COMPLETED"
    | "PAYMENT.CAPTURE.DENIED"
    | "PAYMENT.CAPTURE.REFUNDED";
  summary: string;
  resource: Record<string, unknown>;
}

// ── 4. RevenueCat Interfaces (Apple StoreKit & Google Play Billing) ─────────

export interface SubscriptionTier {
  identifier: string;         // e.g. "cycle_pro_monthly", "cycle_pro_annual"
  entitlementId: string;      // e.g. "pro_access"
  period: "monthly" | "annual" | "lifetime";
  title: string;
  description: string;
  priceString: string;        // e.g. "$4.99", "₹399"
}

export interface RevenueCatPackage {
  identifier: string;         // e.g. "$rc_monthly"
  packageType: "MONTHLY" | "ANNUAL" | "LIFETIME" | "WEEKLY" | "CUSTOM";
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}

export interface RevenueCatEntitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: "NORMAL" | "INTRO" | "TRIAL";
  latestPurchaseDate: string;
  expirationDate: string | null;
  productIdentifier: string;
}

export interface UserSubscriptionState {
  isPro: boolean;
  activeEntitlements: string[];
  expirationDate: string | null;
  willRenew: boolean;
}

// ── 5. Universal Formatting & Calculation Helpers ───────────────────────────

/**
 * Format currency with locale-aware symbols
 */
export function formatCurrency(amount: number, currency: SupportedCurrency = "INR"): string {
  switch (currency) {
    case "USD":
      return `$${amount.toFixed(2)}`;
    case "EUR":
      return `€${amount.toFixed(2)}`;
    case "GBP":
      return `£${amount.toFixed(2)}`;
    case "CAD":
      return `CA$${amount.toFixed(2)}`;
    case "AUD":
      return `AU$${amount.toFixed(2)}`;
    case "INR":
    default:
      return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  }
}
