/**
 * @hermes/core - Unified Razorpay & Payment Gateway Utilities
 *
 * Provides shared types and helper functions for Razorpay across all apps
 * in the monorepo (web, dining, gatted, quick-driver, cycle-tracker, etc.)
 */

export type MonorepoProject =
  | "dining"
  | "gatted"
  | "quick-driver"
  | "doctor-appointment"
  | "highwaypass"
  | "money-map"
  | "cycle-tracker"
  | "smokefree"
  | "web"
  | string;

export interface RazorpayOrder {
  id: string;
  entity?: string;
  amount: number; // in paise
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
