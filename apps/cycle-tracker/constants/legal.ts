/**
 * Links every paywall must show (App Store Review Guideline 3.1.2; Google Play's subscriptions
 * policy). Terms default to Apple's standard EULA, which also covers an app that has no custom one.
 * The privacy policy has no default: it must be a page you host, so set
 * EXPO_PUBLIC_PRIVACY_POLICY_URL before a store build. The paywall hides the link while it is
 * unset rather than pointing it somewhere wrong.
 */
import { Platform } from 'react-native';

export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL || 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || '';

/** Where a subscriber manages or cancels: the store's own subscriptions page. */
export const MANAGE_SUBSCRIPTION_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

export const STORE_ACCOUNT = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play';
