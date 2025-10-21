-- Migration: Add Exercise Archive System
-- Description: Creates tables and functions for archiving and auto-deleting exercises

-- ============================================================================
-- 1. Create exercise_archives table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exercise_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL,
    exercise_name TEXT NOT NULL,
    exercise_data JSONB NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    marked_for_deletion_at TIMESTAMPTZ,
    CONSTRAINT exercise_archives_exercise_id_unique UNIQUE (exercise_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_exercise_archives_archived_by ON public.exercise_archives(archived_by);
CREATE INDEX IF NOT EXISTS idx_exercise_archives_archived_at ON public.exercise_archives(archived_at);
CREATE INDEX IF NOT EXISTS idx_exercise_archives_marked_for_deletion ON public.exercise_archives(marked_for_deletion_at) WHERE marked_for_deletion_at IS NOT NULL;

-- Add comment
COMMENT ON TABLE public.exercise_archives IS 'Stores archived exercises before permanent deletion';

-- ============================================================================
-- 2. Create archive_cleanup_logs table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.archive_cleanup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_count INTEGER NOT NULL DEFAULT 0,
    exercise_ids UUID[] NOT NULL DEFAULT '{}',
    execution_details JSONB
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_archive_cleanup_logs_deleted_at ON public.archive_cleanup_logs(deleted_at);

-- Add comment
COMMENT ON TABLE public.archive_cleanup_logs IS 'Logs of automatic cleanup operations for archived exercises';

-- ============================================================================
-- 3. Create function to cleanup old archived exercises
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_archived_exercises(retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
    deleted_count INTEGER,
    exercise_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
    v_exercise_ids UUID[];
    v_cutoff_date TIMESTAMPTZ;
BEGIN
    -- Calculate cutoff date
    v_cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
    
    -- Get IDs of exercises to delete
    SELECT ARRAY_AGG(id) INTO v_exercise_ids
    FROM public.exercise_archives
    WHERE archived_at < v_cutoff_date;
    
    -- Delete old archived exercises
    DELETE FROM public.exercise_archives
    WHERE archived_at < v_cutoff_date;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    IF v_deleted_count > 0 THEN
        INSERT INTO public.archive_cleanup_logs (deleted_count, exercise_ids, execution_details)
        VALUES (
            v_deleted_count,
            v_exercise_ids,
            jsonb_build_object(
                'retention_days', retention_days,
                'cutoff_date', v_cutoff_date,
                'executed_at', NOW()
            )
        );
    END IF;
    
    -- Return results
    RETURN QUERY SELECT v_deleted_count, v_exercise_ids;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.cleanup_old_archived_exercises IS 'Deletes archived exercises older than the specified retention period and logs the operation';

-- ============================================================================
-- 4. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.exercise_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_cleanup_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. Create RLS Policies for exercise_archives
-- ============================================================================

-- Policy: Users can view their own archived exercises
CREATE POLICY "Users can view their own archived exercises"
    ON public.exercise_archives
    FOR SELECT
    USING (auth.uid() = archived_by);

-- Policy: Users can insert their own archived exercises
CREATE POLICY "Users can insert their own archived exercises"
    ON public.exercise_archives
    FOR INSERT
    WITH CHECK (auth.uid() = archived_by);

-- Policy: Users can update their own archived exercises
CREATE POLICY "Users can update their own archived exercises"
    ON public.exercise_archives
    FOR UPDATE
    USING (auth.uid() = archived_by);

-- Policy: Users can delete their own archived exercises
CREATE POLICY "Users can delete their own archived exercises"
    ON public.exercise_archives
    FOR DELETE
    USING (auth.uid() = archived_by);

-- ============================================================================
-- 6. Create RLS Policies for archive_cleanup_logs
-- ============================================================================

-- Policy: Only service role can view cleanup logs
CREATE POLICY "Service role can view cleanup logs"
    ON public.archive_cleanup_logs
    FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');

-- Policy: Only service role can insert cleanup logs
CREATE POLICY "Service role can insert cleanup logs"
    ON public.archive_cleanup_logs
    FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 7. Grant necessary permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_archives TO authenticated;
GRANT USAGE ON SEQUENCE exercise_archives_id_seq TO authenticated;

-- Grant permissions to service role for cleanup logs
GRANT SELECT, INSERT ON public.archive_cleanup_logs TO service_role;
GRANT USAGE ON SEQUENCE archive_cleanup_logs_id_seq TO service_role;

-- Grant execute permission on cleanup function to service role
GRANT EXECUTE ON FUNCTION public.cleanup_old_archived_exercises TO service_role;

