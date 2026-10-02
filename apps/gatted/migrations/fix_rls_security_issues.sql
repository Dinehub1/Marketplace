-- Migration: Fix RLS Security Issues
-- Description: Enable RLS on unprotected tables and clean up duplicate/permissive policies
-- Created: 2026-01-13

-- ============================================================================
-- PART 1: Enable RLS on unprotected tables
-- ============================================================================

-- Enable RLS on guard_shifts (has policies but RLS disabled)
ALTER TABLE public.guard_shifts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on issue_updates (has policies but RLS disabled)
ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on unit_residents (has policies but RLS disabled)
ALTER TABLE public.unit_residents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Clean up parcels table policies
-- ============================================================================

-- Drop all existing parcels policies (we have 10 duplicates/conflicting ones)
DROP POLICY IF EXISTS "Staff view/manage parcels" ON public.parcels;
DROP POLICY IF EXISTS "Guards can create parcels" ON public.parcels;
DROP POLICY IF EXISTS "Allow guards insert parcels" ON public.parcels;
DROP POLICY IF EXISTS "Guards can insert parcels" ON public.parcels;
DROP POLICY IF EXISTS "Residents view own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Allow authenticated select parcels" ON public.parcels;
DROP POLICY IF EXISTS "Guards can view all parcels in their society" ON public.parcels;
DROP POLICY IF EXISTS "Guards can view society parcels" ON public.parcels;
DROP POLICY IF EXISTS "Residents can view own parcels" ON public.parcels;
DROP POLICY IF EXISTS "Residents can view their own unit parcels" ON public.parcels;
DROP POLICY IF EXISTS "Allow guards update parcels" ON public.parcels;
DROP POLICY IF EXISTS "Guards can update parcels" ON public.parcels;

-- Create clean, properly scoped policies for parcels

-- 1. Guards/Managers can view all parcels in their society
CREATE POLICY "staff_view_society_parcels" ON public.parcels
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
              AND user_roles.society_id = parcels.society_id
              AND user_roles.role IN ('guard', 'manager', 'admin')
              AND user_roles.is_active = true
        )
    );

-- 2. Residents can view their own unit's parcels
CREATE POLICY "residents_view_own_parcels" ON public.parcels
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
              AND user_roles.unit_id = parcels.unit_id
              AND user_roles.is_active = true
        )
    );

-- 3. Guards can insert parcels (when receiving deliveries)
CREATE POLICY "guards_insert_parcels" ON public.parcels
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
              AND user_roles.society_id = parcels.society_id
              AND user_roles.role IN ('guard', 'manager', 'admin')
              AND user_roles.is_active = true
        )
    );

-- 4. Guards can update parcels status (mark as collected)
CREATE POLICY "guards_update_parcels" ON public.parcels
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
              AND user_roles.society_id = parcels.society_id
              AND user_roles.role IN ('guard', 'manager', 'admin')
              AND user_roles.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
              AND user_roles.society_id = parcels.society_id
              AND user_roles.role IN ('guard', 'manager', 'admin')
              AND user_roles.is_active = true
        )
    );

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('guard_shifts', 'issue_updates', 'unit_residents', 'parcels');

-- Verify parcels policies
-- SELECT policyname FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'parcels';
