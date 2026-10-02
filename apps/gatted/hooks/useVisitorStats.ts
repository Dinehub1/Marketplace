import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

type VisitorStats = {
    total: number;
    today: number;
    pending: number;
    checkedIn: number;
    upcoming: number;
};

type UseVisitorStatsOptions = {
    societyId?: string | null;
    userId?: string | null;
    mode: 'society' | 'user';
};

export function useVisitorStats({ societyId, userId, mode }: UseVisitorStatsOptions) {
    const [stats, setStats] = useState<VisitorStats>({
        total: 0,
        today: 0,
        pending: 0,
        checkedIn: 0,
        upcoming: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = useCallback(async () => {
        try {
            setError(null);
            const today = new Date().toISOString().split('T')[0];

            let query = supabase
                .from('visitors')
                .select('id, status, expected_date, checked_in_at');

            if (mode === 'society' && societyId) {
                query = query.eq('society_id', societyId);
            } else if (mode === 'user' && userId) {
                query = query.eq('host_id', userId);
            } else {
                setIsLoading(false);
                return;
            }

            const { data: visitors, error: queryError } = await query;

            if (queryError) throw queryError;

            const todayVisitors = visitors?.filter(v =>
                v.expected_date === today ||
                (v.checked_in_at && v.checked_in_at.startsWith(today))
            ) || [];

            const upcoming = visitors?.filter(v =>
                v.expected_date && v.expected_date >= today &&
                ['pending', 'approved'].includes(v.status)
            ) || [];

            setStats({
                total: visitors?.length || 0,
                today: todayVisitors.length,
                pending: visitors?.filter(v => v.status === 'pending').length || 0,
                checkedIn: visitors?.filter(v => v.status === 'checked-in').length || 0,
                upcoming: upcoming.length,
            });
        } catch (err: any) {
            console.error('Error loading visitor stats:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [societyId, userId, mode]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    return { stats, isLoading, error, refresh: loadStats };
}
