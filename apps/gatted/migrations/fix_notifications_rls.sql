-- Migration: Fix Notifications RLS Policies
-- Purpose: Add missing RLS policies for notifications table
-- Date: 2026-01-13
-- Issue: Users getting "permission denied" error when loading notifications

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Policy 1: Users can SELECT their own notifications
CREATE POLICY "users_select_own_notifications" ON notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users can UPDATE their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications" ON notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can DELETE their own notifications
CREATE POLICY "users_delete_own_notifications" ON notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy 4: System/Guards/Managers can INSERT notifications for any user
-- This allows the backend to create notifications
CREATE POLICY "system_insert_notifications" ON notifications
FOR INSERT
TO authenticated
WITH CHECK (
    -- Either inserting for yourself OR you're a guard/manager/admin
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('guard', 'manager', 'admin')
        AND user_roles.is_active = true
    )
);

-- Verify policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'notifications';
    
    RAISE NOTICE 'Total RLS policies on notifications table: %', policy_count;
    
    IF policy_count != 4 THEN
        RAISE WARNING 'Expected 4 policies, found %', policy_count;
    END IF;
END $$;
