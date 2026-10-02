/**
 * Custom Authentication API
 * 
 * Replaces Supabase Auth with NEXTEL OTP-based authentication.
 * Uses Edge Functions for OTP send/verify and custom sessions.
 */

import type { Profile, UserRoleType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const SESSION_KEY = 'gated_auth_session';

// Local types for new auth tables (until database types are regenerated)
interface AuthSessionRow {
    id: string;
    user_id: string;
    token: string;
    device_info: Record<string, unknown> | null;
    expires_at: string;
    created_at: string;
    last_used_at: string;
}

export interface AuthSession {
    token: string;
    user: Profile;
    roles: UserRoleData[];
    expires_at: string;
}

export interface UserRoleData {
    id: string;
    role: UserRoleType;
    society_id: string | null;
    unit_id: string | null;
    society?: {
        id: string;
        name: string;
    } | null;
    unit?: {
        id: string;
        unit_number: string;
    } | null;
}

export interface SendOTPResponse {
    success: boolean;
    message?: string;
    expires_in?: number;
    error?: string;
}

export interface VerifyOTPResponse {
    success: boolean;
    user?: Profile;
    roles?: UserRoleData[];
    session_token?: string;
    expires_at?: string;
    error?: string;
}

export const authApi = {
    /**
     * Send OTP to phone number via NEXTEL WhatsApp
     */
    async sendOTP(phone: string): Promise<{ data: SendOTPResponse | null; error: Error | null }> {
        try {
            const { data, error } = await supabase.functions.invoke<SendOTPResponse>('send-otp', {
                body: { phone }
            });

            if (error) {
                return { data: null, error };
            }

            if (data?.error) {
                return { data: null, error: new Error(data.error) };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Verify OTP and create session
     */
    async verifyOTP(phone: string, otp: string): Promise<{ data: VerifyOTPResponse | null; error: Error | null }> {
        try {
            const { data, error } = await supabase.functions.invoke<VerifyOTPResponse>('verify-otp', {
                body: { phone, otp }
            });

            if (error) {
                return { data: null, error };
            }

            if (data?.error) {
                return { data: null, error: new Error(data.error) };
            }

            // Persist session to storage
            if (data?.session_token && data?.user) {
                const session: AuthSession = {
                    token: data.session_token,
                    user: data.user,
                    roles: data.roles || [],
                    expires_at: data.expires_at!
                };
                await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Get stored session (if valid)
     */
    async getSession(): Promise<AuthSession | null> {
        try {
            const stored = await AsyncStorage.getItem(SESSION_KEY);
            if (!stored) return null;

            const session: AuthSession = JSON.parse(stored);

            // Check if expired
            if (new Date(session.expires_at) < new Date()) {
                await this.signOut();
                return null;
            }

            return session;
        } catch {
            return null;
        }
    },

    /**
     * Validate session with server (refresh user data)
     */
    async validateSession(): Promise<{ valid: boolean; session?: AuthSession }> {
        try {
            const stored = await AsyncStorage.getItem(SESSION_KEY);
            if (!stored) return { valid: false };

            const session: AuthSession = JSON.parse(stored);

            // Use type assertion for auth_sessions table (not in generated types yet)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: sessionData, error: sessionError } = await (supabase as any)
                .from('auth_sessions')
                .select('*')
                .eq('token', session.token)
                .gt('expires_at', new Date().toISOString())
                .single() as { data: AuthSessionRow | null; error: Error | null };

            if (sessionError || !sessionData) {
                await this.signOut();
                return { valid: false };
            }

            // Update last_used_at
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('auth_sessions')
                .update({ last_used_at: new Date().toISOString() })
                .eq('id', sessionData.id);

            // Get fresh user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionData.user_id)
                .single();

            // Get fresh roles
            const { data: roles } = await supabase
                .from('user_roles')
                .select(`
                    *,
                    society:societies(id, name),
                    unit:units(id, unit_number)
                `)
                .eq('user_id', sessionData.user_id)
                .eq('is_active', true);

            if (!profile) {
                await this.signOut();
                return { valid: false };
            }

            // Update stored session with fresh data
            const updatedSession: AuthSession = {
                token: session.token,
                user: profile,
                roles: (roles || []) as UserRoleData[],
                expires_at: sessionData.expires_at
            };
            await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));

            return { valid: true, session: updatedSession };
        } catch {
            return { valid: false };
        }
    },

    /**
     * Sign out and clear session
     */
    async signOut(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(SESSION_KEY);
            if (stored) {
                const session: AuthSession = JSON.parse(stored);
                // Optionally invalidate server-side session
                // await supabase.from('auth_sessions').delete().eq('token', session.token);
            }
        } catch {
            // Ignore errors during cleanup
        }
        await AsyncStorage.removeItem(SESSION_KEY);
    },

    /**
     * Update current role selection
     */
    async setCurrentRole(roleId: string): Promise<void> {
        await AsyncStorage.setItem('gated_current_role', roleId);
    },

    /**
     * Get saved current role selection
     */
    async getCurrentRoleId(): Promise<string | null> {
        return AsyncStorage.getItem('gated_current_role');
    }
};
