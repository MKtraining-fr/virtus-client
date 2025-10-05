-- Script SQL pour ajouter les colonnes de profil client à la table clients
-- À exécuter dans le SQL Editor de Supabase

-- Ajouter les colonnes d'informations générales
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('Homme', 'Femme', 'Autre'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS energy_expenditure_level TEXT CHECK (energy_expenditure_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'));

-- Ajouter les colonnes pour les objectifs et notes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive'));

-- Ajouter les colonnes JSON pour les données complexes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lifestyle JSONB DEFAULT '{}'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nutrition JSONB DEFAULT '{}'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bilans JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_bilans JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nutrition_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS performance_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_nutrition_plans JSONB DEFAULT '[]'::jsonb;

-- Créer des index pour améliorer les performances des requêtes JSON
CREATE INDEX IF NOT EXISTS idx_clients_bilans ON clients USING GIN (bilans);
CREATE INDEX IF NOT EXISTS idx_clients_medical_info ON clients USING GIN (medical_info);
CREATE INDEX IF NOT EXISTS idx_clients_nutrition ON clients USING GIN (nutrition);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients (coach_id);

-- Ajouter un commentaire pour documenter la structure
COMMENT ON COLUMN clients.lifestyle IS 'Informations sur le mode de vie (profession, etc.) au format JSON';
COMMENT ON COLUMN clients.medical_info IS 'Informations médicales (antécédents, allergies, etc.) au format JSON';
COMMENT ON COLUMN clients.nutrition IS 'Données nutritionnelles (mesures, historique, habitudes, etc.) au format JSON';
COMMENT ON COLUMN clients.bilans IS 'Historique des bilans complétés au format JSON';
COMMENT ON COLUMN clients.assigned_bilans IS 'Bilans assignés en attente au format JSON';

-- Afficher un message de confirmation
SELECT 'Colonnes ajoutées avec succès à la table clients!' AS message;
