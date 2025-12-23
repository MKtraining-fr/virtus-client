-- Migration: Création de la table coach_profiles pour les fiches de présentation des coachs
-- Date: 2025-12-23
-- Description: Permet aux coachs de créer une fiche de présentation détaillée avec bio, spécialités, etc.

-- ============================================================================
-- 1. Création de la table coach_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS coach_profiles (
  id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  bio TEXT, -- Biographie ou présentation textuelle du coach
  specialties TEXT[], -- Tableau de spécialités (ex: 'Perte de poids', 'Prise de masse', 'Nutrition sportive')
  experience_years INT, -- Années d'expérience professionnelle
  certifications TEXT[], -- Certifications et diplômes
  public_url TEXT UNIQUE, -- URL personnalisée pour un profil public (optionnel, ex: 'jean-dupont')
  instagram_handle TEXT, -- Pseudo Instagram (sans @)
  facebook_profile TEXT, -- URL du profil Facebook
  website_url TEXT, -- Site web personnel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. Commentaires sur les colonnes
-- ============================================================================

COMMENT ON TABLE coach_profiles IS 'Fiches de présentation détaillées des coachs';
COMMENT ON COLUMN coach_profiles.id IS 'Référence à l''ID du coach dans la table clients';
COMMENT ON COLUMN coach_profiles.bio IS 'Biographie ou présentation du coach (texte libre)';
COMMENT ON COLUMN coach_profiles.specialties IS 'Liste des spécialités du coach';
COMMENT ON COLUMN coach_profiles.experience_years IS 'Nombre d''années d''expérience';
COMMENT ON COLUMN coach_profiles.certifications IS 'Liste des certifications et diplômes';
COMMENT ON COLUMN coach_profiles.public_url IS 'URL personnalisée pour le profil public (slug unique)';
COMMENT ON COLUMN coach_profiles.instagram_handle IS 'Pseudo Instagram du coach';
COMMENT ON COLUMN coach_profiles.facebook_profile IS 'URL du profil Facebook';
COMMENT ON COLUMN coach_profiles.website_url IS 'Site web personnel du coach';

-- ============================================================================
-- 3. Activation de la sécurité au niveau des lignes (RLS)
-- ============================================================================

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Création des politiques RLS
-- ============================================================================

-- Les coachs peuvent voir et modifier leur propre profil
CREATE POLICY "Coaches can manage their own profile" 
ON coach_profiles FOR ALL
USING (auth.uid() = id);

-- Tous les utilisateurs authentifiés peuvent lire les profils (pour une future page publique)
CREATE POLICY "Authenticated users can view profiles" 
ON coach_profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 5. Trigger pour mettre à jour automatiquement updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_coach_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coach_profile_updated_at ON coach_profiles;

CREATE TRIGGER trigger_update_coach_profile_updated_at
BEFORE UPDATE ON coach_profiles
FOR EACH ROW
EXECUTE FUNCTION update_coach_profile_updated_at();

-- ============================================================================
-- 6. Index pour améliorer les performances
-- ============================================================================

-- Index sur public_url pour les recherches de profils publics
CREATE INDEX IF NOT EXISTS idx_coach_profiles_public_url 
ON coach_profiles(public_url) 
WHERE public_url IS NOT NULL;

-- ============================================================================
-- 7. Vérifications post-migration
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Migration coach_profiles terminée avec succès ===';
  RAISE NOTICE 'Table coach_profiles créée avec RLS activé';
  RAISE NOTICE 'Politiques RLS créées pour la gestion des profils';
  RAISE NOTICE 'Trigger de mise à jour automatique configuré';
END $$;
