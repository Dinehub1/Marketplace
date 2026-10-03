import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xpfmqpmhmcouwzebfwhb.supabase.co';
const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_XN_U25XfcBdLbXVJhraMsQ_1RQtM_Nc';

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

// Edge Function base URL for custom WhatsApp OTP auth
const edgeFunctionUrl = `${supabaseUrl}/functions/v1`;

export const authApi = {
    sendOtp: async (phone: string) => {
        const resp = await fetch(`${edgeFunctionUrl}/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ phone }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Failed to send OTP');
        return data as { success: boolean; dev_otp?: string; warning?: string };
    },

    verifyOtp: async (phone: string, otp: string) => {
        const resp = await fetch(`${edgeFunctionUrl}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ phone, otp }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Verification failed');
        return data as {
            success: boolean;
            session: {
                access_token: string;
                refresh_token: string;
                expires_in: number;
                token_type: string;
                user: any;
            };
        };
    },
};
