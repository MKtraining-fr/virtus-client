-- Ajout de colonnes pour la sauvegarde des programmes créés par les clients
ALTER TABLE public.client_programs
  ADD COLUMN IF NOT EXISTS session_count integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS total_exercises integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS protocol text,
  ADD COLUMN IF NOT EXISTS difficulty_level text,
  ADD COLUMN IF NOT EXISTS sessions_by_week jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Permettre aux programmes créés par les clients de ne pas avoir de coach associé
ALTER TABLE public.client_programs
  ALTER COLUMN coach_id DROP NOT NULL;

-- Politiques RLS pour autoriser les clients à gérer leurs programmes sauvegardés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'client_programs'
      AND policyname = 'Clients can insert their own created programs.'
  ) THEN
    CREATE POLICY "Clients can insert their own created programs." ON public.client_programs
      FOR INSERT
      WITH CHECK (client_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'client_programs'
      AND policyname = 'Clients can update their own created programs.'
  ) THEN
    CREATE POLICY "Clients can update their own created programs." ON public.client_programs
      FOR UPDATE
      USING (client_id = auth.uid())
      WITH CHECK (client_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'client_programs'
      AND policyname = 'Clients can delete their own created programs.'
  ) THEN
    CREATE POLICY "Clients can delete their own created programs." ON public.client_programs
      FOR DELETE
      USING (client_id = auth.uid());
  END IF;
END
$$;
