require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Diagnostic des Templates de Bilans\n');
  console.log('='.repeat(60));

  // 1. Vérifier si la table existe
  console.log('\n📋 1. Vérification de la table bilan_templates...');
  try {
    const { data: tables, error: tableError } = await supabase
      .from('bilan_templates')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ La table bilan_templates n\'existe pas !');
      console.error('   Erreur:', tableError.message);
      console.log('\n💡 Solution: Exécutez le script SQL create_bilan_templates_table.sql dans Supabase');
      return;
    }
    
    console.log('✅ La table bilan_templates existe');
  } catch (err) {
    console.error('❌ Erreur lors de la vérification:', err.message);
    return;
  }

  // 2. Compter les templates
  console.log('\n📊 2. Nombre de templates dans la base...');
  const { data: allTemplates, error: countError, count } = await supabase
    .from('bilan_templates')
    .select('*', { count: 'exact' });

  if (countError) {
    console.error('❌ Erreur:', countError.message);
    return;
  }

  console.log(`   Total: ${allTemplates?.length || 0} template(s)`);

  if (!allTemplates || allTemplates.length === 0) {
    console.log('⚠️  Aucun template trouvé !');
    console.log('\n💡 Solution: Exécutez le script SQL insert_initial_bilan_template.sql dans Supabase');
    return;
  }

  // 3. Afficher les templates
  console.log('\n📝 3. Templates disponibles:');
  allTemplates.forEach((template, index) => {
    console.log(`\n   ${index + 1}. ${template.name}`);
    console.log(`      - ID: ${template.id}`);
    console.log(`      - Coach ID: ${template.coach_id || 'NULL (système)'}`);
    console.log(`      - Sections: ${template.sections ? Object.keys(template.sections).length : 0}`);
    console.log(`      - Créé le: ${new Date(template.created_at).toLocaleString('fr-FR')}`);
  });

  // 4. Vérifier le template système
  console.log('\n🔍 4. Vérification du template système "Bilan Initial"...');
  const systemTemplate = allTemplates.find(t => 
    t.name === 'Bilan Initial' && t.coach_id === null
  );

  if (systemTemplate) {
    console.log('✅ Le template "Bilan Initial" système existe');
    console.log(`   - ID: ${systemTemplate.id}`);
    console.log(`   - Sections: ${JSON.stringify(Object.keys(systemTemplate.sections || {}), null, 2)}`);
  } else {
    console.log('❌ Le template "Bilan Initial" système est manquant !');
    console.log('\n💡 Solution: Exécutez le script SQL insert_initial_bilan_template.sql dans Supabase');
  }

  // 5. Tester le mapper
  console.log('\n🔄 5. Test du mapper TypeScript...');
  console.log('   Le mapper devrait convertir:');
  console.log('   - coach_id: null → coachId: "system"');
  console.log('   - coach_id: <uuid> → coachId: <uuid>');

  // 6. Vérifier les politiques RLS
  console.log('\n🔒 6. Note sur les politiques RLS:');
  console.log('   Les templates système (coach_id = NULL) doivent être visibles par tous');
  console.log('   Les templates personnalisés ne sont visibles que par leur créateur');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic terminé\n');
}

diagnose().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
