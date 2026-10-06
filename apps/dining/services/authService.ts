/**
 * Phone sign-in for Swaad Ghar, through Supabase Auth.
 *
 * Supabase Auth generates the code, stores it, rate-limits attempts and expires it; the
 * dinein-send-sms hook (supabase/functions) delivers it over the Nextel WhatsApp template. This
 * file used to do all of that on the device, with the Nextel key bundled in the app and a 123456
 * bypass, which meant the server never knew who anyone was. A successful verifyOtp now yields a
 * real session (persisted by config/supabase.js), and link_my_profile() ties it to the
 * public.users row that bookings and payments reference.
 *
 * For development without WhatsApp, add a test number and fixed code in the Supabase dashboard
 * (Authentication → Sign In / Providers → Phone → Test phone numbers) rather than a code bypass.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const STORAGE_USER_KEY = 'currentUser';

export interface DiningUser {
  id: string;
  phone_number: string;
  full_name?: string;
  email?: string | null;
  profile_image_url?: string | null;
  is_verified: boolean;
  role: 'user' | 'business' | 'admin';
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  preferred_cuisines?: string[];
  notification_preferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

/**
 * Normalize phone number to standard E.164 (+91XXXXXXXXXX) and 12-digit Nextel format (91XXXXXXXXXX)
 */
export function normalizePhone(raw: string): { e164: string; nextel: string } | null {
  const digits = (raw || '').replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { e164: `+91${digits}`, nextel: `91${digits}` };
  }
  if (digits.length === 12 && digits.startsWith('91') && /^91[6-9]\d{9}$/.test(digits)) {
    return { e164: `+${digits}`, nextel: digits };
  }
  return null;
}

/** Supabase Auth's messages are written for developers; these are the ones customers hit. */
function friendly(message: string | undefined, fallback: string): string {
  const m = (message || '').toLowerCase();
  if (m.includes('expired') || m.includes('invalid')) return 'Invalid or expired OTP. Please try again.';
  if (m.includes('rate') || m.includes('too many') || m.includes('seconds')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  return message || fallback;
}

/**
 * Ask Supabase Auth to send a sign-in code to this number (delivered on WhatsApp).
 */
export async function sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }

  const { error } = await supabase.auth.signInWithOtp({ phone: phone.e164 });
  if (error) throw new Error(friendly(error.message, 'Could not send the code. Please try again.'));

  return { success: true, message: 'OTP sent via WhatsApp!' };
}

/**
 * Check the code with Supabase Auth, then link (or create) this person's Swaad Ghar profile.
 */
export async function verifyOTP(phoneNumber: string, code: string): Promise<DiningUser> {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    throw new Error('Invalid phone number format');
  }

  const cleanCode = code.trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new Error('Please enter a valid 6-digit OTP');
  }

  const { data, error } = await supabase.auth.verifyOtp({ phone: phone.e164, token: cleanCode, type: 'sms' });
  if (error || !data.session) {
    throw new Error(friendly(error?.message, 'Invalid or expired OTP. Please try again.'));
  }

  const profile = await linkProfile();
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('Signed in, but your profile could not be loaded. Please try again.');
  }
  return profile;
}

/** The signed-in person's public.users row, linked to their auth identity on first sign-in. */
async function linkProfile(): Promise<DiningUser | null> {
  const { data, error } = await supabase.rpc('link_my_profile');
  if (error || !data) {
    console.error('[Dining Auth] link_my_profile failed:', error?.message);
    return null;
  }
  const profile = data as DiningUser;
  await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile)).catch(() => {});
  return profile;
}

/**
 * The current user, if there is a live Supabase session.
 *
 * A profile cached by an older build (which signed in without Supabase Auth) has no session
 * behind it, so it is discarded and the customer signs in once more.
 */
export async function getStoredUser(): Promise<DiningUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await AsyncStorage.removeItem(STORAGE_USER_KEY).catch(() => {});
    return null;
  }

  // Prefer a fresh profile; fall back to the cached one when offline.
  const fresh = await linkProfile();
  if (fresh) return fresh;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_USER_KEY);
    return raw ? (JSON.parse(raw) as DiningUser) : null;
  } catch {
    return null;
  }
}

/**
 * Sign out and clear stored session
 */
export async function signOutUser(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
  await AsyncStorage.removeItem(STORAGE_USER_KEY).catch(() => {});
}
