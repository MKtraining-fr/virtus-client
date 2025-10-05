-- ============================================================
-- MIGRATION: Ajout de la colonne status à la table clients
-- ============================================================
-- Instructions:
-- 1. Aller sur: https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql
-- 2. Cliquer sur "New query"
-- 3. Copier-coller tout ce fichier
-- 4. Cliquer sur "Run"
-- ============================================================

-- 1. Ajouter la colonne status
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'prospect', 'archived'));

-- 2. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_coach_status ON clients(coach_id, status);

-- 3. Commentaire de documentation
COMMENT ON COLUMN clients.status IS 'Statut du client: active (client actif), prospect (en attente de validation), archived (archivé)';

-- 4. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Vérification
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'status';

-- ============================================================
-- Résultat attendu:
-- column_name | data_type | column_default | is_nullable
-- status      | text      | 'active'       | NO
-- ============================================================
