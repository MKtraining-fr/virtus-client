require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableViaAPI() {
  console.log('🚀 Tentative de création de la table bilan_templates via l\'API...\n');

  // Malheureusement, l'API REST de Supabase ne permet pas d'exécuter du DDL directement
  // La seule façon est d'utiliser le SQL Editor ou la connexion PostgreSQL directe
  
  console.log('❌ L\'API REST de Supabase ne permet pas d\'exécuter des commandes DDL');
  console.log('   (CREATE TABLE, ALTER TABLE, etc.)\n');
  
  console.log('📋 Solutions disponibles:\n');
  console.log('   1. ✅ SQL Editor (RECOMMANDÉ - 2 minutes)');
  console.log('      https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql');
  console.log('      → Copier-coller le script SCRIPT_COMPLET_BILAN_TEMPLATES.sql\n');
  
  console.log('   2. ⚠️  PostgreSQL CLI (nécessite psql)');
  console.log('      → Connexion directe à la base de données\n');
  
  console.log('   3. ⚠️  Supabase CLI (nécessite installation)');
  console.log('      → supabase db push\n');
  
  console.log('💡 La méthode la plus simple et rapide est le SQL Editor (option 1)');
  console.log('   Le script est prêt dans: supabase/SCRIPT_COMPLET_BILAN_TEMPLATES.sql\n');
}

createTableViaAPI().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
