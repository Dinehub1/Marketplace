import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireEnv, requireFirstEnv } from '@hermes/core';
import { createClient } from '@supabase/supabase-js';
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

const isSSR = typeof window === 'undefined';
const memoryStore = new Map<string, string>();

const storageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (isSSR) return Promise.resolve(memoryStore.get(key) ?? null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (isSSR) {
      memoryStore.set(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (isSSR) {
      memoryStore.delete(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
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
    return data as {
      success: boolean;
      message?: string;
      dev_otp?: string;
      sent_whatsapp?: boolean;
      warning?: string;
    };
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

  uploadInspectionVideo: async (
    tripId: string,
    type: 'before' | 'after',
    videoUri?: string | null,
    driverId?: string | null
  ) => {
    let body: any;
    let headers: Record<string, string> = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    };

    if (videoUri && Platform.OS !== 'web') {
      const formData = new FormData();
      formData.append('trip_id', tripId);
      formData.append('type', type);
      if (driverId) formData.append('driver_id', driverId);

      const filename = videoUri.split('/').pop() || `${type}-inspection.mp4`;
      const fileType = filename.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';

      formData.append('video', {
        uri: videoUri,
        name: filename,
        type: fileType,
      } as any);

      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        trip_id: tripId,
        type,
        driver_id: driverId || undefined,
      });
    }

    const resp = await fetch(`${edgeFunctionUrl}/upload-inspection-video`, {
      method: 'POST',
      headers,
      body,
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to upload video to R2');
    return data as {
      success: boolean;
      trip_id: string;
      type: 'before' | 'after';
      video_url: string;
    };
  },
};
