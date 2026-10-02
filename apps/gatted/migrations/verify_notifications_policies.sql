-- Quick verification query to check if RLS policies exist
-- Copy and paste this in Supabase SQL Editor to verify the migration worked

SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'notifications'
ORDER BY policyname;

-- Expected output: Should show 4 policies:
-- 1. system_insert_notifications (INSERT)
-- 2. users_delete_own_notifications (DELETE)
-- 3. users_select_own_notifications (SELECT)
-- 4. users_update_own_notifications (UPDATE)

-- If you see ZERO rows, the migration didn't run successfully
-- If you see 4 rows, the policies exist but there might be another issue
