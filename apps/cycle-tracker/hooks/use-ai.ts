import { generateDataHash, getAIPrediction } from '@/services/ai';
import { getAICache, setAICache } from '@/services/storage';
import { AIPrediction, CycleData, UserProfile } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * AI predictions are a Pro feature, and each fetch is a paid model call, so `enabled` is false for
 * free users: nothing is fetched or served from cache for them.
 */
export function useAIPrediction(cycleData: CycleData, profile: UserProfile, enabled = true) {
    const [prediction, setPrediction] = useState<AIPrediction | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchingRef = useRef(false);

    // Check if cache is fresh
    const isCacheFresh = useCallback(
        (cached: AIPrediction): boolean => {
            const age = Date.now() - new Date(cached.generatedAt).getTime();
            const dataHash = generateDataHash(cycleData);
            return age < CACHE_TTL_MS && cached.dataHash === dataHash;
        },
        [cycleData]
    );

    // Load prediction (cache-first)
    const loadPrediction = useCallback(async () => {
        if (fetchingRef.current) return;

        if (!enabled) {
            setPrediction(null);
            return;
        }

        // Need minimum data
        if (!cycleData.lastPeriodStart || cycleData.entries.length < 1) {
            setPrediction(null);
            return;
        }

        try {
            // Check cache first
            const cached = await getAICache();
            if (cached && isCacheFresh(cached)) {
                console.log('[AI Hook] Using cached prediction');
                setPrediction(cached);
                return;
            }

            // Fetch new prediction
            fetchingRef.current = true;
            setLoading(true);
            setError(null);

            const result = await getAIPrediction(cycleData, profile);
            await setAICache(result);
            console.log('[AI Hook] New prediction cached');
            setPrediction(result);
        } catch (err: any) {
            console.error('[AI Hook] Error:', err?.message || err);
            setError(err?.message || 'Could not generate prediction');
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [cycleData, profile, isCacheFresh, enabled]);

    // Auto-load on mount and data changes
    useEffect(() => {
        loadPrediction();
    }, [loadPrediction]);

    // Manual refresh (bypasses cache)
    const refresh = useCallback(async () => {
        if (fetchingRef.current || !enabled) return;
        if (!cycleData.lastPeriodStart || cycleData.entries.length < 1) return;

        fetchingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const result = await getAIPrediction(cycleData, profile);
            await setAICache(result);
            setPrediction(result);
        } catch (err: any) {
            console.error('[AI Hook] Refresh error:', err?.message || err);
            setError(err?.message || 'Could not refresh prediction');
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [cycleData, profile, enabled]);

    return { prediction, loading, error, refresh };
}
