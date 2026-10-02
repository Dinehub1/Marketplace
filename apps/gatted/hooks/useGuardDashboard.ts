import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

export type GuardDashboardStats = {
    visitorsToday: number;
    insideNow: number;
    pendingParcels: number;
    openIssues: number;
};

interface UseGuardDashboardOptions {
    societyId: string | null | undefined;
}

export function useGuardDashboard({ societyId }: UseGuardDashboardOptions) {
    const [stats, setStats] = useState<GuardDashboardStats>({
        visitorsToday: 0,
        insideNow: 0,
        pendingParcels: 0,
        openIssues: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = useCallback(async () => {
        if (!societyId) {
            setIsLoading(false);
            return;
        }

        try {
            setError(null);
            const today = new Date().toISOString().split('T')[0];

            // Fetch visitors
            const { data: visitors, error: visitorsError } = await supabase
                .from('visitors')
                .select('id, status, expected_date, checked_in_at')
                .eq('society_id', societyId);

            if (visitorsError) throw visitorsError;

            const visitorsToday = visitors?.filter(v =>
                v.expected_date === today ||
                (v.checked_in_at && v.checked_in_at.startsWith(today))
            ).length || 0;

            const insideNow = visitors?.filter(v => v.status === 'checked-in').length || 0;

            // Fetch pending parcels (received but not yet collected)
            const { data: parcels, error: parcelsError } = await supabase
                .from('parcels')
                .select('id')
                .eq('society_id', societyId)
                .in('status', ['received', 'notified']);

            if (parcelsError) throw parcelsError;
            const pendingParcels = parcels?.length || 0;

            // Fetch open issues
            const { data: issues, error: issuesError } = await supabase
                .from('issues')
                .select('id')
                .eq('society_id', societyId)
                .in('status', ['open', 'in-progress']);

            if (issuesError) throw issuesError;
            const openIssues = issues?.length || 0;

            setStats({
                visitorsToday,
                insideNow,
                pendingParcels,
                openIssues,
            });
        } catch (err: any) {
            console.error('Error loading guard dashboard stats:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [societyId]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    return { stats, isLoading, error, refresh: loadStats };
}
