/**
 * TypeScript declarations for SVG imports
 * Allows importing .svg files as React components
 */

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

/**
 * `react-native-razorpay` ships no type declarations and has no `types`/`typings` field
 * (its `main` is `RazorpayCheckout.js`), so under `strict` its import was `TS7016` —
 * implicitly `any`. Only what this app actually calls is declared: `open`, and the
 * fields of its result that `services/dineinCheckout.ts` reads (the three signature
 * parts it hands to the server, which verifies them with Razorpay before confirming).
 *
 * The failure shape is deliberately loose. A rejection here is either the user closing
 * the sheet or a real failure, and the only thing the caller inspects is `description`
 * to tell those apart — see `isUserCancel` in `services/dineinCheckout.ts`.
 */
declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string;
    order_id?: string;
    amount: string | number;
    currency: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, string>;
    theme?: { color?: string };
  }

  export interface RazorpaySuccess {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }

  export interface RazorpayFailure {
    code?: number | string;
    description?: string;
    reason?: string;
  }

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccess>;
  };

  export default RazorpayCheckout;
}

