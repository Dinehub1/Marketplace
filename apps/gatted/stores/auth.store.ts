/**
 * Authentication Store (Zustand)
 * 
 * Manages auth state using custom NEXTEL OTP authentication.
 * Replaces Supabase Auth with custom sessions.
 */

import { authApi, AuthSession, UserRoleData } from '@/lib/auth-api';
import { supabase, supabaseHelpers } from '@/lib/supabase';
import type { Profile, UserRoleType } from '@/types';
import { handleApiError, logError } from '@/utils/error-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type { UserRoleData };

function createOfflineDevSession(role: UserRoleType): {
    session: AuthSession;
    profile: Profile;
    roles: UserRoleData[];
} {
    const now = new Date().toISOString();
    const profiles: Record<UserRoleType, Profile> = {
        guard: {
            id: 'dev-guard-user',
            phone: '+919999000001',
            full_name: 'Dev Guard',
            email: 'guard@test.com',
            avatar_url: null,
            created_at: now,
            updated_at: now,
        },
        resident: {
            id: 'dev-resident-user',
            phone: '+919999000002',
            full_name: 'Dev Resident',
            email: 'resident@test.com',
            avatar_url: null,
            created_at: now,
            updated_at: now,
        },
        manager: {
            id: 'dev-manager-user',
            phone: '+919999000003',
            full_name: 'Dev Manager',
            email: 'manager@test.com',
            avatar_url: null,
            created_at: now,
            updated_at: now,
        },
        admin: {
            id: 'dev-admin-user',
            phone: '+919999000004',
            full_name: 'Dev Admin',
            email: 'admin@test.com',
            avatar_url: null,
            created_at: now,
            updated_at: now,
        },
        owner: {
            id: 'dev-owner-user',
            phone: '+919999000002',
            full_name: 'Dev Owner',
            email: 'resident@test.com',
            avatar_url: null,
            created_at: now,
            updated_at: now,
        },
        tenant: {
            id: 'dev-tenant-user',
            phone: '+919999000002',
            full_name: 'Dev Tenant',
            email: 'resident@test.com',
            avatar_url: null,
            created_at: now,
            updated_at: now,
        },
    };

    const roleData: Record<UserRoleType, UserRoleData> = {
        guard: {
            id: 'dev-guard-role',
            role: 'guard',
            society_id: 'dev-society-1',
            unit_id: null,
            society: { id: 'dev-society-1', name: 'Dev Society' },
            unit: null,
        },
        resident: {
            id: 'dev-resident-role',
            role: 'resident',
            society_id: 'dev-society-1',
            unit_id: 'dev-unit-a101',
            society: { id: 'dev-society-1', name: 'Dev Society' },
            unit: { id: 'dev-unit-a101', unit_number: 'A-101' },
        },
        manager: {
            id: 'dev-manager-role',
            role: 'manager',
            society_id: 'dev-society-1',
            unit_id: null,
            society: { id: 'dev-society-1', name: 'Dev Society' },
            unit: null,
        },
        admin: {
            id: 'dev-admin-role',
            role: 'admin',
            society_id: null,
            unit_id: null,
            society: null,
            unit: null,
        },
        owner: {
            id: 'dev-owner-role',
            role: 'owner',
            society_id: 'dev-society-1',
            unit_id: 'dev-unit-a101',
            society: { id: 'dev-society-1', name: 'Dev Society' },
            unit: { id: 'dev-unit-a101', unit_number: 'A-101' },
        },
        tenant: {
            id: 'dev-tenant-role',
            role: 'tenant',
            society_id: 'dev-society-1',
            unit_id: 'dev-unit-a101',
            society: { id: 'dev-society-1', name: 'Dev Society' },
            unit: { id: 'dev-unit-a101', unit_number: 'A-101' },
        },
    };

    const profile = profiles[role];
    const currentRole = roleData[role];
    const roles = [currentRole];
    const session: AuthSession = {
        token: `dev-offline-${role}`,
        user: profile,
        roles,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return { session, profile, roles };
}

async function applyOfflineDevLogin(role: UserRoleType, set: (partial: Partial<AuthState>) => void) {
    const { session, profile, roles } = createOfflineDevSession(role);
    await AsyncStorage.setItem('gated_current_role', roles[0].id);
    set({
        session,
        user: profile,
        profile,
        roles,
        currentRole: roles[0],
        isAuthenticated: true,
        isLoading: false,
    });
}

export interface AuthState {
    user: Profile | null;
    session: AuthSession | null;
    profile: Profile | null;
    roles: UserRoleData[];
    currentRole: UserRoleData | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    signInWithOTP: (phone: string) => Promise<{ error: any }>;
    verifyOTP: (phone: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    loadUserData: () => Promise<void>;
    setCurrentRole: (role: UserRoleData) => void;
    initialize: () => Promise<void>;
    cleanup: () => void;
    devLogin: (role: UserRoleType) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    profile: null,
    roles: [],
    currentRole: null,
    isLoading: true,
    isAuthenticated: false,

    signInWithOTP: async (phone: string) => {
        try {
            const { data, error } = await authApi.sendOTP(phone);

            if (error) {
                logError(error, 'OTP sign in failed', { severity: 'medium' });
                return { error: handleApiError(error) };
            }

            return { error: null };
        } catch (error) {
            logError(error, 'OTP sign in exception', { severity: 'high' });
            return { error: handleApiError(error) };
        }
    },

    verifyOTP: async (phone: string, token: string) => {
        try {
            const { data, error } = await authApi.verifyOTP(phone, token);

            if (error) {
                logError(error, 'OTP verification failed', { severity: 'medium' });
                return { error: handleApiError(error) };
            }

            if (data?.user && data?.session_token) {
                const session: AuthSession = {
                    token: data.session_token,
                    user: data.user,
                    roles: data.roles || [],
                    expires_at: data.expires_at!
                };

                set({
                    session,
                    user: data.user,
                    profile: data.user,
                    roles: data.roles || [],
                    isAuthenticated: true,
                });

                // Auto-select role if only one exists
                const roles = data.roles || [];
                if (roles.length === 1) {
                    get().setCurrentRole(roles[0]);
                } else if (roles.length > 1) {
                    // Try to load previously selected role
                    const savedRoleId = await authApi.getCurrentRoleId();
                    const savedRole = roles.find(r => r.id === savedRoleId);
                    if (savedRole) {
                        get().setCurrentRole(savedRole);
                    }
                }
            }

            return { error: null };
        } catch (error) {
            logError(error, 'OTP verification exception', { severity: 'high' });
            return { error: handleApiError(error) };
        }
    },

    signOut: async () => {
        try {
            // End any active guard shift before signing out
            const state = get();
            if (state.profile?.id && state.currentRole?.society_id) {
                const { data: activeShift } = await supabase
                    .from('guard_shifts')
                    .select('id')
                    .eq('guard_id', state.profile.id)
                    .eq('society_id', state.currentRole.society_id)
                    .is('shift_end', null)
                    .limit(1)
                    .single();

                if (activeShift) {
                    await supabase
                        .from('guard_shifts')
                        .update({ shift_end: new Date().toISOString() })
                        .eq('id', activeShift.id);
                }
            }

            await authApi.signOut();
            await AsyncStorage.removeItem('gated_current_role');

            set({
                user: null,
                session: null,
                profile: null,
                roles: [],
                currentRole: null,
                isAuthenticated: false,
            });
        } catch (error) {
            logError(error, 'Sign out failed', { severity: 'low' });
        }
    },

    loadUserData: async () => {
        try {
            const { valid, session } = await authApi.validateSession();

            if (!valid || !session) {
                set({
                    user: null,
                    session: null,
                    profile: null,
                    roles: [],
                    currentRole: null,
                    isAuthenticated: false,
                });
                return;
            }

            set({
                session,
                user: session.user,
                profile: session.user,
                roles: session.roles,
                isAuthenticated: true,
            });

            // Auto-select role if only one exists
            if (session.roles.length === 1) {
                get().setCurrentRole(session.roles[0]);
            } else if (session.roles.length > 1) {
                // Try to load previously selected role
                const savedRoleId = await authApi.getCurrentRoleId();
                const savedRole = session.roles.find(r => r.id === savedRoleId);
                if (savedRole) {
                    get().setCurrentRole(savedRole);
                }
            }
        } catch (error) {
            logError(error, 'Failed to load user data', { severity: 'high' });
        }
    },

    setCurrentRole: (role: UserRoleData) => {
        set({ currentRole: role });
        authApi.setCurrentRole(role.id);
    },

    // Dev Login - Uses test credentials for development only
    devLogin: async (role: UserRoleType) => {
        if (!__DEV__) {
            console.warn('Dev login is only available in development mode');
            return;
        }

        try {
            // In dev mode, try email/password login via Supabase Auth as fallback
            const credentials: Record<UserRoleType, { email: string; password: string }> = {
                guard: { email: 'guard@test.com', password: 'test1234' },
                resident: { email: 'resident@test.com', password: 'test1234' },
                manager: { email: 'manager@test.com', password: 'test1234' },
                admin: { email: 'admin@test.com', password: 'test1234' },
                owner: { email: 'resident@test.com', password: 'test1234' },
                tenant: { email: 'resident@test.com', password: 'test1234' },
            };

            const cred = credentials[role];
            const { data, error } = await supabase.auth.signInWithPassword({
                email: cred.email,
                password: cred.password,
            });

            if (error) {
                logError(error, 'Dev login failed', { severity: 'low', context: { role } });
                await applyOfflineDevLogin(role, set);
                return;
            }

            if (data.session && data.user) {
                // Load profile and roles using Supabase helpers
                const { data: profile } = await supabaseHelpers.getProfile(data.user.id);
                const { data: roles } = await supabaseHelpers.getUserRoles(data.user.id);

                // Create a mock session for compatibility
                const mockSession: AuthSession = {
                    token: 'dev-' + data.session.access_token.slice(0, 20),
                    user: profile!,
                    roles: roles || [],
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };

                set({
                    session: mockSession,
                    user: profile,
                    profile: profile,
                    roles: roles || [],
                    isAuthenticated: true,
                });

                // Auto-select first role
                if (roles && roles.length > 0) {
                    get().setCurrentRole(roles[0]);
                }
            } else {
                await applyOfflineDevLogin(role, set);
            }
        } catch (error) {
            logError(error, 'Dev login exception', { severity: 'medium', context: { role } });
            await applyOfflineDevLogin(role, set);
        }
    },

    cleanup: () => {
        // No subscriptions to clean up with custom auth
    },

    initialize: async () => {
        try {
            set({ isLoading: true });

            // Check for existing session
            const session = await authApi.getSession();

            if (session) {
                set({
                    session,
                    user: session.user,
                    profile: session.user,
                    roles: session.roles,
                    isAuthenticated: true,
                });

                // Auto-select role
                if (session.roles.length === 1) {
                    get().setCurrentRole(session.roles[0]);
                } else if (session.roles.length > 1) {
                    const savedRoleId = await authApi.getCurrentRoleId();
                    const savedRole = session.roles.find(r => r.id === savedRoleId);
                    if (savedRole) {
                        get().setCurrentRole(savedRole);
                    }
                }

                // Validate session in background
                await get().loadUserData();
            }

            set({ isLoading: false });
        } catch (error) {
            logError(error, 'Auth initialization failed', { severity: 'critical' });
            set({ isLoading: false });
        }
    },
}));
