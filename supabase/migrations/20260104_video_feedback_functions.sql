-- ============================================================================
-- Migration: Fonctions et triggers pour vidéos et feedbacks
-- Date: 2026-01-04
-- ============================================================================

-- ============================================================================
-- FONCTION: mark_video_as_viewed_by_coach
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_video_as_viewed_by_coach(
  p_video_id UUID,
  p_coach_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE exercise_set_videos
  SET viewed_by_coach = TRUE, viewed_at = NOW()
  WHERE id = p_video_id AND coach_id = p_coach_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION: notify_coach_new_video
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_coach_new_video()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une notification pour le coach
  INSERT INTO notifications (user_id, title, message, type, read)
  SELECT 
    NEW.coach_id,
    'Nouvelle vidéo d''exercice',
    CONCAT(c.first_name, ' ', c.last_name, ' a uploadé une vidéo'),
    'exercise_video',
    FALSE
  FROM clients c
  WHERE c.id = NEW.client_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: trigger_notify_coach_new_video
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_notify_coach_new_video ON exercise_set_videos;
CREATE TRIGGER trigger_notify_coach_new_video
AFTER INSERT ON exercise_set_videos
FOR EACH ROW
EXECUTE FUNCTION notify_coach_new_video();

-- ============================================================================
-- FONCTION: notify_coach_session_feedback
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_coach_session_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une notification pour le coach
  INSERT INTO notifications (user_id, title, message, type, read)
  SELECT 
    c.coach_id,
    'Nouveau feedback de séance',
    CONCAT(c.first_name, ' ', c.last_name, ' a rempli le questionnaire de fin de séance'),
    'session_feedback',
    FALSE
  FROM clients c
  WHERE c.id = NEW.client_id AND c.coach_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: trigger_notify_coach_session_feedback
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_notify_coach_session_feedback ON session_feedback;
CREATE TRIGGER trigger_notify_coach_session_feedback
AFTER INSERT ON session_feedback
FOR EACH ROW
EXECUTE FUNCTION notify_coach_session_feedback();
