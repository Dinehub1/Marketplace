-- Migration: fix_notifications_rls_authenticated
-- Description: Fix notifications RLS policies to grant proper access to authenticated role
-- Date: 2026-01-14

-- Grant table permissions to authenticated role  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Drop existing policies (they target 'public' role incorrectly)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Recreate policies targeting authenticated role
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Allow system/triggers to insert notifications for any user
-- This is needed for the visitor notification system
CREATE POLICY "System can insert notifications for users" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);
