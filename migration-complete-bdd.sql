-- ============================================
-- MIGRATION COMPLÈTE DE LA BASE DE DONNÉES
-- Application Virtus - Coaching Sportif
-- Date: 5 octobre 2025
-- ============================================

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PARTIE 1: MODIFICATIONS DES TABLES EXISTANTES
-- ============================================

-- ============================================
-- 1. TABLE EXERCISES - Ajout colonnes pour types et alternatives
-- ============================================

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('musculation', 'mobilite', 'echauffement'));
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS secondary_muscle_groups TEXT[];
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS alternative_1_id UUID REFERENCES exercises(id) ON DELETE SET NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS alternative_2_id UUID REFERENCES exercises(id) ON DELETE SET NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(type);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public ON exercises(is_public);

-- ============================================
-- 2. TABLE PROGRAMS - Suppression client_id et ajout colonnes
-- ============================================

-- Supprimer les politiques RLS qui dépendent de client_id
DROP POLICY IF EXISTS users_select_own_programs ON programs;
DROP POLICY IF EXISTS users_select_sessions ON sessions;

-- Maintenant on peut supprimer la colonne
ALTER TABLE programs DROP COLUMN IF EXISTS client_id CASCADE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT true;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clients(id) ON DELETE CASCADE;

DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='programs' AND column_name='duration_weeks') THEN
        ALTER TABLE programs RENAME COLUMN duration_weeks TO max_weeks;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_by ON programs(created_by);
CREATE INDEX IF NOT EXISTS idx_programs_is_template ON programs(is_template);

-- ============================================
-- 3. TABLE SESSIONS - Ajout colonnes pour description et ordre
-- ============================================

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS week_number INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_order INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT true;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE sessions ALTER COLUMN program_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_program_id ON sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_sessions_week_number ON sessions(week_number);

-- ============================================
-- 4. TABLE MESSAGES - Ajout support messages vocaux
-- ============================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_voice BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_url TEXT;

-- ============================================
-- 5. TABLE FOOD_ITEMS - Ajout famille alimentaire et personnalisation
-- ============================================

ALTER TABLE food_items ADD COLUMN IF NOT EXISTS food_family TEXT;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS micronutrients JSONB;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_food_items_food_family ON food_items(food_family);
CREATE INDEX IF NOT EXISTS idx_food_items_created_by ON food_items(created_by);
CREATE INDEX IF NOT EXISTS idx_food_items_is_public ON food_items(is_public);

-- ============================================
-- PARTIE 2: CRÉATION DES NOUVELLES TABLES
-- ============================================

-- ============================================
-- 6. TABLE INTENSIFICATION_TECHNIQUES
-- ============================================

