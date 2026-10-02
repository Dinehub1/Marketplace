import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth.store';
import { act, renderHook } from '@testing-library/react-native';

// Mock the auth-api module
jest.mock('@/lib/auth-api');

// Mock supabase module (for devLogin fallback and guard shift cleanup in signOut)
jest.mock('@/lib/supabase', () => {
    const queryChain: any = {};
    Object.assign(queryChain, {
        select: jest.fn(() => queryChain),
        update: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        is: jest.fn(() => queryChain),
        limit: jest.fn(() => queryChain),
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    });
    return {
        supabase: {
            auth: {
                signInWithPassword: jest.fn(),
            },
            from: jest.fn(() => queryChain),
        },
        supabaseHelpers: {
            getProfile: jest.fn(),
            getUserRoles: jest.fn(),
        },
    };
});

describe('AuthStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset store state directly so tests don't depend on signOut side effects
        useAuthStore.setState({
            user: null,
            session: null,
            profile: null,
            roles: [],
            currentRole: null,
            isAuthenticated: false,
            isLoading: true,
        });
    });

    describe('signInWithOTP', () => {
        it('should call authApi.sendOTP with phone number', async () => {
            const { result } = renderHook(() => useAuthStore());
            const mockPhone = '+919876543210';

            (authApi.sendOTP as jest.Mock).mockResolvedValue({
                data: { success: true, message: 'OTP sent' },
                error: null
            });

            await act(async () => {
                await result.current.signInWithOTP(mockPhone);
            });

            expect(authApi.sendOTP).toHaveBeenCalledWith(mockPhone);
        });

        it('should return error when OTP send fails', async () => {
            const { result } = renderHook(() => useAuthStore());
            const mockError = new Error('Invalid phone number');

            (authApi.sendOTP as jest.Mock).mockResolvedValue({
                data: null,
                error: mockError
            });

            let response;
            await act(async () => {
                response = await result.current.signInWithOTP('+919876543210');
            });

            expect(response).toHaveProperty('error');
        });
    });

    describe('verifyOTP', () => {
        it('should set authenticated state on successful verification', async () => {
            const { result } = renderHook(() => useAuthStore());
            const mockUser = { id: 'user-123', phone: '+919876543210', full_name: 'Test User' };
            const mockRoles = [{ id: 'role-1', role: 'guard', society_id: 'society-1', unit_id: null }];

            (authApi.verifyOTP as jest.Mock).mockResolvedValue({
                data: {
                    success: true,
                    user: mockUser,
                    roles: mockRoles,
                    session_token: 'test-session-token',
                    expires_at: new Date(Date.now() + 86400000).toISOString()
                },
                error: null,
            });

            (authApi.getCurrentRoleId as jest.Mock).mockResolvedValue(null);

            await act(async () => {
                await result.current.verifyOTP('+919876543210', '123456');
            });

            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.profile).toEqual(mockUser);
            expect(result.current.roles).toEqual(mockRoles);
        });

        it('should return error when OTP verification fails', async () => {
            const { result } = renderHook(() => useAuthStore());
            const mockError = new Error('Invalid OTP');

            (authApi.verifyOTP as jest.Mock).mockResolvedValue({
                data: null,
                error: mockError,
            });

            let response;
            await act(async () => {
                response = await result.current.verifyOTP('+919876543210', '000000');
            });

            expect(response).toHaveProperty('error');
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('signOut', () => {
        it('should clear all auth state', async () => {
            const { result } = renderHook(() => useAuthStore());

            // Set some initial state
            act(() => {
                useAuthStore.setState({
                    user: { id: 'user-123' } as any,
                    profile: { id: 'user-123' } as any,
                    isAuthenticated: true,
                });
            });

            (authApi.signOut as jest.Mock).mockResolvedValue(undefined);

            await act(async () => {
                await result.current.signOut();
            });

            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.profile).toBeNull();
            expect(result.current.roles).toEqual([]);
        });
    });

    describe('setCurrentRole', () => {
        it('should update current role and save to storage', () => {
            const { result } = renderHook(() => useAuthStore());
            const mockRole = {
                id: 'role-1',
                role: 'guard' as const,
                society_id: 'society-1',
                unit_id: null,
            };

            (authApi.setCurrentRole as jest.Mock).mockResolvedValue(undefined);

            act(() => {
                result.current.setCurrentRole(mockRole);
            });

            expect(result.current.currentRole).toEqual(mockRole);
            expect(authApi.setCurrentRole).toHaveBeenCalledWith('role-1');
        });
    });

    describe('initialize', () => {
        it('should load existing session on init', async () => {
            const { result } = renderHook(() => useAuthStore());
            const mockSession = {
                token: 'test-token',
                user: { id: 'user-123', phone: '+919876543210' },
                roles: [{ id: 'role-1', role: 'guard', society_id: 'society-1' }],
                expires_at: new Date(Date.now() + 86400000).toISOString()
            };

            (authApi.getSession as jest.Mock).mockResolvedValue(mockSession);
            (authApi.validateSession as jest.Mock).mockResolvedValue({ valid: true, session: mockSession });
            (authApi.getCurrentRoleId as jest.Mock).mockResolvedValue(null);

            await act(async () => {
                await result.current.initialize();
            });

            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.isLoading).toBe(false);
        });

        it('should set loading false even with no session', async () => {
            const { result } = renderHook(() => useAuthStore());

            (authApi.getSession as jest.Mock).mockResolvedValue(null);

            await act(async () => {
                await result.current.initialize();
            });

            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.isLoading).toBe(false);
        });
    });
});
