import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireEnv, requireFirstEnv } from '@brandcollabs/core';
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

import { sendOtp as coreSendOtp, verifyOtp as coreVerifyOtp } from '@brandcollabs/core';

export const authApi = {
  sendOtp: async (phone: string) => {
    const res = await coreSendOtp({ identifier: phone, channel: 'whatsapp' });
    return {
      success: res.ok,
      message: res.message,
      dev_otp: res.devCode,
      sent_whatsapp: res.delivered ?? true,
      warning: res.deliveryError,
    };
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

    const resp = await fetch(`${supabaseUrl}/functions/v1/upload-inspection-video`, {
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
