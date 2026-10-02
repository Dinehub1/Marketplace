import {
    AIPrediction,
    CycleData,
    CycleEntry,
    DEFAULT_CYCLE_DATA,
    DEFAULT_USER_PROFILE,
    STORAGE_KEYS,
    UserProfile
} from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ─── Generic AsyncStorage helpers ────────────────────────────────────────────

export async function getItem<T>(key: string): Promise<T | null> {
    try {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return null;
    }
}

export async function setItem<T>(key: string, value: T): Promise<boolean> {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing ${key}:`, error);
        return false;
    }
}

export async function removeItem(key: string): Promise<boolean> {
    try {
        await AsyncStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing ${key}:`, error);
        return false;
    }
}

// ─── Cycle Data ───────────────────────────────────────────────────────────────

export async function getCycleData(): Promise<CycleData> {
    const data = await getItem<CycleData>(STORAGE_KEYS.CYCLE_DATA);
    return data ?? DEFAULT_CYCLE_DATA;
}

export async function saveCycleData(data: CycleData): Promise<boolean> {
    return setItem(STORAGE_KEYS.CYCLE_DATA, data);
}

export async function addCycleEntry(entry: CycleEntry): Promise<boolean> {
    const data = await getCycleData();

    const existingIndex = data.entries.findIndex(e => e.date === entry.date);

    if (existingIndex >= 0) {
        data.entries[existingIndex] = {
            ...data.entries[existingIndex],
            ...entry,
            updatedAt: new Date().toISOString(),
        };
    } else {
        data.entries.push(entry);
    }

    // Sort entries newest-first
    data.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return saveCycleData(data);
}

export async function getEntryByDate(date: string): Promise<CycleEntry | null> {
    const data = await getCycleData();
    return data.entries.find(e => e.date === date) ?? null;
}

export async function setLastPeriodStart(date: string): Promise<boolean> {
    const data = await getCycleData();
    data.lastPeriodStart = date;
    return saveCycleData(data);
}

// ─── AI Prediction Cache ──────────────────────────────────────────────────────

export async function getAICache(): Promise<AIPrediction | null> {
    return getItem<AIPrediction>(STORAGE_KEYS.AI_PREDICTION);
}

export async function setAICache(prediction: AIPrediction): Promise<boolean> {
    return setItem(STORAGE_KEYS.AI_PREDICTION, prediction);
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile> {
    const data = await getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    return data ?? DEFAULT_USER_PROFILE;
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
    return setItem(STORAGE_KEYS.USER_PROFILE, profile);
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    const current = await getUserProfile();
    return saveUserProfile({ ...current, ...updates });
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function isOnboardingComplete(): Promise<boolean> {
    const value = await getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value ?? false;
}

export async function setOnboardingComplete(complete: boolean = true): Promise<boolean> {
    return setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, complete);
}

// ─── PIN — stored securely via SecureStore (NOT AsyncStorage) ─────────────────

export async function getPin(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(STORAGE_KEYS.PIN);
    } catch (error) {
        console.error('SecureStore getPin error:', error);
        return null;
    }
}

export async function setPin(pin: string): Promise<boolean> {
    try {
        await SecureStore.setItemAsync(STORAGE_KEYS.PIN, pin);
        return true;
    } catch (error) {
        console.error('SecureStore setPin error:', error);
        return false;
    }
}

export async function verifyPin(input: string): Promise<boolean> {
    const stored = await getPin();
    return stored === input;
}

export async function clearPin(): Promise<boolean> {
    try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN);
        return true;
    } catch (error) {
        console.error('SecureStore clearPin error:', error);
        return false;
    }
}

// ─── Clear All Data ───────────────────────────────────────────────────────────

export async function clearAllData(): Promise<boolean> {
    try {
        const asyncKeys = [
            STORAGE_KEYS.USER_PROFILE,
            STORAGE_KEYS.CYCLE_DATA,
            STORAGE_KEYS.ONBOARDING_COMPLETE,
            STORAGE_KEYS.AI_PREDICTION,
        ];
        await AsyncStorage.multiRemove(asyncKeys);
        await clearPin();
        return true;
    } catch (error) {
        console.error('Error clearing all data:', error);
        return false;
    }
}
