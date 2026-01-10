-- Migration: Système de Planning et Rendez-vous avec Daily.co
-- Date: 2026-01-10
-- Description: Création des tables pour le système de gestion des rendez-vous avec visioconférence Daily.co

-- =====================================================
-- Table: appointment_types
-- Description: Types de rendez-vous personnalisés par coach
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_duration INTEGER NOT NULL, -- Durée en minutes
  color VARCHAR(7) DEFAULT '#3B82F6', -- Code couleur hex
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT appointment_types_duration_positive CHECK (default_duration > 0)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_appointment_types_coach ON appointment_types(coach_id) WHERE is_active = true;

-- Trigger pour updated_at
CREATE TRIGGER update_appointment_types_updated_at
  BEFORE UPDATE ON appointment_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: appointment_reasons
-- Description: Motifs de rendez-vous personnalisés par coach
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_appointment_reasons_coach ON appointment_reasons(coach_id) WHERE is_active = true;
CREATE INDEX idx_appointment_reasons_order ON appointment_reasons(coach_id, display_order);

-- =====================================================
-- Table: coach_availability
-- Description: Disponibilités hebdomadaires du coach
-- =====================================================
CREATE TABLE IF NOT EXISTS coach_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Dimanche, 1=Lundi, ..., 6=Samedi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT coach_availability_day_valid CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT coach_availability_time_valid CHECK (end_time > start_time)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_coach_availability_coach ON coach_availability(coach_id) WHERE is_active = true;
CREATE INDEX idx_coach_availability_day ON coach_availability(coach_id, day_of_week);

-- =====================================================
-- Table: appointments
-- Description: Rendez-vous entre coach et client/prospect
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL si prospect
  prospect_email VARCHAR(255), -- Si client_id est NULL
  prospect_name VARCHAR(255), -- Si client_id est NULL
  appointment_type_id UUID NOT NULL REFERENCES appointment_types(id) ON DELETE RESTRICT,
  appointment_reason_id UUID REFERENCES appointment_reasons(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  meeting_type VARCHAR(50) NOT NULL, -- video, phone, in_person
  meeting_url TEXT, -- Lien Daily.co room
  daily_room_name VARCHAR(255), -- Nom de la room Daily.co
  cancellation_reason TEXT,
  cancelled_by UUID, -- Peut être coach_id ou client_id
  cancelled_at TIMESTAMPTZ,
  notes TEXT, -- Notes du coach après le rendez-vous
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT appointments_time_valid CHECK (end_time > start_time),
  CONSTRAINT appointments_client_or_prospect CHECK (
    (client_id IS NOT NULL AND prospect_email IS NULL AND prospect_name IS NULL) OR
    (client_id IS NULL AND prospect_email IS NOT NULL AND prospect_name IS NOT NULL)
  ),
  CONSTRAINT appointments_status_valid CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  CONSTRAINT appointments_meeting_type_valid CHECK (meeting_type IN ('video', 'phone', 'in_person'))
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_appointments_coach ON appointments(coach_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_coach_date ON appointments(coach_id, start_time);
CREATE INDEX idx_appointments_client_date ON appointments(client_id, start_time);
CREATE INDEX idx_appointments_daily_room ON appointments(daily_room_name);

-- Trigger pour updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: appointment_notifications
-- Description: Notifications liées aux rendez-vous
-- =====================================================
CREATE TABLE IF NOT EXISTS appointment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Peut être coach_id ou client_id
  user_type VARCHAR(20) NOT NULL, -- 'coach' ou 'client'
  notification_type VARCHAR(50) NOT NULL, -- created, updated, cancelled, reminder_24h, reminder_1h, reminder_15min
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT appointment_notifications_type_valid CHECK (
    notification_type IN ('created', 'updated', 'cancelled', 'reminder_24h', 'reminder_1h', 'reminder_15min')
  ),
  CONSTRAINT appointment_notifications_user_type_valid CHECK (user_type IN ('coach', 'client'))
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_appointment_notifications_user ON appointment_notifications(user_id, is_read);
CREATE INDEX idx_appointment_notifications_appointment ON appointment_notifications(appointment_id);
CREATE INDEX idx_appointment_notifications_sent ON appointment_notifications(sent_at);

-- =====================================================
-- Politiques RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS: appointment_types
-- =====================================================

-- Coach peut voir ses propres types
CREATE POLICY coach_view_own_appointment_types ON appointment_types
  FOR SELECT
  USING (coach_id = auth.uid());

-- Coach peut créer ses propres types
CREATE POLICY coach_create_own_appointment_types ON appointment_types
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Coach peut modifier ses propres types
CREATE POLICY coach_update_own_appointment_types ON appointment_types
  FOR UPDATE
  USING (coach_id = auth.uid());

-- Coach peut supprimer ses propres types
CREATE POLICY coach_delete_own_appointment_types ON appointment_types
  FOR DELETE
  USING (coach_id = auth.uid());

-- Client peut voir les types de son coach
CREATE POLICY client_view_coach_appointment_types ON appointment_types
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.coach_id = appointment_types.coach_id
    )
    AND is_active = true
  );

