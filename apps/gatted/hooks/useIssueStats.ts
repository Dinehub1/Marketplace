import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

type IssueStats = {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    highPriority: number;
};

type UseIssueStatsOptions = {
    societyId?: string | null;
    userId?: string | null;
    mode: 'society' | 'user';
};

export function useIssueStats({ societyId, userId, mode }: UseIssueStatsOptions) {
    const [stats, setStats] = useState<IssueStats>({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        highPriority: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = useCallback(async () => {
        try {
            setError(null);

            let query = supabase
                .from('issues')
                .select('id, status, priority');

            if (mode === 'society' && societyId) {
                query = query.eq('society_id', societyId);
            } else if (mode === 'user' && userId) {
                query = query.eq('reported_by', userId);
            } else {
                setIsLoading(false);
                return;
            }

            const { data: issues, error: queryError } = await query;

            if (queryError) throw queryError;

            setStats({
                total: issues?.length || 0,
                open: issues?.filter(i => i.status === 'open').length || 0,
                inProgress: issues?.filter(i => i.status === 'in-progress').length || 0,
                resolved: issues?.filter(i => ['resolved', 'closed'].includes(i.status)).length || 0,
                highPriority: issues?.filter(i => ['high', 'urgent'].includes(i.priority)).length || 0,
            });
        } catch (err: any) {
            console.error('Error loading issue stats:', err);
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
