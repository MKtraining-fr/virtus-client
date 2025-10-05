-- Schema SQL pour Supabase
-- Ce fichier doit être exécuté dans le SQL Editor de Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table clients (utilisateurs)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'coach', 'client')),
  coach_id UUID REFERENCES clients(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table exercises
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  muscle_group TEXT,
  equipment TEXT,
  difficulty TEXT,
  video_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table programs (programmes d'entraînement)
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES clients(id),
  duration_weeks INTEGER,
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table sessions (séances d'entraînement)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week INTEGER,
  exercises JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table nutrition_plans
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  calories_target INTEGER,
  protein_target INTEGER,
  carbs_target INTEGER,
  fat_target INTEGER,
  meals JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table food_items
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  serving_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

-- Policies pour clients
CREATE POLICY "Users can view their own profile"
  ON clients FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Coaches can view their clients"
  ON clients FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM clients WHERE role = 'coach'
    ) AND coach_id = auth.uid()
  );

CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM clients WHERE role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON clients FOR UPDATE
  USING (auth.uid() = id);

-- Policies pour exercises (tous peuvent lire, seuls admins/coaches peuvent modifier)
CREATE POLICY "Anyone can view exercises"
  ON exercises FOR SELECT
  USING (true);

CREATE POLICY "Coaches and admins can manage exercises"
  ON exercises FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM clients WHERE role IN ('admin', 'coach')
    )
  );

-- Policies pour programs
CREATE POLICY "Users can view their own programs"
  ON programs FOR SELECT
  USING (client_id = auth.uid() OR coach_id = auth.uid());

CREATE POLICY "Coaches can manage their clients' programs"
  ON programs FOR ALL
  USING (coach_id = auth.uid());

-- Policies pour sessions
CREATE POLICY "Users can view sessions of their programs"
  ON sessions FOR SELECT
  USING (
    program_id IN (
      SELECT id FROM programs WHERE client_id = auth.uid() OR coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage sessions"
  ON sessions FOR ALL
  USING (
    program_id IN (
      SELECT id FROM programs WHERE coach_id = auth.uid()
    )
  );

-- Policies pour nutrition_plans
CREATE POLICY "Users can view their own nutrition plans"
  ON nutrition_plans FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Coaches can manage their clients' nutrition plans"
  ON nutrition_plans FOR ALL
  USING (
    client_id IN (
      SELECT id FROM clients WHERE coach_id = auth.uid()
    )
  );

-- Policies pour messages
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Policies pour notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Policies pour food_items (tous peuvent lire)
CREATE POLICY "Anyone can view food items"
  ON food_items FOR SELECT
  USING (true);

CREATE POLICY "Coaches and admins can manage food items"
  ON food_items FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM clients WHERE role IN ('admin', 'coach')
    )
  );

-- Indexes pour améliorer les performances
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_coach_id ON clients(coach_id);
CREATE INDEX idx_programs_client_id ON programs(client_id);
CREATE INDEX idx_programs_coach_id ON programs(coach_id);
CREATE INDEX idx_sessions_program_id ON sessions(program_id);
CREATE INDEX idx_nutrition_plans_client_id ON nutrition_plans(client_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_plans_updated_at BEFORE UPDATE ON nutrition_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
