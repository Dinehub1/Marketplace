import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

type VisitorLookupResult = {
    name?: string;
    isCheckedInToday: boolean;
    lastVisit?: Date;
};

type UseVisitorLookupOptions = {
    phone: string;
    societyId: string;
    enabled?: boolean;
};

/**
 * Hook to lookup visitor information by phone number.
 * - Auto-fills name from previous visits
 * - Checks if visitor already checked in today (warning)
 */
export function useVisitorLookup({ phone, societyId, enabled = true }: UseVisitorLookupOptions) {
    const [result, setResult] = useState<VisitorLookupResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const lookup = useCallback(async () => {
        // Only lookup if phone is valid (10 digits)
        const cleanPhone = phone.replace(/\s/g, '');
        if (!enabled || cleanPhone.length !== 10 || !societyId) {
            setResult(null);
            return;
        }

        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Look for visitors with this phone number
            const { data: visitors, error } = await supabase
                .from('visitors')
                .select('id, visitor_name, status, checked_in_at, created_at')
                .eq('society_id', societyId)
                .eq('visitor_phone', cleanPhone)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            if (!visitors || visitors.length === 0) {
                setResult(null);
                return;
            }

            // Check if already checked in today
            const checkedInToday = visitors.some(v =>
                v.status === 'checked-in' &&
                v.checked_in_at?.startsWith(today)
            );

            // Get most recent visitor name
            const mostRecent = visitors[0];
            const lastVisitDate = mostRecent.checked_in_at || mostRecent.created_at;

            setResult({
                name: mostRecent.visitor_name,
                isCheckedInToday: checkedInToday,
                lastVisit: lastVisitDate ? new Date(lastVisitDate) : undefined,
            });
        } catch (err) {
            console.error('Error looking up visitor:', err);
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    }, [phone, societyId, enabled]);

    // Debounce the lookup to avoid too many requests
    useEffect(() => {
        const timer = setTimeout(() => {
            lookup();
        }, 500);

        return () => clearTimeout(timer);
    }, [lookup]);

    return { result, isLoading };
}
