const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkClientData() {
  console.log('🔍 Vérification des données clients...\n');

  // Récupérer le dernier client créé
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  if (!clients || clients.length === 0) {
    console.log('⚠️  Aucun client trouvé');
    return;
  }

  const client = clients[0];

  console.log('📋 Dernier client créé:');
  console.log(`   ID: ${client.id}`);
  console.log(`   Nom: ${client.first_name} ${client.last_name}`);
  console.log(`   Email: ${client.email}`);
  console.log(`   Créé le: ${client.created_at}`);
  console.log('');

  console.log('📊 Colonnes remplies:');
  console.log(`   ✓ dob: ${client.dob || 'NULL'}`);
  console.log(`   ✓ age: ${client.age || 'NULL'}`);
  console.log(`   ✓ sex: ${client.sex || 'NULL'}`);
  console.log(`   ✓ height: ${client.height || 'NULL'}`);
  console.log(`   ✓ weight: ${client.weight || 'NULL'}`);
  console.log(`   ✓ address: ${client.address || 'NULL'}`);
  console.log(`   ✓ energy_expenditure_level: ${client.energy_expenditure_level || 'NULL'}`);
  console.log(`   ✓ objective: ${client.objective || 'NULL'}`);
  console.log(`   ✓ notes: ${client.notes || 'NULL'}`);
  console.log(`   ✓ status: ${client.status || 'NULL'}`);
  console.log('');

  console.log('📦 Colonnes JSON:');
  console.log(`   ✓ lifestyle: ${JSON.stringify(client.lifestyle) || 'NULL'}`);
  console.log(`   ✓ medical_info: ${JSON.stringify(client.medical_info) || 'NULL'}`);
  console.log(`   ✓ nutrition: ${client.nutrition ? JSON.stringify(client.nutrition).substring(0, 100) + '...' : 'NULL'}`);
  console.log(`   ✓ bilans: ${client.bilans ? `${JSON.parse(JSON.stringify(client.bilans)).length} bilan(s)` : 'NULL'}`);
  console.log('');

  if (client.bilans && Array.isArray(client.bilans) && client.bilans.length > 0) {
    console.log('📝 Détails du dernier bilan:');
    const bilan = client.bilans[0];
    console.log(`   Template: ${bilan.templateName}`);
    console.log(`   Status: ${bilan.status}`);
    console.log(`   Complété le: ${bilan.completedAt}`);
    console.log(`   Nombre de réponses: ${Object.keys(bilan.answers || {}).length}`);
    console.log('');
    console.log('   Réponses:');
    const answers = bilan.answers || {};
    Object.keys(answers).slice(0, 10).forEach(key => {
      const value = answers[key];
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
      console.log(`     - ${key}: ${displayValue}`);
    });
    if (Object.keys(answers).length > 10) {
      console.log(`     ... et ${Object.keys(answers).length - 10} autres réponses`);
    }
  }
}

checkClientData();
