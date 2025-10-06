const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCurrentTemplate() {
  console.log('🔍 Récupération du template actuel...\n');
  
  const { data, error } = await supabase
    .from('bilan_templates')
    .select('*')
    .eq('name', 'Bilan Initial')
    .single();

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log('✅ Template trouvé!\n');
  console.log('ID:', data.id);
  console.log('Nom:', data.name);
  console.log('Coach ID:', data.coach_id);
  console.log('\n📋 Structure actuelle:\n');
  console.log(JSON.stringify(data.structure, null, 2));
  
  // Sauvegarder dans un fichier
  const fs = require('fs');
  fs.writeFileSync(
    '/home/ubuntu/virtus/current-template.json',
    JSON.stringify(data, null, 2)
  );
  console.log('\n💾 Template sauvegardé dans current-template.json');
}

getCurrentTemplate();
