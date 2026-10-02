-- GATED Database Migrations - Phase 1 (Part 2)
-- Announcement Reads & Policies

-- Create announcement_reads if not exists
CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can read own read receipts" ON announcement_reads;
CREATE POLICY "Users can read own read receipts" ON announcement_reads
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own read receipts" ON announcement_reads;
CREATE POLICY "Users can insert own read receipts" ON announcement_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Managers can view all read receipts for their society" ON announcement_reads;
CREATE POLICY "Managers can view all read receipts for their society" ON announcement_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM announcements a
      WHERE a.id = announcement_reads.announcement_id
      AND a.society_id IN (
        SELECT society_id FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
      )
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_reads(announcement_id);

-- ============================================
-- Fix: Announcement Permissions
-- ============================================

DROP POLICY IF EXISTS "Managers can create announcements" ON announcements;
CREATE POLICY "Managers can create announcements" ON announcements
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('manager', 'admin')
    AND society_id = announcements.society_id
  )
);

DROP POLICY IF EXISTS "Managers can update announcements" ON announcements;
CREATE POLICY "Managers can update announcements" ON announcements
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('manager', 'admin')
    AND society_id = announcements.society_id
  )
);

DROP POLICY IF EXISTS "Managers can delete announcements" ON announcements;
CREATE POLICY "Managers can delete announcements" ON announcements
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('manager', 'admin')
    AND society_id = announcements.society_id
  )
);

DROP POLICY IF EXISTS "Users can view announcements" ON announcements;
CREATE POLICY "Users can view announcements" ON announcements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND society_id = announcements.society_id
  )
);