-- =====================================================
-- RLS: appointment_reasons
-- =====================================================

-- Coach peut voir ses propres motifs
CREATE POLICY coach_view_own_appointment_reasons ON appointment_reasons
  FOR SELECT
  USING (coach_id = auth.uid());

-- Coach peut créer ses propres motifs
CREATE POLICY coach_create_own_appointment_reasons ON appointment_reasons
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Coach peut modifier ses propres motifs
CREATE POLICY coach_update_own_appointment_reasons ON appointment_reasons
  FOR UPDATE
  USING (coach_id = auth.uid());

-- Coach peut supprimer ses propres motifs
CREATE POLICY coach_delete_own_appointment_reasons ON appointment_reasons
  FOR DELETE
  USING (coach_id = auth.uid());

-- Client peut voir les motifs de son coach
CREATE POLICY client_view_coach_appointment_reasons ON appointment_reasons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.coach_id = appointment_reasons.coach_id
    )
    AND is_active = true
  );

-- =====================================================
-- RLS: coach_availability
-- =====================================================

-- Coach peut voir ses propres disponibilités
CREATE POLICY coach_view_own_availability ON coach_availability
  FOR SELECT
  USING (coach_id = auth.uid());

-- Coach peut créer ses propres disponibilités
CREATE POLICY coach_create_own_availability ON coach_availability
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Coach peut modifier ses propres disponibilités
CREATE POLICY coach_update_own_availability ON coach_availability
  FOR UPDATE
  USING (coach_id = auth.uid());

-- Coach peut supprimer ses propres disponibilités
CREATE POLICY coach_delete_own_availability ON coach_availability
  FOR DELETE
  USING (coach_id = auth.uid());

-- Client peut voir les disponibilités de son coach
CREATE POLICY client_view_coach_availability ON coach_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.coach_id = coach_availability.coach_id
    )
    AND is_active = true
  );

-- =====================================================
-- RLS: appointments
-- =====================================================

-- Coach peut voir ses propres rendez-vous
CREATE POLICY coach_view_own_appointments ON appointments
  FOR SELECT
  USING (coach_id = auth.uid());

-- Coach peut créer ses propres rendez-vous
CREATE POLICY coach_create_own_appointments ON appointments
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Coach peut modifier ses propres rendez-vous
CREATE POLICY coach_update_own_appointments ON appointments
  FOR UPDATE
  USING (coach_id = auth.uid());

-- Coach peut supprimer ses propres rendez-vous
CREATE POLICY coach_delete_own_appointments ON appointments
  FOR DELETE
  USING (coach_id = auth.uid());

-- Client peut voir ses rendez-vous avec son coach
CREATE POLICY client_view_own_appointments ON appointments
  FOR SELECT
  USING (client_id = auth.uid());

-- Client peut créer un rendez-vous avec son coach
CREATE POLICY client_create_appointment_with_coach ON appointments
  FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = auth.uid()
      AND clients.coach_id = appointments.coach_id
    )
  );

-- Client peut annuler son propre rendez-vous
CREATE POLICY client_cancel_own_appointment ON appointments
  FOR UPDATE
  USING (
    client_id = auth.uid()
    AND status = 'scheduled'
  )
  WITH CHECK (
    status = 'cancelled'
    AND cancelled_by = auth.uid()
  );

