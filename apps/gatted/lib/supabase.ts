import type { Database } from '@/types/database.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { ENV } from './env';

// Platform-aware storage adapter
const getStorage = () => {
    if (Platform.OS === 'web') {
        // For web, use localStorage (wrapped to match AsyncStorage API)
        return {
            getItem: (key: string) => {
                if (typeof window !== 'undefined') {
                    return Promise.resolve(window.localStorage.getItem(key));
                }
                return Promise.resolve(null);
            },
            setItem: (key: string, value: string) => {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, value);
                }
                return Promise.resolve();
            },
            removeItem: (key: string) => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(key);
                }
                return Promise.resolve();
            },
        };
    }
    // For native (iOS/Android), use AsyncStorage
    return AsyncStorage;
};

// Create Supabase client with platform-aware storage
export const supabase = createClient<Database>(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_ANON_KEY,
    {
        auth: {
            storage: getStorage(),
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: Platform.OS === 'web',
        },
    }
);

// Helper functions for common operations
export const supabaseHelpers = {
    // Auth helpers
    async signInWithOTP(phone: string) {
        return await supabase.auth.signInWithOtp({
            phone,
            options: {
                channel: 'sms',
            },
        });
    },

    async verifyOTP(phone: string, token: string) {
        return await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
    },

    async signOut() {
        return await supabase.auth.signOut();
    },

    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Profile helpers
    async getProfile(userId: string) {
        return await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
    },

    async getUserRoles(userId: string) {
        return await supabase
            .from('user_roles')
            .select(`
        *,
        society:societies(*),
        unit:units(*)
      `)
            .eq('user_id', userId)
            .eq('is_active', true);
    },

    // Visitor helpers
    async getExpectedVisitors(societyId: string, date?: string) {
        let query = supabase
            .from('visitors')
            .select(`
        *,
        unit:units(*),
        host:profiles!visitors_host_id_fkey(*)
      `)
            .eq('society_id', societyId)
            .in('status', ['pending', 'approved']);

        if (date) {
            query = query.eq('expected_date', date);
        }

        return await query.order('expected_time', { ascending: true, nullsFirst: false });
    },

    async logVisitorEntry(visitorId: string, guardId: string, otp?: string) {
        // Use the database function for check-in which includes validation
        const { data, error } = await supabase.rpc('checkin_visitor', {
            visitor_uuid: visitorId,
            guard_uuid: guardId,
            otp_code: otp,
        });

        if (error) {
            console.error('Check-in error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    },

    async logVisitorExit(visitorId: string, guardId: string) {
        // Use the database function for check-out which includes validation
        const { data, error } = await supabase.rpc('checkout_visitor', {
            visitor_uuid: visitorId,
            guard_uuid: guardId,
        });

        if (error) {
            console.error('Check-out error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    },

    // Issue helpers
    async createIssue(issue: {
        society_id: string;
        unit_id?: string;
        reported_by: string;
        title: string;
        description?: string;
        category: 'plumbing' | 'electrical' | 'cleaning' | 'security' | 'maintenance' | 'parking' | 'noise' | 'other';
        priority?: 'low' | 'medium' | 'high' | 'urgent';
        photos?: string[];
    }) {
        return await supabase
            .from('issues')
            .insert(issue)
            .select()
            .single();
    },

    async getIssues(societyId: string, filters?: {
        status?: 'open' | 'in-progress' | 'resolved' | 'closed' | 'rejected';
        category?: 'plumbing' | 'electrical' | 'cleaning' | 'security' | 'maintenance' | 'parking' | 'noise' | 'other';
        reported_by?: string;
    }) {
        let query = supabase
            .from('issues')
            .select(`
        *,
        unit:units(*),
        reporter:profiles!issues_reported_by_fkey(*),
        assignee:profiles!issues_assigned_to_fkey(*)
      `)
            .eq('society_id', societyId);

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.category) {
            query = query.eq('category', filters.category);
        }
        if (filters?.reported_by) {
            query = query.eq('reported_by', filters.reported_by);
        }

        return await query.order('created_at', { ascending: false });
    },

    // Announcement helpers
    async getAnnouncements(societyId: string, userId: string) {
        return await supabase
            .from('announcements')
            .select(`
        *,
        creator:profiles!announcements_created_by_fkey(*),
        reads:announcement_reads(user_id, read_at)
      `)
            .eq('society_id', societyId)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('created_at', { ascending: false });
    },

    async markAnnouncementAsRead(announcementId: string, userId: string) {
        return await supabase
            .from('announcement_reads')
            .upsert({
                announcement_id: announcementId,
                user_id: userId,
            });
    },
};
