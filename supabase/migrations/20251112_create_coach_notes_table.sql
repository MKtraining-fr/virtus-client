-- Migration: Create coach_notes table
-- Date: 2025-11-12
-- Description: Create a table to store coach notes for each client

-- Create coach_notes table
CREATE TABLE IF NOT EXISTS coach_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coach_notes_coach_id ON coach_notes(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_client_id ON coach_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_created_at ON coach_notes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Coaches can view their own notes
CREATE POLICY "Coaches can view their own notes"
  ON coach_notes FOR SELECT
  USING (coach_id = auth.uid());

-- RLS Policy: Coaches can insert their own notes
CREATE POLICY "Coaches can insert their own notes"
  ON coach_notes FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- RLS Policy: Coaches can update their own notes
CREATE POLICY "Coaches can update their own notes"
  ON coach_notes FOR UPDATE
  USING (coach_id = auth.uid());

-- RLS Policy: Coaches can delete their own notes
CREATE POLICY "Coaches can delete their own notes"
  ON coach_notes FOR DELETE
  USING (coach_id = auth.uid());

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coach_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coach_notes_updated_at
  BEFORE UPDATE ON coach_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_notes_updated_at();

-- Add comment for documentation
COMMENT ON TABLE coach_notes IS 'Stores notes written by coaches about their clients';
COMMENT ON COLUMN coach_notes.coach_id IS 'ID of the coach who wrote the note';
COMMENT ON COLUMN coach_notes.client_id IS 'ID of the client the note is about';
COMMENT ON COLUMN coach_notes.note IS 'Content of the note';
