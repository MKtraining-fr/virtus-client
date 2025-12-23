-- Migration: Enrichissement de la table food_items pour supporter Ciqual et Open Food Facts
-- Date: 23 décembre 2025
-- Description: Ajoute les colonnes nécessaires pour importer la base Ciqual complète
--              et prépare la table pour l'intégration future d'Open Food Facts

-- ============================================================================
-- PHASE 1: Ajout des nouvelles colonnes
-- ============================================================================

-- Colonnes pour la structure Ciqual
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS ciqual_code VARCHAR(20);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS subsubcategory VARCHAR(255);

-- Colonnes nutritionnelles supplémentaires
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS sugar DECIMAL(10, 2);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS fiber DECIMAL(10, 2);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS salt DECIMAL(10, 4);

-- Colonnes pour Open Food Facts (préparation future)
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS nutri_score VARCHAR(1);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS nova_group INTEGER;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS eco_score VARCHAR(1);
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS allergens TEXT;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS quantity VARCHAR(100);

-- Colonne pour la source des données
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- ============================================================================
-- PHASE 2: Création des index pour optimiser les recherches
-- ============================================================================

-- Index sur le code Ciqual (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_ciqual_code 
ON food_items(ciqual_code) 
WHERE ciqual_code IS NOT NULL;

-- Index sur le code-barres (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_barcode 
ON food_items(barcode) 
WHERE barcode IS NOT NULL;

-- Index sur le nom pour la recherche textuelle
CREATE INDEX IF NOT EXISTS idx_food_items_name_search 
ON food_items USING gin(to_tsvector('french', name));

-- Index sur la catégorie pour le filtrage
CREATE INDEX IF NOT EXISTS idx_food_items_category 
ON food_items(category);

-- ============================================================================
-- PHASE 3: Commentaires sur les colonnes
-- ============================================================================

COMMENT ON COLUMN food_items.ciqual_code IS 'Code unique de l''aliment dans la base Ciqual';
COMMENT ON COLUMN food_items.subcategory IS 'Sous-groupe alimentaire (alim_ssgrp_nom_fr)';
COMMENT ON COLUMN food_items.subsubcategory IS 'Sous-sous-groupe alimentaire (alim_ssssgrp_nom_fr)';
COMMENT ON COLUMN food_items.sugar IS 'Sucres en grammes pour 100g';
COMMENT ON COLUMN food_items.fiber IS 'Fibres alimentaires en grammes pour 100g';
COMMENT ON COLUMN food_items.salt IS 'Sel (chlorure de sodium) en grammes pour 100g';
COMMENT ON COLUMN food_items.barcode IS 'Code-barres EAN-13 ou UPC du produit';
COMMENT ON COLUMN food_items.brand IS 'Marque du produit';
COMMENT ON COLUMN food_items.nutri_score IS 'Nutri-Score (A, B, C, D, E)';
COMMENT ON COLUMN food_items.nova_group IS 'Groupe NOVA (1-4, niveau de transformation)';
COMMENT ON COLUMN food_items.eco_score IS 'Eco-Score (A, B, C, D, E)';
COMMENT ON COLUMN food_items.allergens IS 'Liste des allergènes';
COMMENT ON COLUMN food_items.ingredients IS 'Liste des ingrédients';
COMMENT ON COLUMN food_items.quantity IS 'Quantité/poids du produit (ex: 400g)';
COMMENT ON COLUMN food_items.source IS 'Source des données: ciqual, openfoodfacts, manual';

-- ============================================================================
-- PHASE 4: Mise à jour des politiques RLS (si nécessaire)
-- ============================================================================

-- Les politiques RLS existantes devraient déjà couvrir les nouvelles colonnes
-- car elles s'appliquent à la table entière

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
