require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnose() {
  console.log('🔍 Diagnostic complet Supabase\n');
  
  // 1. Vérifier les bilan_templates
  console.log('1️⃣ Vérification des templates de bilans...');
  const { data: templates, error: templatesError } = await supabase
    .from('bilan_templates')
    .select('*');
  
  if (templatesError) {
    console.log('❌ Erreur:', templatesError.message);
  } else {
    console.log(`✅ ${templates.length} template(s) trouvé(s)`);
    templates.forEach(t => {
      console.log(`   - ${t.name} (coach_id: ${t.coach_id || 'NULL (système)'})`);
    });
  }
  
  // 2. Vérifier les clients
  console.log('\n2️⃣ Vérification des clients...');
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*');
  
  if (clientsError) {
    console.log('❌ Erreur:', clientsError.message);
  } else {
    console.log(`✅ ${clients.length} client(s) trouvé(s)`);
    clients.forEach(c => {
      console.log(`   - ${c.first_name} ${c.last_name} (coach_id: ${c.coach_id || 'NULL'}, status: ${c.status || 'N/A'})`);
    });
  }
  
  // 3. Vérifier la colonne status
  console.log('\n3️⃣ Vérification de la colonne status...');
  const { data: statusCheck, error: statusError } = await supabase
    .rpc('exec_sql', { 
      sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status'"
    })
    .catch(() => null);
  
  if (clients && clients.length > 0 && clients[0].status !== undefined) {
    console.log('✅ La colonne status existe');
  } else {
    console.log('⚠️ La colonne status semble absente ou vide');
  }
}

diagnose().catch(console.error);
