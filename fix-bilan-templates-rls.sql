-- Corriger les politiques RLS pour la table bilan_templates
-- Permettre les opérations CRUD sur les templates

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow read bilan_templates" ON bilan_templates;
DROP POLICY IF EXISTS "Allow insert bilan_templates" ON bilan_templates;
DROP POLICY IF EXISTS "Allow update bilan_templates" ON bilan_templates;
DROP POLICY IF EXISTS "Allow delete bilan_templates" ON bilan_templates;

-- Créer des politiques permissives pour les templates
-- Les templates avec coach_id NULL sont des templates publics accessibles par tous

-- Politique de lecture : tout le monde peut lire les templates publics (coach_id NULL)
-- et les coaches peuvent lire leurs propres templates
CREATE POLICY "Allow read bilan_templates"
ON bilan_templates FOR SELECT
USING (
  coach_id IS NULL 
  OR coach_id = auth.uid()::text
);

-- Politique d'insertion : tout le monde peut créer des templates
CREATE POLICY "Allow insert bilan_templates"
ON bilan_templates FOR INSERT
WITH CHECK (true);

-- Politique de mise à jour : tout le monde peut mettre à jour les templates publics (coach_id NULL)
-- et les coaches peuvent mettre à jour leurs propres templates
CREATE POLICY "Allow update bilan_templates"
ON bilan_templates FOR UPDATE
USING (
  coach_id IS NULL 
  OR coach_id = auth.uid()::text
)
WITH CHECK (
  coach_id IS NULL 
  OR coach_id = auth.uid()::text
);

-- Politique de suppression : seuls les propriétaires peuvent supprimer leurs templates
CREATE POLICY "Allow delete bilan_templates"
ON bilan_templates FOR DELETE
USING (
  coach_id = auth.uid()::text
);

-- Vérifier que RLS est activé
ALTER TABLE bilan_templates ENABLE ROW LEVEL SECURITY;

-- Afficher les politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'bilan_templates';
