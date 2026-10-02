import { AuthState, useAuthStore } from '@/stores/auth.store';
import React, { createContext, useContext, useEffect } from 'react';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Get the entire store state and actions
    const store = useAuthStore();

    useEffect(() => {
        // Initialize auth on mount
        store.initialize();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AuthContext.Provider value={store}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthState {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
