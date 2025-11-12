-- Migration: Add medical fields to clients table
-- Date: 2025-11-12
-- Description: Add medical_history and allergies columns to clients table

-- Add medical_history column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS medical_history TEXT;

-- Add allergies column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS allergies TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clients.medical_history IS 'Antécédents médicaux du client (RAS, etc.)';
COMMENT ON COLUMN clients.allergies IS 'Allergies du client (Aucune connue, etc.)';
