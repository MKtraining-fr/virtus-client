const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSchemaUpdate() {
  console.log('🔄 Mise à jour du schéma de la table clients...\n');

  const sqlCommands = [
    // Ajouter les colonnes d'informations générales
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS dob DATE",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS age INTEGER",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('Homme', 'Femme', 'Autre'))",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS height NUMERIC",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS weight NUMERIC",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS energy_expenditure_level TEXT CHECK (energy_expenditure_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'))",
    
    // Ajouter les colonnes pour les objectifs et notes
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS objective TEXT",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive'))",
    
    // Ajouter les colonnes JSON pour les données complexes
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS lifestyle JSONB DEFAULT '{}'::jsonb",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_info JSONB DEFAULT '{}'::jsonb",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS nutrition JSONB DEFAULT '{}'::jsonb",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS bilans JSONB DEFAULT '[]'::jsonb",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_bilans JSONB DEFAULT '[]'::jsonb",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS nutrition_logs JSONB DEFAULT '[]'::jsonb",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS performance_logs JSONB DEFAULT '[]'::jsonb",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_nutrition_plans JSONB DEFAULT '[]'::jsonb",
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const sql of sqlCommands) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Essayer avec une requête directe si rpc ne fonctionne pas
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ sql_query: sql })
        });

        if (!response.ok) {
          console.log(`⚠️  ${sql.substring(0, 60)}...`);
          console.log(`   Erreur: ${error?.message || 'Erreur inconnue'}`);
          errorCount++;
        } else {
          console.log(`✅ ${sql.substring(0, 60)}...`);
          successCount++;
        }
      } else {
        console.log(`✅ ${sql.substring(0, 60)}...`);
        successCount++;
      }
    } catch (err) {
      console.log(`⚠️  ${sql.substring(0, 60)}...`);
      console.log(`   Erreur: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Succès: ${successCount}`);
  console.log(`   ⚠️  Erreurs: ${errorCount}`);

  // Créer les index
  console.log('\n🔄 Création des index...\n');

  const indexCommands = [
    "CREATE INDEX IF NOT EXISTS idx_clients_bilans ON clients USING GIN (bilans)",
    "CREATE INDEX IF NOT EXISTS idx_clients_medical_info ON clients USING GIN (medical_info)",
    "CREATE INDEX IF NOT EXISTS idx_clients_nutrition ON clients USING GIN (nutrition)",
    "CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status)",
    "CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients (coach_id)",
  ];

  for (const sql of indexCommands) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.log(`⚠️  ${sql.substring(0, 60)}...`);
      } else {
        console.log(`✅ ${sql.substring(0, 60)}...`);
      }
    } catch (err) {
      console.log(`⚠️  ${sql.substring(0, 60)}...`);
    }
  }

  console.log('\n✅ Mise à jour du schéma terminée!\n');
}

executeSchemaUpdate().catch(console.error);
