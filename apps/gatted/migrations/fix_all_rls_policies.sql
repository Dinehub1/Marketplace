-- Migration: Comprehensive RLS Policy Fix
-- Purpose: Enable and create missing RLS policies for all tables
-- Date: 2026-01-13
-- Issue: Multiple tables have RLS disabled or missing policies
-- Note: This version drops ALL possible policy names to prevent conflicts

-- =====================================================
-- NOTIFICATIONS TABLE - CRITICAL FIX
-- =====================================================

-- Enable RLS on notifications table 
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop ANY possible existing policies (handles partial migrations)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "users_select_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_delete_own_notifications" ON notifications;
DROP POLICY IF EXISTS "system_insert_notifications" ON notifications;

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

-- Policy 4: Guards/Managers/Admins can INSERT notifications for any user
CREATE POLICY "system_insert_notifications" ON notifications
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('guard', 'manager', 'admin')
        AND user_roles.is_active = true
    )
);

-- =====================================================
-- UNIT_RESIDENTS TABLE
-- =====================================================

-- Enable RLS on unit_residents table
ALTER TABLE unit_residents ENABLE ROW LEVEL SECURITY;

-- Drop ANY possible existing policies
DROP POLICY IF EXISTS "Admins can manage residents" ON unit_residents;
DROP POLICY IF EXISTS "Users can view society residents" ON unit_residents;
DROP POLICY IF EXISTS "staff_manage_residents" ON unit_residents;
DROP POLICY IF EXISTS "users_view_society_residents" ON unit_residents;
DROP POLICY IF EXISTS "admins_manage_residents" ON unit_residents;
DROP POLICY IF EXISTS "residents_view_society" ON unit_residents;
DROP POLICY IF EXISTS "managers_manage_residents" ON unit_residents;

-- Policy 1: Admins/Managers can manage residents in their society
CREATE POLICY "staff_manage_residents" ON unit_residents
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN units u ON u.id = unit_residents.unit_id
        WHERE ur.user_id = auth.uid()
        AND ur.society_id = u.society_id
        AND ur.role IN ('admin', 'manager')
        AND ur.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN units u ON u.id = unit_residents.unit_id
        WHERE ur.user_id = auth.uid()
        AND ur.society_id = u.society_id
        AND ur.role IN ('admin', 'manager')
        AND ur.is_active = true
    )
);

-- Policy 2: Users can view residents in their society
CREATE POLICY "users_view_society_residents" ON unit_residents
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN units u ON u.id = unit_residents.unit_id
        WHERE ur.user_id = auth.uid()
        AND ur.society_id = u.society_id
        AND ur.is_active = true
    )
);

-- =====================================================
-- ISSUE_UPDATES TABLE
-- =====================================================

-- Enable RLS on issue_updates table
ALTER TABLE issue_updates ENABLE ROW LEVEL SECURITY;

-- Drop ANY possible existing policies
DROP POLICY IF EXISTS "Staff can view society issue updates" ON issue_updates;
DROP POLICY IF EXISTS "Users can add issue updates" ON issue_updates;
DROP POLICY IF EXISTS "Users can view issue updates" ON issue_updates;
DROP POLICY IF EXISTS "users_view_issue_updates" ON issue_updates;
DROP POLICY IF EXISTS "users_add_issue_updates" ON issue_updates;
DROP POLICY IF EXISTS "staff_view_issue_updates" ON issue_updates;

-- Policy 1: Users can view updates for issues in their society
CREATE POLICY "users_view_issue_updates" ON issue_updates
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM issues i
        JOIN user_roles ur ON ur.society_id = i.society_id
        WHERE i.id = issue_updates.issue_id
        AND ur.user_id = auth.uid()
        AND ur.is_active = true
    )
);

-- Policy 2: Users can add updates to issues in their society
CREATE POLICY "users_add_issue_updates" ON issue_updates
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM issues i
        JOIN user_roles ur ON ur.society_id = i.society_id
        WHERE i.id = issue_updates.issue_id
        AND ur.user_id = auth.uid()
        AND ur.is_active = true
    )
    AND user_id = auth.uid()
);

-- =====================================================
-- GUARD_SHIFTS TABLE
-- =====================================================

-- Enable RLS on guard_shifts table
ALTER TABLE guard_shifts ENABLE ROW LEVEL SECURITY;

-- Drop ANY possible existing policies
DROP POLICY IF EXISTS "Guards can create shifts" ON guard_shifts;
DROP POLICY IF EXISTS "Guards can view own shifts" ON guard_shifts;
DROP POLICY IF EXISTS "Managers can manage shifts" ON guard_shifts;
DROP POLICY IF EXISTS "Staff can view society shifts" ON guard_shifts;
DROP POLICY IF EXISTS "guards_view_society_shifts" ON guard_shifts;
DROP POLICY IF EXISTS "guards_create_own_shifts" ON guard_shifts;
DROP POLICY IF EXISTS "managers_manage_shifts" ON guard_shifts;
DROP POLICY IF EXISTS "guards_view_shifts" ON guard_shifts;

-- Policy 1: Guards can view shifts in their society
CREATE POLICY "guards_view_society_shifts" ON guard_shifts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.society_id = guard_shifts.society_id
        AND user_roles.role IN ('guard', 'manager', 'admin')
        AND user_roles.is_active = true
    )
);

-- Policy 2: Guards can create their own shifts
CREATE POLICY "guards_create_own_shifts" ON guard_shifts
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.society_id = guard_shifts.society_id
        AND user_roles.role = 'guard'
        AND user_roles.is_active = true
    )
    AND guard_id = auth.uid()
);

-- Policy 3: Managers can manage all shifts in their society
CREATE POLICY "managers_manage_shifts" ON guard_shifts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.society_id = guard_shifts.society_id
        AND user_roles.role IN ('manager', 'admin')
        AND user_roles.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.society_id = guard_shifts.society_id
        AND user_roles.role IN ('manager', 'admin')
        AND user_roles.is_active = true
    )
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify RLS is enabled on all critical tables
DO $$
DECLARE
    rls_status RECORD;
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'RLS Status Check:';
    FOR rls_status IN 
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('notifications', 'unit_residents', 'issue_updates', 'guard_shifts')
        ORDER BY tablename
    LOOP
        IF rls_status.rowsecurity THEN
            RAISE NOTICE '  ✓ Table % has RLS ENABLED', rls_status.tablename;
        ELSE
            RAISE WARNING '  ✗ Table % does NOT have RLS enabled!', rls_status.tablename;
        END IF;
    END LOOP;
    RAISE NOTICE '===========================================';
END $$;

-- Count policies per table
DO $$
DECLARE
    policy_count RECORD;
BEGIN
    RAISE NOTICE 'Policy Count Per Table:';
    FOR policy_count IN 
        SELECT tablename, COUNT(*) as count
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('notifications', 'unit_residents', 'issue_updates', 'guard_shifts')
        GROUP BY tablename
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  Table % has % policies', policy_count.tablename, policy_count.count;
    END LOOP;
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ Migration complete!';
END $$;