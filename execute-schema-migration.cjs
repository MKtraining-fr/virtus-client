const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeMigration() {
  console.log('🔄 Exécution de la migration de la table clients via l\'API Supabase...\n');

  // Créer une fonction SQL temporaire pour exécuter les ALTER TABLE
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_ddl(sql text) 
    RETURNS void 
    LANGUAGE plpgsql 
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  console.log('📝 Création de la fonction temporaire exec_ddl...');
  
  try {
    // Utiliser l'API REST directement pour créer la fonction
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_ddl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: createFunctionSQL })
    });

    // Essayer une approche alternative : utiliser l'API Database directement
    console.log('⚠️  Impossible d\'exécuter du DDL via l\'API REST de Supabase');
    console.log('');
    console.log('📋 Solution alternative : Le script SQL doit être exécuté manuellement');
    console.log('');
    console.log('Le fichier add-client-profile-columns.sql contient toutes les commandes nécessaires.');
    console.log('');
    console.log('Étapes à suivre :');
    console.log('1. Ouvrez https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql/new');
    console.log('2. Copiez le contenu du fichier add-client-profile-columns.sql');
    console.log('3. Collez-le dans l\'éditeur SQL');
    console.log('4. Cliquez sur "Run" pour exécuter');
    console.log('');
    console.log('Ou utilisez la CLI Supabase si vous l\'avez installée :');
    console.log('$ supabase db push');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

executeMigration();