-- =====================================================
-- RLS: appointment_notifications
-- =====================================================

-- Utilisateur peut voir ses propres notifications
CREATE POLICY user_view_own_notifications ON appointment_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Système peut créer des notifications (via service role)
CREATE POLICY system_create_notifications ON appointment_notifications
  FOR INSERT
  WITH CHECK (true);

-- Utilisateur peut marquer ses notifications comme lues
CREATE POLICY user_update_own_notifications ON appointment_notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Données par défaut
-- =====================================================

-- Fonction pour créer les types et motifs par défaut pour un nouveau coach
CREATE OR REPLACE FUNCTION create_default_appointment_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer les types de rendez-vous par défaut
  INSERT INTO appointment_types (coach_id, name, description, default_duration, color)
  VALUES
    (NEW.id, 'Consultation initiale', 'Premier rendez-vous avec le client', 60, '#3B82F6'),
    (NEW.id, 'Suivi hebdomadaire', 'Point hebdomadaire sur les progrès', 30, '#10B981'),
    (NEW.id, 'Bilan mensuel', 'Bilan complet du mois écoulé', 45, '#F59E0B'),
    (NEW.id, 'Séance de coaching', 'Séance de coaching personnalisée', 60, '#8B5CF6');
  
  -- Créer les motifs par défaut
  INSERT INTO appointment_reasons (coach_id, label, display_order)
  VALUES
    (NEW.id, 'Consultation initiale', 1),
    (NEW.id, 'Suivi de progression', 2),
    (NEW.id, 'Ajustement du programme', 3),
    (NEW.id, 'Questions / Problèmes', 4),
    (NEW.id, 'Bilan de période', 5),
    (NEW.id, 'Autre', 6);
  
  -- Créer les disponibilités par défaut (Lundi à Vendredi, 9h-18h)
  INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time)
  VALUES
    (NEW.id, 1, '09:00:00', '12:00:00'), -- Lundi matin
    (NEW.id, 1, '14:00:00', '18:00:00'), -- Lundi après-midi
    (NEW.id, 2, '09:00:00', '12:00:00'), -- Mardi matin
    (NEW.id, 2, '14:00:00', '18:00:00'), -- Mardi après-midi
    (NEW.id, 3, '09:00:00', '12:00:00'), -- Mercredi matin
    (NEW.id, 3, '14:00:00', '18:00:00'), -- Mercredi après-midi
    (NEW.id, 4, '09:00:00', '12:00:00'), -- Jeudi matin
    (NEW.id, 4, '14:00:00', '18:00:00'), -- Jeudi après-midi
    (NEW.id, 5, '09:00:00', '12:00:00'), -- Vendredi matin
    (NEW.id, 5, '14:00:00', '18:00:00'); -- Vendredi après-midi
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer la configuration par défaut lors de l'inscription d'un coach
CREATE TRIGGER create_default_appointment_config_trigger
  AFTER INSERT ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_appointment_config();

-- =====================================================
-- Commentaires sur les tables
-- =====================================================

COMMENT ON TABLE appointment_types IS 'Types de rendez-vous personnalisés par coach (consultation, suivi, bilan, etc.)';
COMMENT ON TABLE appointment_reasons IS 'Motifs de rendez-vous personnalisés par coach';
COMMENT ON TABLE coach_availability IS 'Disponibilités hebdomadaires du coach';
COMMENT ON TABLE appointments IS 'Rendez-vous entre coach et client/prospect avec visioconférence Daily.co';
COMMENT ON TABLE appointment_notifications IS 'Notifications liées aux rendez-vous (création, rappels, annulation)';

COMMENT ON COLUMN appointments.client_id IS 'ID du client (NULL si prospect)';
COMMENT ON COLUMN appointments.prospect_email IS 'Email du prospect (si client_id est NULL)';
COMMENT ON COLUMN appointments.prospect_name IS 'Nom du prospect (si client_id est NULL)';
COMMENT ON COLUMN appointments.meeting_url IS 'Lien de visioconférence Daily.co';
COMMENT ON COLUMN appointments.daily_room_name IS 'Nom de la room Daily.co pour gestion';
