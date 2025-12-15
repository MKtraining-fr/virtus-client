-- Migration: Fix bilan assignments constraints
-- Date: 2025-12-15
-- Description: 
--   1. Remove strict unique constraint on (client_id, bilan_template_id)
--   2. Add partial unique index to allow only one active assignment per template
--   3. Add delete_bilan_assignment RPC function
--   4. Fix assign_bilan_atomic to generate UUID explicitly

-- Drop old unique constraint
ALTER TABLE bilan_assignments 
DROP CONSTRAINT IF EXISTS bilan_assignments_client_id_bilan_template_id_key;

-- Create partial unique index for active assignments only
-- This allows multiple assignments of the same template to the same client,
-- but only one can be active (assigned or in_progress) for a given date
-- Multiple assignments with different dates are allowed
CREATE UNIQUE INDEX IF NOT EXISTS bilan_assignments_active_unique 
ON bilan_assignments (client_id, bilan_template_id, scheduled_date) 
WHERE status IN ('assigned', 'in_progress');

-- Fix assign_bilan_atomic to explicitly generate UUID
CREATE OR REPLACE FUNCTION assign_bilan_atomic(
  p_template_id UUID,
  p_client_id UUID,
  p_coach_id UUID,
  p_frequency TEXT DEFAULT 'once',
  p_scheduled_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
  v_template_data JSONB;
  v_template_name TEXT;
  v_coach_name TEXT;
  v_result JSON;
BEGIN
  -- Get template data
  SELECT name, sections INTO v_template_name, v_template_data
  FROM bilan_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Template not found');
  END IF;

  -- Get coach name
  SELECT first_name || ' ' || last_name INTO v_coach_name
  FROM clients
  WHERE id = p_coach_id;

  -- Generate UUID explicitly
  v_assignment_id := gen_random_uuid();

  -- Create assignment
  INSERT INTO bilan_assignments (
    id,
    coach_id,
    client_id,
    bilan_template_id,
    status,
    frequency,
    scheduled_date,
    assigned_at,
    data
  ) VALUES (
    v_assignment_id,
    p_coach_id,
    p_client_id,
    p_template_id,
    'assigned',
    p_frequency,
    p_scheduled_date,
    NOW(),
    jsonb_build_object(
      'template_snapshot', v_template_data,
      'template_name', v_template_name,
      'answers', '{}'::jsonb
    )
  );

  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    read,
    created_at
  ) VALUES (
    p_client_id,
    'Nouveau bilan assigné',
    v_coach_name || ' vous a assigné un nouveau bilan : ' || v_template_name,
    'assignment',
    false,
    NOW()
  );

  v_result := json_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', 'Bilan assigné avec succès'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Erreur lors de l''assignation du bilan'
    );
END;
$$;

-- Create delete_bilan_assignment RPC function
CREATE OR REPLACE FUNCTION delete_bilan_assignment(
  p_assignment_id UUID,
  p_coach_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_record RECORD;
  v_result JSON;
BEGIN
  -- Get assignment details
  SELECT id, coach_id, client_id, status INTO v_assignment_record
  FROM bilan_assignments
  WHERE id = p_assignment_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Assignment not found');
  END IF;

  -- Check authorization
  IF v_assignment_record.coach_id != p_coach_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: You can only delete your own assignments'
    );
  END IF;

  -- Delete assignment
  DELETE FROM bilan_assignments WHERE id = p_assignment_id;

  -- Delete related notifications
  DELETE FROM notifications
  WHERE type = 'assignment'
    AND user_id = v_assignment_record.client_id
    AND message LIKE '%bilan%';

  v_result := json_build_object(
    'success', true,
    'message', 'Assignment deleted successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Error deleting assignment'
    );
END;
$$;
