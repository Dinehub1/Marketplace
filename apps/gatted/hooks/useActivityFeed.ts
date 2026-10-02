import { ActivityItemData, ActivityType } from '@/components/guard/ActivityFeedItem';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

interface UseActivityFeedOptions {
    societyId: string | null | undefined;
    limit?: number;
}

type VisitorData = {
    id: string;
    visitor_name: string;
    visitor_type: string | null;
    checked_in_at: string | null;
    checked_out_at: string | null;
    unit: { unit_number: string; block: { name: string } | null } | null;
};

type ParcelData = {
    id: string;
    created_at: string | null;
    status: string;
    unit: { unit_number: string; block: { name: string } | null } | null;
};

export function useActivityFeed({ societyId, limit = 10 }: UseActivityFeedOptions) {
    const [activities, setActivities] = useState<ActivityItemData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadActivities = useCallback(async () => {
        if (!societyId) {
            setIsLoading(false);
            return;
        }

        try {
            setError(null);

            // Fetch recent visitors (check-ins and check-outs)
            const { data: visitors, error: visitorsError } = await supabase
                .from('visitors')
                .select('id, visitor_name, visitor_type, status, checked_in_at, checked_out_at, unit:units(unit_number, block:blocks(name))')
                .eq('society_id', societyId)
                .or('checked_in_at.not.is.null,checked_out_at.not.is.null')
                .order('checked_in_at', { ascending: false })
                .limit(limit);

            if (visitorsError) throw visitorsError;

            // Fetch recent parcels
            const { data: parcels, error: parcelsError } = await supabase
                .from('parcels')
                .select('id, created_at, status, unit:units(unit_number, block:blocks(name))')
                .eq('society_id', societyId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (parcelsError) throw parcelsError;

            // Transform to activity items
            const visitorActivities: ActivityItemData[] = ((visitors || []) as VisitorData[]).flatMap((v) => {
                const items: ActivityItemData[] = [];
                const unitInfo = v.unit ? `${v.unit.block?.name || ''}-${v.unit.unit_number}` : '';

                if (v.checked_in_at) {
                    items.push({
                        id: `checkin-${v.id}`,
                        type: 'check-in' as ActivityType,
                        title: `${v.visitor_name} (${v.visitor_type || 'Visitor'})`,
                        subtitle: `Checked in${unitInfo ? ` • ${unitInfo}` : ''}`,
                        timestamp: new Date(v.checked_in_at),
                    });
                }

                if (v.checked_out_at) {
                    items.push({
                        id: `checkout-${v.id}`,
                        type: 'check-out' as ActivityType,
                        title: `${v.visitor_name}`,
                        subtitle: `Checked out${unitInfo ? ` • ${unitInfo}` : ''}`,
                        timestamp: new Date(v.checked_out_at),
                    });
                }

                return items;
            });

            const parcelActivities: ActivityItemData[] = ((parcels || []) as ParcelData[])
                .filter((p) => p.created_at)
                .map((p) => {
                    const unitInfo = p.unit ? `${p.unit.block?.name || ''}-${p.unit.unit_number}` : '';
                    return {
                        id: `parcel-${p.id}`,
                        type: 'parcel' as ActivityType,
                        title: 'Parcel received',
                        subtitle: unitInfo ? `For ${unitInfo}` : 'New parcel',
                        timestamp: new Date(p.created_at!),
                    };
                });

            // Combine and sort by timestamp
            const allActivities = [...visitorActivities, ...parcelActivities]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, limit);

            setActivities(allActivities);
        } catch (err: any) {
            console.error('Error loading activity feed:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [societyId, limit]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    // Set up real-time subscription
    useEffect(() => {
        if (!societyId) return;

        const channel = supabase
            .channel('guard-activity-feed')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'visitors', filter: `society_id=eq.${societyId}` },
                () => loadActivities()
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'parcels', filter: `society_id=eq.${societyId}` },
                () => loadActivities()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [societyId, loadActivities]);

    return { activities, isLoading, error, refresh: loadActivities };
}
