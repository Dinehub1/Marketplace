-- SIMPLE ATOMIC FIX FOR NOTIFICATIONS RLS
-- Run this in Supabase SQL Editor
-- Each statement is independent and safe to re-run

-- Step 1: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies (safe if they don't exist)
DROP POLICY IF EXISTS "users_select_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_delete_own_notifications" ON notifications;
DROP POLICY IF EXISTS "system_insert_notifications" ON notifications;

-- Step 3: Create SELECT policy
CREATE POLICY "users_select_own_notifications" ON notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Step 4: Create UPDATE policy
CREATE POLICY "users_update_own_notifications" ON notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 5: Create DELETE policy
CREATE POLICY "users_delete_own_notifications" ON notifications
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Step 6: Create INSERT policy
CREATE POLICY "system_insert_notifications" ON notifications
FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('guard', 'manager', 'admin')
        AND user_roles.is_active = true
    )
);

-- Verification: This should return 4 rows
SELECT policyname FROM pg_policies WHERE tablename = 'notifications';
