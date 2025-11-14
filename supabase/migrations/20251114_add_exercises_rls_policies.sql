-- Migration: Add RLS policies for exercises table
-- Date: 2025-11-14
-- Description: Configure Row Level Security for exercises table with proper permissions for admin, coach, and client roles

-- ============================================================================
-- 1. Enable RLS on exercises table (if not already enabled)
-- ============================================================================
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Drop existing policies if they exist
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can view system and own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Clients can view system and their coach exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can insert any exercise" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can insert their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can update any exercise" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can update their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can delete any exercise" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can delete their own exercises" ON public.exercises;

-- ============================================================================
-- 3. Create SELECT policies
-- ============================================================================

-- Admins can view all exercises
CREATE POLICY "Admins can view all exercises"
  ON public.exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Coaches can view system exercises and their own exercises
CREATE POLICY "Coaches can view system and own exercises"
  ON public.exercises
  FOR SELECT
  USING (
    (created_by IS NULL OR created_by = auth.uid())
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'coach'
    )
  );

-- Clients can view system exercises and exercises from their coach
CREATE POLICY "Clients can view system and their coach exercises"
  ON public.exercises
  FOR SELECT
  USING (
    created_by IS NULL 
    OR created_by IN (
      SELECT coach_id FROM clients
      WHERE clients.id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Create INSERT policies
-- ============================================================================

-- Admins can insert any exercise
CREATE POLICY "Admins can insert any exercise"
  ON public.exercises
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Coaches can insert their own exercises
CREATE POLICY "Coaches can insert their own exercises"
  ON public.exercises
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'coach'
    )
  );

-- ============================================================================
-- 5. Create UPDATE policies
-- ============================================================================

-- Admins can update any exercise
CREATE POLICY "Admins can update any exercise"
  ON public.exercises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Coaches can update their own exercises
CREATE POLICY "Coaches can update their own exercises"
  ON public.exercises
  FOR UPDATE
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'coach'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'coach'
    )
  );

-- ============================================================================
-- 6. Create DELETE policies
-- ============================================================================

-- Admins can delete any exercise
CREATE POLICY "Admins can delete any exercise"
  ON public.exercises
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Coaches can delete their own exercises
CREATE POLICY "Coaches can delete their own exercises"
  ON public.exercises
  FOR DELETE
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'coach'
    )
  );

-- ============================================================================
-- 7. Grant necessary permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;

-- ============================================================================
-- 8. Verification
-- ============================================================================
DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if RLS is enabled
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'exercises';
  
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'ERROR: RLS is not enabled on exercises table';
  END IF;
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'exercises';
  
  RAISE NOTICE '=== RLS Migration for exercises completed ===';
  RAISE NOTICE 'RLS enabled: %', rls_enabled;
  RAISE NOTICE 'Number of policies: %', policy_count;
END $$;
