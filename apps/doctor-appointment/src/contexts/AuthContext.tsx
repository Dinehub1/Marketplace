import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'patient' | 'doctor';
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'patient' | 'doctor';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Global flags to prevent storage conflicts
let hasExplicitlyLoggedIn = false;
let hasRestoredOnce = false;

// Platform-aware storage helpers
const storeSecurely = async (key: string, value: string) => {
  try {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      await AsyncStorage.setItem(key, value);
    } else {
      // Use SecureStore for native
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.warn(`⚠️ Storage write failed for ${key}:`, error);
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(key, value);
  }
};

const getSecurely = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.warn(`⚠️ Storage read failed for ${key}:`, error);
    // Fallback to AsyncStorage
    return await AsyncStorage.getItem(key);
  }
};

const removeSecurely = async (key: string) => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.warn(`⚠️ Storage remove failed for ${key}:`, error);
    // Fallback to AsyncStorage
    await AsyncStorage.removeItem(key);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!user;

  useEffect(() => {
    console.info('🚀 AuthProvider mounted');
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.info('📱 Loading user data from storage...', {
        platform: Platform.OS,
        hasRestoredOnce,
        hasExplicitlyLoggedIn
      });

      // Guard: Only restore once on initial load
      if (hasRestoredOnce) {
        console.info('🛡️ Skipping restore - already done once');
        setIsLoading(false);
        return;
      }

      // Guard: Never override explicit login with storage
      if (hasExplicitlyLoggedIn) {
        console.info('🛡️ Skipping restore - user explicitly logged in');
        setIsLoading(false);
        return;
      }

      const token = await getSecurely(TOKEN_KEY);
      const userData = await getSecurely(USER_KEY);
      
      console.info('🔑 Storage check:', { hasToken: !!token, hasUserData: !!userData });
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        console.info('✅ User restored from storage:', parsedUser.email);
        setUser(parsedUser);
      } else {
        console.info('❌ No stored user data found');
      }

      hasRestoredOnce = true;
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    } finally {
      setIsLoading(false);
      console.info('🏁 Loading complete');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      hasExplicitlyLoggedIn = true;
      console.info('🔐 Starting login process for:', email);
      
      // Mock login - replace with actual API call
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        userType: 'patient',
      };
      
      const mockToken = `jwt_token_${Date.now()}`;
      
      console.info('💾 Saving user data to storage...');
      await storeSecurely(TOKEN_KEY, mockToken);
      await storeSecurely(USER_KEY, JSON.stringify(mockUser));
      
      console.info('✅ Setting user in context...');
      setUser(mockUser);
      console.info('🎉 Login successful! User:', mockUser.email);
    } catch (error) {
      console.error('❌ Login error:', error);
      hasExplicitlyLoggedIn = false;
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    try {
      setIsLoading(true);
      hasExplicitlyLoggedIn = true;
      console.info('🚀 Starting demo login...');
      
      const demoUser: User = {
        id: 'demo',
        email: 'demo@medicalapp.com',
        firstName: 'Demo',
        lastName: 'User',
        userType: 'patient',
      };
      
      const demoToken = `demo_token_${Date.now()}`;
      
      console.info('💾 Saving demo user data...');
      await storeSecurely(TOKEN_KEY, demoToken);
      await storeSecurely(USER_KEY, JSON.stringify(demoUser));
      
      console.info('✅ Setting demo user in context...');
      setUser(demoUser);
      console.info('🎉 Demo login successful!');
    } catch (error) {
      console.error('❌ Demo login error:', error);
      hasExplicitlyLoggedIn = false;
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      hasExplicitlyLoggedIn = true;
      console.info('📝 Starting registration process for:', userData.email);
      
      // Mock registration - replace with actual API call
      const mockUser: User = {
        id: '2',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
      };
      
      const mockToken = `jwt_token_${Date.now()}`;
      
      console.info('💾 Saving new user data to storage...');
      await storeSecurely(TOKEN_KEY, mockToken);
      await storeSecurely(USER_KEY, JSON.stringify(mockUser));
      
      console.info('✅ Setting new user in context...');
      setUser(mockUser);
      console.info('🎉 Registration successful! User:', mockUser.email);
    } catch (error) {
      console.error('❌ Registration error:', error);
      hasExplicitlyLoggedIn = false;
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.info('🚪 Logging out user...');
      hasExplicitlyLoggedIn = false;
      hasRestoredOnce = false; // Allow restore on next session
      
      await removeSecurely(TOKEN_KEY);
      await removeSecurely(USER_KEY);
      setUser(null);
      console.info('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn,
    isLoading,
    login,
    register,
    demoLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
