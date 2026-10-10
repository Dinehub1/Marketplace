import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireEnv, requireFirstEnv } from '@brandcollabs/core';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * These two used to fall back to a hardcoded production URL and publishable key.
 *
 * That value is not a secret — a publishable key is designed to ship inside the client
 * bundle, and the same one is committed in the repo root `.env` — so the problem was
 * never exposure. It was silence: a build or local run that lost
 * `EXPO_PUBLIC_SUPABASE_URL` kept working and quietly talked to the production database.
 * Failing here, by name, is the point. Supabase renamed the client key in 2025
 * (`sb_publishable_…` replaced the legacy anon JWT), so either name is accepted.
 */
const supabaseUrl = requireEnv(
    'EXPO_PUBLIC_SUPABASE_URL',
    'The app cannot reach Supabase without it.',
);
const supabaseAnonKey = requireFirstEnv(
    ['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
    'Supabase renamed the client key to the publishable key; set either name.',
);

// Platform-aware storage adapter:
// - SSR (Node.js): in-memory no-op (window doesn't exist during pre-render)
// - Native (iOS/Android): SecureStore (encrypted keychain)
// - Web client: localStorage via AsyncStorage
const isSSR = typeof window === 'undefined';
const memoryStore = new Map<string, string>();

const storageAdapter = {
    getItem: (key: string): Promise<string | null> => {
        if (isSSR) return Promise.resolve(memoryStore.get(key) ?? null);
        if (Platform.OS === 'web') return AsyncStorage.getItem(key);
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string): Promise<void> => {
        if (isSSR) { memoryStore.set(key, value); return Promise.resolve(); }
        if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
        return SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string): Promise<void> => {
        if (isSSR) { memoryStore.delete(key); return Promise.resolve(); }
        if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
        return SecureStore.deleteItemAsync(key);
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

import { sendOtp as coreSendOtp, verifyOtp as coreVerifyOtp } from '@brandcollabs/core';

export const authApi = {
    sendOtp: async (phone: string) => {
        const res = await coreSendOtp({ identifier: phone, channel: 'whatsapp' });
        return { success: res.ok, dev_otp: res.devCode, warning: res.deliveryError };
    },

    verifyOtp: async (phone: string, otp: string) => {
        const res = await coreVerifyOtp({ identifier: phone, code: otp, channel: 'whatsapp' });
        return {
            success: res.ok,
            session: {
                access_token: res.token,
                refresh_token: res.token,
                expires_in: 86400,
                token_type: 'bearer',
                user: { id: res.identifier, phone: `+91${res.identifier}` },
            },
        };
    },
};
