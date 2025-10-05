-- Correction des politiques RLS pour éviter la récursion infinie
-- Ce script supprime les politiques problématiques et les recrée correctement

-- Supprimer toutes les politiques existantes sur la table clients
DROP POLICY IF EXISTS "Users can view their own profile" ON clients;
DROP POLICY IF EXISTS "Coaches can view their clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own profile" ON clients;

-- Recréer les politiques sans récursion

-- Politique 1: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
  ON clients FOR SELECT
  USING (auth.uid() = id);

-- Politique 2: Les coaches peuvent voir leurs clients
CREATE POLICY "Coaches can view their clients"
  ON clients FOR SELECT
  USING (coach_id = auth.uid());

-- Politique 3: Les admins peuvent voir tous les clients
-- Cette politique utilise une fonction pour éviter la récursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM clients
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  USING (is_admin());

-- Politique 4: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
  ON clients FOR UPDATE
  USING (auth.uid() = id);

-- Politique 5: Les admins peuvent créer des utilisateurs
CREATE POLICY "Admins can create users"
  ON clients FOR INSERT
  WITH CHECK (is_admin());

-- Supprimer et recréer les politiques pour exercises
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;
DROP POLICY IF EXISTS "Coaches and admins can manage exercises" ON exercises;

CREATE POLICY "Anyone authenticated can view exercises"
  ON exercises FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION is_coach_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM clients
    WHERE id = auth.uid() AND role IN ('admin', 'coach')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Coaches and admins can manage exercises"
  ON exercises FOR ALL
  USING (is_coach_or_admin());

-- Supprimer et recréer les politiques pour nutrition_plans
DROP POLICY IF EXISTS "Users can view their own nutrition plans" ON nutrition_plans;
DROP POLICY IF EXISTS "Coaches can manage their clients' nutrition plans" ON nutrition_plans;

CREATE POLICY "Users can view their own nutrition plans"
  ON nutrition_plans FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can view their clients nutrition plans"
  ON nutrition_plans FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage nutrition plans"
  ON nutrition_plans FOR ALL
  USING (is_coach_or_admin());

-- Supprimer et recréer les politiques pour food_items
DROP POLICY IF EXISTS "Anyone can view food items" ON food_items;
DROP POLICY IF EXISTS "Coaches and admins can manage food items" ON food_items;

CREATE POLICY "Anyone authenticated can view food items"
  ON food_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Coaches and admins can manage food items"
  ON food_items FOR ALL
  USING (is_coach_or_admin());
