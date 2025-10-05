-- Ajouter la colonne status à la table clients
-- Ce script doit être exécuté dans le SQL Editor de Supabase

-- 1. Ajouter la colonne status avec une valeur par défaut
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'prospect', 'archived'));

-- 2. Créer un index pour améliorer les performances des requêtes filtrant par status
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- 3. Créer un index composite pour les requêtes coach + status
CREATE INDEX IF NOT EXISTS idx_clients_coach_status ON clients(coach_id, status);

-- 4. Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN clients.status IS 'Statut du client: active (client actif), prospect (en attente de validation), archived (archivé)';

-- 5. Mettre à jour la fonction updated_at si elle existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vérification
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'status';
