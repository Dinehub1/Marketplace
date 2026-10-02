import {
    addCycleEntry,
    clearAllData,
    getCycleData,
    getEntryByDate,
    getUserProfile,
    isOnboardingComplete,
    saveCycleData,
    saveUserProfile,
    setLastPeriodStart,
    setOnboardingComplete,
} from '@/services/storage';
import {
    CycleData,
    CycleEntry,
    CyclePhase,
    CycleStats,
    CycleStatus,
    DEFAULT_CYCLE_DATA,
    DEFAULT_USER_PROFILE,
    UserProfile,
} from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

// ─── Cycle phase + status calculator ─────────────────────────────────────────

function calculateCycleStatus(cycleData: CycleData): CycleStatus {
    const defaultStatus: CycleStatus = {
        currentDay: 1,
        phase: 'period',
        daysUntilPeriod: 0,
        fertileWindow: false,
        ovulationDay: false,
    };

    if (!cycleData.lastPeriodStart) return defaultStatus;

    const lastPeriod = new Date(cycleData.lastPeriodStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastPeriod.setHours(0, 0, 0, 0);

    const diffDays = Math.max(0, Math.floor(
        (today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
    ));

    const currentDay = (diffDays % cycleData.cycleLength) + 1;
    const daysUntilPeriod = Math.max(0, cycleData.cycleLength - currentDay + 1);

    // Fix: ovulation = cycleLength - 14 (luteal phase is always ~14 days)
    const ovulationDay = cycleData.cycleLength - 14;
    const fertileStart = ovulationDay - 5;
    const fertileEnd = ovulationDay + 1;

    let phase: CyclePhase;
    if (currentDay <= cycleData.periodLength) {
        phase = 'period';
    } else if (currentDay < fertileStart) {
        phase = 'follicular';
    } else if (currentDay >= fertileStart && currentDay <= fertileEnd) {
        phase = 'ovulation';
    } else {
        phase = 'luteal';
    }

    return {
        currentDay,
        phase,
        daysUntilPeriod,
        fertileWindow: currentDay >= fertileStart && currentDay <= fertileEnd,
        ovulationDay: currentDay === ovulationDay,
    };
}

// ─── Pregnancy week calculator (LMP method) ───────────────────────────────────

export function getPregnancyWeek(lastPeriodStart: string | null): number {
    if (!lastPeriodStart) return 0;
    const lmp = new Date(lastPeriodStart);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.floor(diffDays / 7)); // LMP-based: weeks since last period
}

// ─── useCycleData hook ────────────────────────────────────────────────────────

export function useCycleData() {
    const [cycleData, setCycleData] = useState<CycleData>(DEFAULT_CYCLE_DATA);
    const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        const data = await getCycleData();
        setCycleData(data);
        setCycleStatus(calculateCycleStatus(data));
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const saveData = useCallback(async (data: CycleData) => {
        const success = await saveCycleData(data);
        if (success) {
            setCycleData(data);
            setCycleStatus(calculateCycleStatus(data));
        }
        return success;
    }, []);

    const addEntry = useCallback(async (entry: CycleEntry) => {
        const success = await addCycleEntry(entry);
        if (success) await loadData();
        return success;
    }, [loadData]);

    const setLastPeriod = useCallback(async (date: string) => {
        const success = await setLastPeriodStart(date);
        if (success) await loadData();
        return success;
    }, [loadData]);

    // Computed cycle statistics — memoised so they don't recalculate on every render
    const cycleStats = useMemo<CycleStats>(() => {
        const entries = cycleData.entries;
        const periodStartDates = entries
            .filter(e => e.flow === 'light' || e.flow === 'medium' || e.flow === 'heavy')
            .map(e => new Date(e.date).getTime())
            .sort((a, b) => a - b);

        if (periodStartDates.length < 2) {
            return {
                avgLength: cycleData.cycleLength,
                shortestCycle: cycleData.cycleLength,
                longestCycle: cycleData.cycleLength,
                totalEntries: entries.length,
            };
        }

        const cycleLengths: number[] = [];
        for (let i = 1; i < periodStartDates.length; i++) {
            const diff = Math.round(
                (periodStartDates[i] - periodStartDates[i - 1]) / (1000 * 60 * 60 * 24)
            );
            if (diff > 15 && diff < 60) cycleLengths.push(diff);
        }

        if (cycleLengths.length === 0) {
            return {
                avgLength: cycleData.cycleLength,
                shortestCycle: cycleData.cycleLength,
                longestCycle: cycleData.cycleLength,
                totalEntries: entries.length,
            };
        }

        const avg = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
        return {
            avgLength: avg,
            shortestCycle: Math.min(...cycleLengths),
            longestCycle: Math.max(...cycleLengths),
            totalEntries: entries.length,
        };
    }, [cycleData]);

    return {
        cycleData,
        cycleStatus,
        cycleStats,
        loading,
        saveData,
        addEntry,
        setLastPeriod,
        refresh: loadData,
    };
}

// ─── useUserProfile hook ──────────────────────────────────────────────────────

export function useUserProfile() {
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        const data = await getUserProfile();
        setProfile(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        const newProfile = { ...profile, ...updates };
        const success = await saveUserProfile(newProfile);
        if (success) setProfile(newProfile);
        return success;
    }, [profile]);

    return { profile, loading, updateProfile, refresh: loadProfile };
}

// ─── useOnboarding hook ───────────────────────────────────────────────────────

export function useOnboarding() {
    const [isComplete, setIsComplete] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        const complete = await isOnboardingComplete();
        setIsComplete(complete);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
        const sub = DeviceEventEmitter.addListener('onboardingStatusChanged', (status) => {
            setIsComplete(status);
        });
        return () => sub.remove();
    }, [loadData]);

    const completeOnboarding = useCallback(async () => {
        const success = await setOnboardingComplete(true);
        if (success) {
            setIsComplete(true);
            DeviceEventEmitter.emit('onboardingStatusChanged', true);
        }
        return success;
    }, []);

    const clearData = useCallback(async () => {
        const success = await clearAllData();
        if (success) {
            setIsComplete(false);
            DeviceEventEmitter.emit('onboardingStatusChanged', false);
        }
        return success;
    }, []);

    return { isComplete, loading, completeOnboarding, clearData };
}

// ─── useDayEntry hook ─────────────────────────────────────────────────────────

export function useDayEntry(date: string) {
    const [entry, setEntry] = useState<CycleEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getEntryByDate(date).then(data => {
            setEntry(data);
            setLoading(false);
        });
    }, [date]);

    return { entry, loading };
}
