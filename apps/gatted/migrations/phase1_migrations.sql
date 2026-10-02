-- GATED Database Migrations - Phase 1
-- Run these migrations in order on Supabase SQL Editor
-- Date: January 12, 2026

-- ============================================
-- MIGRATION 1: Push Tokens Table
-- ============================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(user_id) WHERE is_active = true;

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tokens" ON push_tokens;
CREATE POLICY "Users can manage own tokens" ON push_tokens
  FOR ALL USING (user_id = auth.uid());

-- Updated at trigger
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION 3: Notification Improvements
-- ============================================

-- Add missing columns
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add society_id if not exists (some schemas may already have it)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'society_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN society_id UUID REFERENCES societies(id);
  END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_expires 
  ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- MIGRATION 4: Visitor Enhancements
-- ============================================

-- Add missing columns for enhanced functionality
ALTER TABLE visitors 
  ADD COLUMN IF NOT EXISTS check_in_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS visitor_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Cleanup function for expired visitors (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_visitors()
RETURNS void AS $$
BEGIN
  UPDATE visitors 
  SET status = 'expired'
  WHERE status IN ('pending', 'approved')
    AND expected_date < CURRENT_DATE - INTERVAL '1 day'
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION 5: Performance Indexes
-- ============================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitors_society_date 
  ON visitors(society_id, expected_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_society_status 
  ON issues(society_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcels_society_status 
  ON parcels(society_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_announcements_society_active 
  ON announcements(society_id, expires_at);

-- ============================================
-- VERIFICATION: Run after all migrations
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'visitors' ORDER BY ordinal_position;

-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'notifications' ORDER BY ordinal_position;

-- SELECT indexname FROM pg_indexes WHERE tablename = 'visitors';
