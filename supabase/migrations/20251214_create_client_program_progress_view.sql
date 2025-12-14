-- Migration: Créer une vue SQL pour unifier la progression des clients
-- Date: 2025-12-14
-- Description: Cette vue calcule la progression à partir de client_sessions
--              pour avoir une source de vérité unique

-- Supprimer la vue si elle existe déjà
DROP VIEW IF EXISTS client_program_progress;

-- Créer la vue client_program_progress
CREATE OR REPLACE VIEW client_program_progress AS
SELECT 
  pa.id AS assignment_id,
  pa.client_id,
  pa.program_template_id,
  pa.coach_id,
  pa.start_date,
  pa.end_date,
  pa.status AS assignment_status,
  pa.created_at AS assignment_created_at,
  pa.updated_at AS assignment_updated_at,
  
  -- Calculer la semaine actuelle (première semaine avec une séance non complétée)
  COALESCE(
    (
      SELECT cs.week_number 
      FROM client_sessions cs
      JOIN client_programs cp ON cp.id = cs.client_program_id
      WHERE cp.assignment_id = pa.id 
        AND cs.status = 'pending'
      ORDER BY cs.week_number, cs.session_order
      LIMIT 1
    ),
    -- Si aucune séance pending, prendre la dernière semaine complétée + 1
    (
      SELECT MAX(cs.week_number) + 1
      FROM client_sessions cs
      JOIN client_programs cp ON cp.id = cs.client_program_id
      WHERE cp.assignment_id = pa.id 
        AND cs.status = 'completed'
    ),
    1 -- Par défaut, semaine 1
  ) AS current_week,
  
  -- Calculer la séance actuelle (première séance non complétée de la semaine actuelle)
  COALESCE(
    (
      SELECT cs.session_order 
      FROM client_sessions cs
      JOIN client_programs cp ON cp.id = cs.client_program_id
      WHERE cp.assignment_id = pa.id 
        AND cs.status = 'pending'
      ORDER BY cs.week_number, cs.session_order
      LIMIT 1
    ),
    1 -- Par défaut, séance 1
  ) AS current_session_order,
  
  -- Nombre total de séances complétées
  (
    SELECT COUNT(*) 
    FROM client_sessions cs
    JOIN client_programs cp ON cp.id = cs.client_program_id
    WHERE cp.assignment_id = pa.id 
      AND cs.status = 'completed'
  ) AS completed_sessions_count,
  
  -- Nombre total de séances
  (
    SELECT COUNT(*) 
    FROM client_sessions cs
    JOIN client_programs cp ON cp.id = cs.client_program_id
    WHERE cp.assignment_id = pa.id
  ) AS total_sessions_count,
  
  -- Date de la dernière séance complétée
  (
    SELECT MAX(cs.completed_at)
    FROM client_sessions cs
    JOIN client_programs cp ON cp.id = cs.client_program_id
    WHERE cp.assignment_id = pa.id 
      AND cs.status = 'completed'
  ) AS last_completed_session_at,
  
  -- Nombre de séances complétées cette semaine
  (
    SELECT COUNT(*) 
    FROM client_sessions cs
    JOIN client_programs cp ON cp.id = cs.client_program_id
    WHERE cp.assignment_id = pa.id 
      AND cs.status = 'completed'
      AND cs.week_number = COALESCE(
        (
          SELECT cs2.week_number 
          FROM client_sessions cs2
          JOIN client_programs cp2 ON cp2.id = cs2.client_program_id
          WHERE cp2.assignment_id = pa.id 
            AND cs2.status = 'pending'
          ORDER BY cs2.week_number, cs2.session_order
          LIMIT 1
        ),
        (
          SELECT MAX(cs2.week_number)
          FROM client_sessions cs2
          JOIN client_programs cp2 ON cp2.id = cs2.client_program_id
          WHERE cp2.assignment_id = pa.id 
            AND cs2.status = 'completed'
        ),
        1
      )
  ) AS completed_sessions_this_week,
  
  -- Nombre total de séances cette semaine
  (
    SELECT COUNT(*) 
    FROM client_sessions cs
    JOIN client_programs cp ON cp.id = cs.client_program_id
    WHERE cp.assignment_id = pa.id 
      AND cs.week_number = COALESCE(
        (
          SELECT cs2.week_number 
          FROM client_sessions cs2
          JOIN client_programs cp2 ON cp2.id = cs2.client_program_id
          WHERE cp2.assignment_id = pa.id 
            AND cs2.status = 'pending'
          ORDER BY cs2.week_number, cs2.session_order
          LIMIT 1
        ),
        (
          SELECT MAX(cs2.week_number)
          FROM client_sessions cs2
          JOIN client_programs cp2 ON cp2.id = cs2.client_program_id
          WHERE cp2.assignment_id = pa.id 
            AND cs2.status = 'completed'
        ),
        1
      )
  ) AS total_sessions_this_week

FROM program_assignments pa;

-- Ajouter un commentaire sur la vue
COMMENT ON VIEW client_program_progress IS 
'Vue calculée qui unifie la progression des clients à partir de client_sessions. 
Cette vue est la source de vérité unique pour la progression.';

-- Créer un index sur client_sessions pour optimiser les requêtes de la vue
CREATE INDEX IF NOT EXISTS idx_client_sessions_assignment_status 
ON client_sessions (client_program_id, status, week_number, session_order);

-- Créer un index sur client_programs pour optimiser les jointures
CREATE INDEX IF NOT EXISTS idx_client_programs_assignment 
ON client_programs (assignment_id);
