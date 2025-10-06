const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listTables() {
  console.log('📊 Liste des tables dans Supabase:\n');
  
  const tables = [
    'clients',
    'exercises',
    'programs',
    'sessions',
    'nutrition_plans',
    'messages',
    'notifications',
    'food_items',
    'bilan_templates',
    'workout_programs',
    'workout_sessions',
    'performance_logs',
    'recipes',
    'food_categories'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: N'existe pas`);
    } else {
      console.log(`✅ ${table}: Existe`);
    }
  }
}

listTables();
