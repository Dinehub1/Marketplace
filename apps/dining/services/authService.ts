import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUser, getUserByPhoneNumber, supabase } from '../config/supabase';

const NEXTEL_API_KEY = process.env.NEXTEL_API_KEY || 'MFZPSnRHL3BiOHNsdnZMMTYwK0xrUT09';
const NEXTEL_ENDPOINT = (
  process.env.NEXTEL_ENDPOINT || 'https://api.nextel.io/API_V2/Whatsapp/send_template'
).replace(/\/+$/, '');

const STORAGE_USER_KEY = 'currentUser';
const STORAGE_OTP_PREFIX = 'dining_otp_';

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

// In-memory OTP storage fallback
const otpCache = new Map<string, { code: string; expiresAt: number }>();

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

/**
 * Send OTP via Nextel WhatsApp with development fallback
 */
export async function sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    throw new Error('Please enter a valid 10-digit Indian mobile number');
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store in memory cache
  otpCache.set(phone.e164, { code, expiresAt });
  try {
    await AsyncStorage.setItem(
      `${STORAGE_OTP_PREFIX}${phone.e164}`,
      JSON.stringify({ code, expiresAt })
    );
  } catch {}

  console.log(`📱 [Dining OTP] Generated OTP for ${phone.e164}: ${code}`);

  // Send via Nextel WhatsApp template
  let delivered = false;
  if (NEXTEL_API_KEY) {
    try {
      const url = `${NEXTEL_ENDPOINT}/${NEXTEL_API_KEY}`;
      const payload = {
        type: 'buttonTemplate',
        templateId: 'auth',
        templateLanguage: 'en',
        sender_phone: phone.nextel, // Recipient phone for Nextel API
        templateArgs: [code],
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.status === '200' || body.status === '202' || body.messageId) {
          delivered = true;
          console.log(`✅ [Dining OTP] Delivered via WhatsApp to ${phone.e164}`);
        } else {
          console.warn(`⚠️ [Dining OTP] Nextel response:`, body);
        }
      } else {
        console.warn(`⚠️ [Dining OTP] Nextel HTTP error: ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ [Dining OTP] Failed to send WhatsApp message:`, err);
    }
  }

  return {
    success: true,
    message: delivered ? 'OTP sent via WhatsApp!' : 'OTP generated! (Check terminal or use 123456 in dev)',
  };
}

/**
 * Verify OTP and resolve/create user in Supabase
 */
export async function verifyOTP(phoneNumber: string, code: string): Promise<DiningUser> {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    throw new Error('Invalid phone number format');
  }

  const cleanCode = code.trim();
  if (cleanCode.length !== 6) {
    throw new Error('Please enter a valid 6-digit OTP');
  }

  // Check stored OTP
  let valid = false;
  let cached = otpCache.get(phone.e164);
  if (!cached) {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_OTP_PREFIX}${phone.e164}`);
      if (raw) cached = JSON.parse(raw);
    } catch {}
  }

  if (cached && cached.expiresAt > Date.now() && cached.code === cleanCode) {
    valid = true;
    otpCache.delete(phone.e164);
  }

  // Development bypass: allow '123456' in dev/Expo Go
  if (__DEV__ && cleanCode === '123456') {
    valid = true;
    console.log(`🛠️ [Dining OTP] Accepted dev bypass code 123456 for ${phone.e164}`);
  }

  if (!valid) {
    throw new Error('Invalid or expired OTP. Please try again.');
  }

  // Find or create user in Supabase
  console.log(`🔍 [Dining OTP] Finding user by phone ${phone.e164}...`);
  const { data: existingUser, error: findError } = await getUserByPhoneNumber(phone.e164);

  if (existingUser) {
    console.log(`✅ [Dining OTP] Found existing user: ${existingUser.id}`);
    await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(existingUser));
    return existingUser;
  }

  console.log(`🆕 [Dining OTP] Creating new user for ${phone.e164}...`);
  const newUserData = {
    phone_number: phone.e164,
    full_name: `User ${phone.e164.slice(-4)}`,
    email: null,
    is_verified: true,
    role: 'user',
    is_active: true,
    preferred_cuisines: [],
    notification_preferences: {
      email: true,
      push: true,
      sms: false,
    },
  };

  const { data: createdUser, error: createError } = await createUser(newUserData);
  if (createError) {
    // If concurrent insert occurred, retry fetch
    if (createError.code === '23505') {
      const { data: retryUser } = await getUserByPhoneNumber(phone.e164);
      if (retryUser) {
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(retryUser));
        return retryUser;
      }
    }
    throw new Error(createError.message || 'Failed to create user account');
  }

  await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(createdUser));
  return createdUser;
}

/**
 * Load current session user from AsyncStorage
 */
export async function getStoredUser(): Promise<DiningUser | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiningUser;
  } catch {
    return null;
  }
}

/**
 * Sign out and clear stored session
 */
export async function signOutUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_USER_KEY);
  } catch {}
}
