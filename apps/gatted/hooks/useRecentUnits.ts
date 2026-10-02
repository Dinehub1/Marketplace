import { useCallback, useState } from 'react';

type RecentUnit = {
    id: string;
    unitNumber: string;
};

const MAX_RECENT_UNITS = 5;

/**
 * Hook to track recently used units for quick selection.
 * Stores up to 5 most recently used units in memory (session-based).
 */
export function useRecentUnits() {
    const [recentUnits, setRecentUnits] = useState<RecentUnit[]>([]);

    const addRecentUnit = useCallback((id: string, unitNumber: string) => {
        setRecentUnits(prev => {
            // Remove if already exists
            const filtered = prev.filter(u => u.id !== id);
            // Add to front
            const updated = [{ id, unitNumber }, ...filtered];
            // Limit to max
            return updated.slice(0, MAX_RECENT_UNITS);
        });
    }, []);

    const clearRecentUnits = useCallback(() => {
        setRecentUnits([]);
    }, []);

    return { recentUnits, addRecentUnit, clearRecentUnits };
}
