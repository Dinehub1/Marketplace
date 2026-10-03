import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xpfmqpmhmcouwzebfwhb.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_XN_U25XfcBdLbXVJhraMsQ_1RQtM_Nc';

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
