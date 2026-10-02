import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

export type VisitorStatus = 'pending' | 'approved' | 'denied' | 'checked-in' | 'checked-out';

export type Visitor = {
    id: string;
    visitor_name: string;
    visitor_phone: string | null;
    purpose: string | null;
    status: VisitorStatus;
    created_at: string;
    checked_in_at: string | null;
    unit_id: string;
    unit_number?: string;
};

type UseVisitorApprovalOptions = {
    societyId: string | null | undefined;
    userId: string | null | undefined;
    unitId?: string | null | undefined; // For resident filtering by their unit
    role: 'guard' | 'resident' | 'manager';
};

/**
 * Unified hook for visitor approval actions and state management.
 * Used by Guard, Resident, and Manager dashboards.
 */
export function useVisitorApproval({ societyId, userId, unitId, role }: UseVisitorApprovalOptions) {
    const [pendingVisitors, setPendingVisitors] = useState<Visitor[]>([]);
    const [approvedVisitors, setApprovedVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadVisitors = useCallback(async () => {
        if (!societyId) {
            setIsLoading(false);
            return;
        }

        try {
            setError(null);

            // Build query based on role
            let query = supabase
                .from('visitors')
                .select(`
                    id,
                    visitor_name,
                    visitor_phone,
                    purpose,
                    status,
                    created_at,
                    checked_in_at,
                    unit_id,
                    host_id,
                    units:unit_id (unit_number)
                `)
                .eq('society_id', societyId)
                .eq('visitor_type', 'walk-in')
                .in('status', ['pending', 'approved'])
                .order('created_at', { ascending: false });

            // Resident sees visitors for their unit (not just where they are host)
            if (role === 'resident' && unitId) {
                query = query.eq('unit_id', unitId);
            }

            const { data, error: queryError } = await query;

            if (queryError) throw queryError;

            const visitors: Visitor[] = (data || []).map((v: any) => ({
                id: v.id,
                visitor_name: v.visitor_name,
                visitor_phone: v.visitor_phone,
                purpose: v.purpose,
                status: v.status,
                created_at: v.created_at,
                checked_in_at: v.checked_in_at,
                unit_id: v.unit_id,
                unit_number: v.units?.unit_number,
            }));

            setPendingVisitors(visitors.filter(v => v.status === 'pending'));
            setApprovedVisitors(visitors.filter(v => v.status === 'approved'));
        } catch (err: any) {
            console.error('Error loading visitors:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [societyId, unitId, role]);

    // Approve a pending visitor (Resident action)
    const approve = useCallback(async (visitorId: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('visitors')
                .update({
                    status: 'approved',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', visitorId)
                .eq('status', 'pending'); // Only approve pending visitors

            if (updateError) throw updateError;

            // Update local state
            const visitor = pendingVisitors.find(v => v.id === visitorId);
            if (visitor) {
                setPendingVisitors(prev => prev.filter(v => v.id !== visitorId));
                setApprovedVisitors(prev => [{ ...visitor, status: 'approved' }, ...prev]);
            }

            return true;
        } catch (err: any) {
            console.error('Error approving visitor:', err);
            return false;
        }
    }, [pendingVisitors]);

    // Deny a pending visitor (Resident action)
    const deny = useCallback(async (visitorId: string, reason?: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('visitors')
                .update({
                    status: 'denied',
                    rejection_reason: reason || 'Denied by resident',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', visitorId)
                .eq('status', 'pending'); // Only deny pending visitors

            if (updateError) throw updateError;

            // Remove from local state
            setPendingVisitors(prev => prev.filter(v => v.id !== visitorId));

            return true;
        } catch (err: any) {
            console.error('Error denying visitor:', err);
            return false;
        }
    }, []);

    // Check in an approved visitor (Guard action)
    const checkIn = useCallback(async (visitorId: string, guardId: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('visitors')
                .update({
                    status: 'checked-in',
                    checked_in_at: new Date().toISOString(),
                    checked_in_by: guardId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', visitorId)
                .eq('status', 'approved'); // Only check-in approved visitors

            if (updateError) throw updateError;

            // Remove from local state
            setApprovedVisitors(prev => prev.filter(v => v.id !== visitorId));

            return true;
        } catch (err: any) {
            console.error('Error checking in visitor:', err);
            return false;
        }
    }, []);

    // Check out a checked-in visitor (Guard action)
    const checkOut = useCallback(async (visitorId: string, guardId: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('visitors')
                .update({
                    status: 'checked-out',
                    checked_out_at: new Date().toISOString(),
                    checked_out_by: guardId,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', visitorId)
                .eq('status', 'checked-in'); // Only check-out checked-in visitors

            if (updateError) throw updateError;

            return true;
        } catch (err: any) {
            console.error('Error checking out visitor:', err);
            return false;
        }
    }, []);

    useEffect(() => {
        loadVisitors();
    }, [loadVisitors]);

    return {
        pendingVisitors,
        approvedVisitors,
        pendingCount: pendingVisitors.length,
        approvedCount: approvedVisitors.length,
        isLoading,
        error,
        approve,
        deny,
        checkIn,
        checkOut,
        refresh: loadVisitors,
    };
}
