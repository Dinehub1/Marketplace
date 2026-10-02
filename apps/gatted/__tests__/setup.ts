// Test setup file for React Native Testing Library


// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// react-native 0.81's built-in jest mock for ActivityIndicator crashes under
// react-test-renderer 19; replace it with a plain host component
jest.mock(
    'react-native/Libraries/Components/ActivityIndicator/ActivityIndicator',
    () => ({ __esModule: true, default: 'ActivityIndicator' })
);

// Mock Expo modules
jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    })),
    useSegments: jest.fn(() => []),
    Stack: {
        Screen: 'Stack.Screen',
    },
    Tabs: {
        Screen: 'Tabs.Screen',
    },
}));

jest.mock('expo-status-bar', () => ({
    StatusBar: 'StatusBar',
}));

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithOtp: jest.fn(),
            verifyOtp: jest.fn(),
            signOut: jest.fn(),
            getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
            getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
            onAuthStateChange: jest.fn(() => ({
                data: { subscription: { unsubscribe: jest.fn() } },
            })),
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            order: jest.fn().mockReturnThis(),
        })),
    },
    supabaseHelpers: {
        signInWithOTP: jest.fn(),
        verifyOTP: jest.fn(),
        signOut: jest.fn(),
        getCurrentUser: jest.fn(),
        getProfile: jest.fn(),
        getUserRoles: jest.fn(),
    },
}));

// Silence console warnings in tests
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
};
