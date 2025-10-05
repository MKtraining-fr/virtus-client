-- Supprimer toutes les politiques existantes sur la table clients
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable update for users based on id" ON clients;
DROP POLICY IF EXISTS "Enable delete for admins only" ON clients;

-- Créer des politiques RLS très simples et permissives
-- SELECT : Tous les utilisateurs authentifiés peuvent voir tous les clients
CREATE POLICY "allow_all_select_for_authenticated" ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT : Tous les utilisateurs authentifiés peuvent créer des clients
CREATE POLICY "allow_all_insert_for_authenticated" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE : Tous les utilisateurs authentifiés peuvent mettre à jour tous les clients
CREATE POLICY "allow_all_update_for_authenticated" ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE : Seuls les admins peuvent supprimer
CREATE POLICY "allow_delete_for_admins" ON clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
