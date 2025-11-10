-- Migration: Activation et configuration de Row Level Security (RLS)
-- Date: 2025-11-10
-- Description: Active RLS sur program_assignments et performance_logs, crée les policies de sécurité

-- ============================================================================
-- 1. Activer RLS sur program_assignments
-- ============================================================================

ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Supprimer les anciennes policies si elles existent
-- ============================================================================

DROP POLICY IF EXISTS "Coaches can manage their assignments" ON program_assignments;
DROP POLICY IF EXISTS "Clients can view their assignments" ON program_assignments;
DROP POLICY IF EXISTS "Coaches can view their assignments" ON program_assignments;
DROP POLICY IF EXISTS "Coaches can create assignments" ON program_assignments;
DROP POLICY IF EXISTS "Coaches can update their assignments" ON program_assignments;
DROP POLICY IF EXISTS "Coaches can delete their assignments" ON program_assignments;

-- ============================================================================
-- 3. Créer les policies pour les coachs (program_assignments)
-- ============================================================================

-- Les coachs peuvent voir leurs propres assignements
CREATE POLICY "Coaches can view their assignments" 
  ON program_assignments 
  FOR SELECT 
  USING (coach_id = auth.uid());

-- Les coachs peuvent créer des assignements pour leurs clients
CREATE POLICY "Coaches can create assignments" 
  ON program_assignments 
  FOR INSERT 
  WITH CHECK (
    coach_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = program_assignments.client_id 
      AND clients.coach_id = auth.uid()
    )
  );

-- Les coachs peuvent modifier leurs assignements
CREATE POLICY "Coaches can update their assignments" 
  ON program_assignments 
  FOR UPDATE 
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Les coachs peuvent supprimer leurs assignements
CREATE POLICY "Coaches can delete their assignments" 
  ON program_assignments 
  FOR DELETE 
  USING (coach_id = auth.uid());

-- ============================================================================
-- 4. Créer les policies pour les clients (program_assignments)
-- ============================================================================

-- Les clients peuvent voir leurs propres assignements
CREATE POLICY "Clients can view their assignments" 
  ON program_assignments 
  FOR SELECT 
  USING (client_id = auth.uid());

-- ============================================================================
-- 5. Activer RLS sur performance_logs
-- ============================================================================

ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Clients can view their own performance logs" ON performance_logs;
DROP POLICY IF EXISTS "Clients can create their own performance logs" ON performance_logs;
DROP POLICY IF EXISTS "Clients can update their own performance logs" ON performance_logs;
DROP POLICY IF EXISTS "Coaches can view their clients performance logs" ON performance_logs;

-- ============================================================================
-- 6. Créer les policies pour performance_logs
-- ============================================================================

-- Les clients peuvent voir leurs propres logs
CREATE POLICY "Clients can view their own performance logs" 
  ON performance_logs 
  FOR SELECT 
  USING (client_id = auth.uid());

-- Les clients peuvent créer leurs propres logs
CREATE POLICY "Clients can create their own performance logs" 
  ON performance_logs 
  FOR INSERT 
  WITH CHECK (client_id = auth.uid());

-- Les clients peuvent mettre à jour leurs propres logs
CREATE POLICY "Clients can update their own performance logs" 
  ON performance_logs 
  FOR UPDATE 
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Les coachs peuvent voir les logs de leurs clients
CREATE POLICY "Coaches can view their clients performance logs" 
  ON performance_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = performance_logs.client_id 
      AND clients.coach_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. Vérifier RLS sur les autres tables critiques
-- ============================================================================

-- Activer RLS sur intensification_techniques si pas déjà fait
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'intensification_techniques' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE intensification_techniques ENABLE ROW LEVEL SECURITY;
    
    -- Policy pour les techniques publiques
    CREATE POLICY "Public techniques are viewable by everyone" 
      ON intensification_techniques 
      FOR SELECT 
      USING (is_public = true OR created_by = auth.uid());
    
    RAISE NOTICE 'RLS activé sur intensification_techniques';
  END IF;
END $$;

-- ============================================================================
-- 8. Vérifications post-migration
-- ============================================================================

DO $$
DECLARE
  rls_status_assignments BOOLEAN;
  rls_status_logs BOOLEAN;
  policy_count_assignments INTEGER;
  policy_count_logs INTEGER;
BEGIN
  -- Vérifier que RLS est activé sur program_assignments
  SELECT relrowsecurity INTO rls_status_assignments 
  FROM pg_class 
  WHERE relname = 'program_assignments';
  
  IF NOT rls_status_assignments THEN
    RAISE EXCEPTION 'ERREUR: RLS n''est pas activé sur program_assignments';
  END IF;
  
  -- Vérifier que RLS est activé sur performance_logs
  SELECT relrowsecurity INTO rls_status_logs 
  FROM pg_class 
  WHERE relname = 'performance_logs';
  
  IF NOT rls_status_logs THEN
    RAISE EXCEPTION 'ERREUR: RLS n''est pas activé sur performance_logs';
  END IF;
  
  -- Compter les policies
  SELECT COUNT(*) INTO policy_count_assignments 
  FROM pg_policies 
  WHERE tablename = 'program_assignments';
  
  SELECT COUNT(*) INTO policy_count_logs 
  FROM pg_policies 
  WHERE tablename = 'performance_logs';
  
  RAISE NOTICE '=== Migration RLS terminée avec succès ===';
  RAISE NOTICE 'RLS activé sur program_assignments: %', rls_status_assignments;
  RAISE NOTICE 'Policies program_assignments: %', policy_count_assignments;
  RAISE NOTICE 'RLS activé sur performance_logs: %', rls_status_logs;
  RAISE NOTICE 'Policies performance_logs: %', policy_count_logs;
END $$;
