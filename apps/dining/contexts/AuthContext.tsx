import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { updateUser } from '../config/supabase';
import {
  DiningUser,
  getStoredUser,
  sendOTP,
  signOutUser,
  verifyOTP,
} from '../services/authService';

export type User = DiningUser;

export interface ConfirmationResult {
  verificationId: string;
  confirm: (code: string) => Promise<DiningUser>;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: { uid: string; phoneNumber?: string } | null;
  loading: boolean;
  isAuthenticated: boolean;
  sendPhoneVerification: (phoneNumber: string) => Promise<ConfirmationResult>;
  confirmCode: (confirmationOrPhone: any, code: string) => Promise<DiningUser>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize stored auth session on startup
  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        console.log('🔍 [Dining Auth] Initializing session...');
        const stored = await getStoredUser();
        if (mounted && stored) {
          console.log('✅ [Dining Auth] Restored user session:', stored.id);
          setUser(stored);
        } else if (mounted) {
          console.log('ℹ️ [Dining Auth] No saved session found.');
        }
      } catch (err) {
        console.error('❌ [Dining Auth] Error loading session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const sendPhoneVerification = async (phoneNumber: string): Promise<ConfirmationResult> => {
    try {
      console.log('📱 [Dining Auth] Sending OTP to:', phoneNumber);
      await sendOTP(phoneNumber);
      return {
        verificationId: phoneNumber,
        confirm: async (code: string) => {
          return await confirmCode(phoneNumber, code);
        },
      };
    } catch (error) {
      console.error('❌ [Dining Auth] Send OTP error:', error);
      throw error;
    }
  };

  const confirmCode = async (confirmationOrPhone: any, code: string): Promise<DiningUser> => {
    try {
      const phone =
        typeof confirmationOrPhone === 'string'
          ? confirmationOrPhone
          : confirmationOrPhone?.verificationId || confirmationOrPhone?.phoneNumber;

      console.log('🔐 [Dining Auth] Confirming OTP for:', phone);
      const verifiedUser = await verifyOTP(phone, code);
      setUser(verifiedUser);
      console.log('✅ [Dining Auth] Successfully authenticated user:', verifiedUser.id);
      return verifiedUser;
    } catch (error) {
      console.error('❌ [Dining Auth] Verify OTP error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 [Dining Auth] Signing out...');
      await signOutUser();
      setUser(null);
      console.log('✅ [Dining Auth] Signed out');
    } catch (err) {
      console.error('❌ [Dining Auth] Error during sign out:', err);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const { data, error } = await updateUser(user.id, updates);
      if (error) throw error;
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('❌ [Dining Auth] Error updating user profile:', err);
      throw err;
    }
  };

  // Provide compatibility object for components that previously checked `firebaseUser`
  const firebaseUser = user ? { uid: user.id, phoneNumber: user.phone_number } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAuthenticated: !!user,
        sendPhoneVerification,
        confirmCode,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
