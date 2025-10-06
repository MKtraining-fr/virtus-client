const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyTables() {
  console.log('🔍 Vérification des tables créées/modifiées:\n');
  
  const newTables = [
    'intensification_techniques',
    'program_assignments',
    'performance_logs',
    'recipes',
    'nutrition_plan_assignments',
    'nutrition_logs'
  ];
  
  for (const table of newTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: OK`);
    }
  }
  
  // Vérifier les techniques d'intensification par défaut
  console.log('\n📋 Vérification des techniques d\'intensification:');
  const { data: techniques, error } = await supabase
    .from('intensification_techniques')
    .select('*')
    .is('created_by', null);
    
  if (techniques) {
    console.log(`✅ ${techniques.length} techniques par défaut insérées:`);
    techniques.forEach(t => console.log(`   - ${t.name}`));
  }
}

verifyTables();