CREATE TABLE IF NOT EXISTS intensification_techniques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  adds_sub_series BOOLEAN DEFAULT false,
  sub_series_config JSONB,
  created_by UUID REFERENCES clients(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intensification_techniques_created_by ON intensification_techniques(created_by);
CREATE INDEX IF NOT EXISTS idx_intensification_techniques_is_public ON intensification_techniques(is_public);

-- Insertion des techniques par défaut
INSERT INTO intensification_techniques (name, description, adds_sub_series, is_public, created_by)
VALUES 
  ('Superset', 'Enchaînement de deux exercices sans repos', false, true, NULL),
  ('Drop set', 'Réduction progressive de la charge', true, true, NULL),
  ('Rest-pause', 'Pauses courtes entre mini-séries', true, true, NULL),
  ('Pyramidal', 'Augmentation progressive de la charge', false, true, NULL),
  ('Dégressif', 'Diminution de la charge à chaque série', false, true, NULL),
  ('Pré-fatigue', 'Exercice d''isolation avant exercice composé', false, true, NULL),
  ('Post-fatigue', 'Exercice d''isolation après exercice composé', false, true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. TABLE PROGRAM_ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS program_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  current_week INTEGER DEFAULT 1,
  current_session INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  customizations JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(program_id, client_id, start_date)
);

CREATE INDEX IF NOT EXISTS idx_program_assignments_client_id ON program_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_program_id ON program_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_coach_id ON program_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_status ON program_assignments(status);

-- ============================================
-- 8. TABLE PERFORMANCE_LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  program_assignment_id UUID REFERENCES program_assignments(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  week_number INTEGER,
  session_number INTEGER,
  exercises_performed JSONB NOT NULL,
  session_order_modified JSONB,
  questionnaire_responses JSONB,
  total_duration_minutes INTEGER,
  total_tonnage NUMERIC,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_logs_client_id ON performance_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_program_assignment_id ON performance_logs(program_assignment_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_session_id ON performance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_session_date ON performance_logs(session_date);

-- ============================================
-- 9. TABLE RECIPES
-- ============================================

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  preparation_steps TEXT[],
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  servings INTEGER DEFAULT 1,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  image_url TEXT,
  created_by UUID REFERENCES clients(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public);

-- ============================================
-- 10. TABLE NUTRITION_PLAN_ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS nutrition_plan_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutrition_plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  customizations JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nutrition_plan_id, client_id, start_date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_plan_assignments_client_id ON nutrition_plan_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_assignments_nutrition_plan_id ON nutrition_plan_assignments(nutrition_plan_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_assignments_coach_id ON nutrition_plan_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_assignments_status ON nutrition_plan_assignments(status);

-- ============================================
-- 11. TABLE NUTRITION_LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nutrition_plan_assignment_id UUID REFERENCES nutrition_plan_assignments(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  meals JSONB NOT NULL,
  total_calories NUMERIC,
  total_protein NUMERIC,
  total_carbs NUMERIC,
  total_fat NUMERIC,
  adherence_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_client_id ON nutrition_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_nutrition_plan_assignment_id ON nutrition_logs(nutrition_plan_assignment_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_log_date ON nutrition_logs(log_date);

-- ============================================
-- PARTIE 3: INSERTION DES FAMILLES ALIMENTAIRES PAR DÉFAUT
-- ============================================

-- Insertion des familles alimentaires avec valeurs nutritionnelles moyennes
-- Ces données serviront de référence pour les aliments de chaque famille

-- Note: On insère ces données comme commentaire de documentation
-- Les valeurs réelles seront dans les food_items individuels

COMMENT ON COLUMN food_items.food_family IS 
'Familles alimentaires avec valeurs nutritionnelles moyennes pour 100g:
- Poissons: 19.5g protéines, 0g glucides, 5g lipides, 145 kcal
- Fruits frais: 0.8g protéines, 12g glucides, 0.3g lipides, 52 kcal
- Légumes frais: 1.2g protéines, 4g glucides, 0.2g lipides, 25 kcal
- Fruits secs: 3g protéines, 64g glucides, 0.6g lipides, 273 kcal
- Féculents cuits (pâtes, riz): 3g protéines, 25g glucides, 0.5g lipides, 130 kcal
- Légumineuses cuites: 8g protéines, 20g glucides, 0.5g lipides, 125 kcal
- Céréales petit-déj.: 8g protéines, 75g glucides, 3g lipides, 370 kcal
- Tubercules (pomme de terre): 2g protéines, 17g glucides, 0.1g lipides, 80 kcal
- Viande maigre: 21g protéines, 0g glucides, 5g lipides, 145 kcal
- Œufs: 12.5g protéines, 1g glucides, 10.5g lipides, 145 kcal
- Produits de la mer (crustacés): 18g protéines, 0.5g glucides, 1.5g lipides, 90 kcal
- Produits laitiers (lait demi-écrémé): 3.3g protéines, 5g glucides, 1.5g lipides, 46 kcal
- Fromages (moyenne): 20g protéines, 1.5g glucides, 28g lipides, 350 kcal
- Matières grasses (végétales/animales): 0g protéines, 0g glucides, 100g lipides, 900 kcal
- Fruits oléagineux / graines: 15g protéines, 15g glucides, 55g lipides, 610 kcal
- Produits sucrés: 2g protéines, 70g glucides, 10g lipides, 380 kcal
- Produits sucrés et gras (viennoiseries): 6g protéines, 45g glucides, 20g lipides, 430 kcal';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

SELECT 'Migration complète terminée avec succès!' AS message;
