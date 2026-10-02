import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

interface GuardShift {
    id: string;
    guard_id: string | null;
    society_id: string | null;
    shift_start: string | null;
    shift_end: string | null;
}

interface UseGuardShiftOptions {
    guardId: string | null | undefined;
    societyId: string | null | undefined;
}

function calculateDuration(startTime: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
        return `${diffMins}m`;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
}

export function useGuardShift({ guardId, societyId }: UseGuardShiftOptions) {
    const [currentShift, setCurrentShift] = useState<GuardShift | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shiftDuration, setShiftDuration] = useState<string>('');

    const loadCurrentShift = useCallback(async () => {
        if (!guardId || !societyId) {
            setIsLoading(false);
            return;
        }

        try {
            setError(null);

            // Get active shift (no end time)
            const { data, error: shiftError } = await supabase
                .from('guard_shifts')
                .select('id, guard_id, society_id, shift_start, shift_end')
                .eq('guard_id', guardId)
                .eq('society_id', societyId)
                .is('shift_end', null)
                .order('shift_start', { ascending: false })
                .limit(1)
                .single();

            if (shiftError && shiftError.code !== 'PGRST116') {
                // PGRST116 = no rows found, which is fine
                throw shiftError;
            }

            // Check for stale shift (older than 12 hours)
            if (data?.shift_start) {
                const shiftStartTime = new Date(data.shift_start);
                const now = new Date();
                const diffHours = (now.getTime() - shiftStartTime.getTime()) / (1000 * 60 * 60);

                if (diffHours > 12) {
                    // Auto-end stale shift
                    console.log('Auto-ending stale shift:', data.id, 'Duration:', diffHours.toFixed(1), 'hours');
                    await supabase
                        .from('guard_shifts')
                        .update({ shift_end: now.toISOString() })
                        .eq('id', data.id);

                    setCurrentShift(null);
                    setShiftDuration('');
                    return;
                }

                setCurrentShift(data);
                setShiftDuration(calculateDuration(shiftStartTime));
            } else {
                setCurrentShift(data || null);
            }
        } catch (err: any) {
            console.error('Error loading current shift:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [guardId, societyId]);

    // Update duration every minute
    useEffect(() => {
        if (!currentShift?.shift_start) return;

        const interval = setInterval(() => {
            setShiftDuration(calculateDuration(new Date(currentShift.shift_start!)));
        }, 60000);

        return () => clearInterval(interval);
    }, [currentShift]);

    useEffect(() => {
        loadCurrentShift();
    }, [loadCurrentShift]);

    const startShift = useCallback(async () => {
        if (!guardId || !societyId) return;

        try {
            setError(null);

            const { data, error: insertError } = await supabase
                .from('guard_shifts')
                .insert({
                    guard_id: guardId,
                    society_id: societyId,
                    shift_start: new Date().toISOString(),
                })
                .select('id, guard_id, society_id, shift_start, shift_end')
                .single();

            if (insertError) throw insertError;

            setCurrentShift(data);
            if (data?.shift_start) {
                setShiftDuration(calculateDuration(new Date(data.shift_start)));
            }
        } catch (err: any) {
            console.error('Error starting shift:', err);
            setError(err.message);
            throw err;
        }
    }, [guardId, societyId]);

    const endShift = useCallback(async () => {
        if (!currentShift) return;

        try {
            setError(null);

            const { error: updateError } = await supabase
                .from('guard_shifts')
                .update({
                    shift_end: new Date().toISOString(),
                })
                .eq('id', currentShift.id);

            if (updateError) throw updateError;

            setCurrentShift(null);
            setShiftDuration('');
        } catch (err: any) {
            console.error('Error ending shift:', err);
            setError(err.message);
            throw err;
        }
    }, [currentShift]);

    return {
        currentShift,
        isShiftActive: !!currentShift,
        shiftDuration,
        shiftStartTime: currentShift?.shift_start ? new Date(currentShift.shift_start) : undefined,
        isLoading,
        error,
        startShift,
        endShift,
        refresh: loadCurrentShift,
    };
}
