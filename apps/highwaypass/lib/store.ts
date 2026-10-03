import { create } from 'zustand';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

interface Pass {
    id: string;
    vrn: string;
    fastag_id: string;
    vehicle_class: string;
    issuer_bank: string | null;
    price: number;
    trips_total: number;
    trips_used: number;
    status: string;
    activated_at: string;
    expires_at: string;
}

interface AppState {
    session: Session | null;
    loading: boolean;
    activePass: Pass | null;
    setSession: (session: Session | null) => void;
    setLoading: (loading: boolean) => void;
    fetchActivePass: () => Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
    session: null,
    loading: true,
    activePass: null,

    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),

    fetchActivePass: async () => {
        const { session } = get();
        if (!session) return;

        const { data } = await supabase
            .from('passes')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        set({ activePass: data });
    },
}));
