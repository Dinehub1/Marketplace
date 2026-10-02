-- Migration: Secure Parcels RLS Policies
-- Purpose: Replace permissive RLS policies with secure, role-based policies
-- Date: 2026-01-13

-- ====================================
-- STEP 1: Drop Existing Policies
-- ====================================

-- Drop old policies (from previous migrations)
DROP POLICY IF EXISTS "Allow guards insert parcels" ON parcels;
DROP POLICY IF EXISTS "Allow guards update parcels" ON parcels;
DROP POLICY IF EXISTS "Staff view/manage parcels" ON parcels;
DROP POLICY IF EXISTS "Residents view own parcels" ON parcels;

-- Drop new policies (in case this migration ran partially)
DROP POLICY IF EXISTS "guards_insert_parcels" ON parcels;
DROP POLICY IF EXISTS "guards_update_parcels" ON parcels;
DROP POLICY IF EXISTS "guards_select_parcels" ON parcels;
DROP POLICY IF EXISTS "residents_select_parcels" ON parcels;
DROP POLICY IF EXISTS "residents_view_own_parcels" ON parcels;
DROP POLICY IF EXISTS "staff_view_society_parcels" ON parcels;

-- ====================================
-- STEP 2: Add Database Constraints
-- ====================================

-- Add CHECK constraint for valid status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parcels_status_check'
    ) THEN
        ALTER TABLE parcels 
        ADD CONSTRAINT parcels_status_check 
        CHECK (status IN ('received', 'notified', 'collected'));
    END IF;
END $$;

-- Ensure collected_at and collected_by are set when status is 'collected'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parcels_collected_check'
    ) THEN
        ALTER TABLE parcels
        ADD CONSTRAINT parcels_collected_check
        CHECK (
            (status = 'collected' AND collected_at IS NOT NULL AND collected_by IS NOT NULL)
            OR
            (status != 'collected')
        );
    END IF;
END $$;

-- ====================================
-- STEP 3: Create Secure RLS Policies
-- ====================================

-- Policy 1: Guards can INSERT parcels in their society
CREATE POLICY "guards_insert_parcels" ON parcels
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.society_id = parcels.society_id
        AND user_roles.role IN ('guard', 'manager', 'admin')
        AND user_roles.is_active = true
    )
    AND status = 'received'
);

-- Policy 2: Guards can SELECT parcels in their society
CREATE POLICY "guards_select_parcels" ON parcels
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.society_id = parcels.society_id
        AND user_roles.role IN ('guard', 'manager', 'admin')
        AND user_roles.is_active = true
    )
);

-- Policy 3: Guards can UPDATE parcels in their society
CREATE POLICY "guards_update_parcels" ON parcels
FOR UPDATE
TO authenticated
USING (
    -- Can only update parcels in their society
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.society_id = parcels.society_id
        AND user_roles.role IN ('guard', 'manager', 'admin')
        AND user_roles.is_active = true
    )
    AND status IN ('received', 'notified')  -- Can update received or notified parcels
)
WITH CHECK (
    -- Ensure valid transitions: received → notified or received/notified → collected
    status IN ('notified', 'collected')
    AND (
        -- If transitioning to collected, timestamps must be set
        (status = 'collected' AND collected_at IS NOT NULL AND collected_by IS NOT NULL)
        OR
        -- If transitioning to notified, no additional requirements
        (status = 'notified')
    )
);

-- Policy 4: Residents can SELECT parcels for their unit
CREATE POLICY "residents_select_parcels" ON parcels
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.unit_id = parcels.unit_id
        AND user_roles.role = 'resident'
        AND user_roles.is_active = true
    )
);

-- ====================================
-- VERIFICATION
-- ====================================

-- Enable RLS if not already enabled
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Verify policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'parcels';
    
    RAISE NOTICE 'Total RLS policies on parcels table: %', policy_count;
    
    IF policy_count != 4 THEN
        RAISE WARNING 'Expected 4 policies, found %', policy_count;
    END IF;
END $$;
