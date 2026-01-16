import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyIntensityTechniques() {
  console.log('🔍 Vérification du système de techniques d\'intensification...\n');

  // 1. Vérifier le nombre total de techniques système
  const { data: systemTechniques, error: systemError } = await supabase
    .from('intensification_techniques')
    .select('*')
    .eq('is_system', true);

  if (systemError) {
    console.error('❌ Erreur lors de la récupération des techniques système:', systemError);
    return;
  }

  console.log(`✅ Techniques système trouvées: ${systemTechniques.length}`);

  // 2. Vérifier les techniques adaptatives
  const adaptiveTechniques = systemTechniques.filter(t => t.adaptation_type === 'extra_fields');
  console.log(`✅ Techniques adaptatives: ${adaptiveTechniques.length}`);
  console.log('   Techniques adaptatives:');
  adaptiveTechniques.forEach(t => {
    const hasSchema = t.config_schema && Object.keys(t.config_schema).length > 0;
    console.log(`   - ${t.name} ${hasSchema ? '✅' : '❌ (pas de schema)'}`);
  });

  // 3. Vérifier les catégories
  const categories = [...new Set(systemTechniques.map(t => t.category))];
  console.log(`\n✅ Catégories trouvées: ${categories.length}`);
  categories.forEach(cat => {
    const count = systemTechniques.filter(t => t.category === cat).length;
    console.log(`   - ${cat}: ${count} techniques`);
  });

  // 4. Vérifier les techniques informatives
  const informativeTechniques = systemTechniques.filter(t => t.adaptation_type === 'informative');
  console.log(`\n✅ Techniques informatives: ${informativeTechniques.length}`);

  // 5. Vérifier que toutes les techniques ont description et protocole
  const missingDescription = systemTechniques.filter(t => !t.description);
  const missingProtocol = systemTechniques.filter(t => !t.protocol);
  
  if (missingDescription.length > 0) {
    console.log(`\n⚠️  Techniques sans description: ${missingDescription.length}`);
    missingDescription.forEach(t => console.log(`   - ${t.name}`));
  } else {
    console.log('\n✅ Toutes les techniques ont une description');
  }

  if (missingProtocol.length > 0) {
    console.log(`\n⚠️  Techniques sans protocole: ${missingProtocol.length}`);
    missingProtocol.forEach(t => console.log(`   - ${t.name}`));
  } else {
    console.log('✅ Toutes les techniques ont un protocole');
  }

  // 6. Vérifier la structure de session_exercises
  const { data: sampleExercise, error: exerciseError } = await supabase
    .from('session_exercises')
    .select('id, intensity_technique_id, intensity_config, intensity_applies_to')
    .limit(1)
    .single();

  if (exerciseError && exerciseError.code !== 'PGRST116') {
    console.log('\n⚠️  Erreur lors de la vérification de session_exercises:', exerciseError);
  } else {
    console.log('\n✅ Colonnes intensity_* présentes dans session_exercises');
  }

  console.log('\n✅ Vérification terminée !');
}

verifyIntensityTechniques().catch(console.error);
