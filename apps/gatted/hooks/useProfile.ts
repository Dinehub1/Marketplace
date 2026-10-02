import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/utils';
import { useCallback, useEffect, useState } from 'react';

type Profile = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string;
    avatar_url: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type UpdateProfileData = {
    full_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
};

export function useProfile(userId: string | null | undefined) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        try {
            setError(null);

            const { data, error: queryError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (queryError) throw queryError;

            setProfile(data);
        } catch (err: any) {
            console.error('Error loading profile:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const updateProfile = useCallback(async (updates: UpdateProfileData) => {
        if (!userId) return false;

        setIsSaving(true);
        try {
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();

            if (updateError) throw updateError;

            setProfile(data);
            showSuccess('Profile updated successfully');
            return true;
        } catch (err: any) {
            console.error('Error updating profile:', err);
            showError(err.message || 'Failed to update profile');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [userId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return {
        profile,
        isLoading,
        isSaving,
        error,
        refresh: loadProfile,
        updateProfile,
    };
}
