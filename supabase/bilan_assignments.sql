-- Création de la table bilan_assignments
CREATE TABLE public.bilan_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id uuid REFERENCES auth.users(id) NOT NULL,
    client_id uuid REFERENCES auth.users(id) NOT NULL,
    bilan_template_id uuid REFERENCES public.bilan_templates(id) NOT NULL,
    status text DEFAULT 'assigned'::text NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    data jsonb,
    UNIQUE (client_id, bilan_template_id)
);

-- Activation de RLS
ALTER TABLE public.bilan_assignments ENABLE ROW LEVEL SECURITY;

-- Politique pour les coachs : peuvent voir et gérer leurs propres assignations
CREATE POLICY "Coaches can view and manage their assignments"
ON public.bilan_assignments FOR ALL
TO authenticated
USING (coach_id = auth.uid());

-- Politique pour les clients : peuvent voir leurs propres assignations
CREATE POLICY "Clients can view their assignments"
ON public.bilan_assignments FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- Politique pour les clients : peuvent mettre à jour leurs assignations (pour remplir le bilan)
CREATE POLICY "Clients can update their assignments"
ON public.bilan_assignments FOR UPDATE
TO authenticated
USING (client_id = auth.uid());

-- Index pour la recherche rapide
CREATE INDEX ON public.bilan_assignments (coach_id);
CREATE INDEX ON public.bilan_assignments (client_id);
