const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function removePoidsSouhaite() {
  console.log('🔄 Suppression du champ "Poids souhaité" du template...\n');
  
  // Récupérer le template actuel
  const { data: currentTemplate, error: fetchError } = await supabase
    .from('bilan_templates')
    .select('sections')
    .eq('name', 'Bilan Initial')
    .single();

  if (fetchError) {
    console.error('❌ Erreur récupération:', fetchError);
    return;
  }

  console.log('✓ Template actuel récupéré');

  // Modifier la section "Objectif" pour retirer "poids_souhaite"
  const updatedSections = currentTemplate.sections.map(section => {
    if (section.id === 'objectif') {
      return {
        ...section,
        fields: section.fields.filter(field => field.id !== 'poids_souhaite')
      };
    }
    return section;
  });

  console.log('\n📝 Modification appliquée:');
  const objectifSection = updatedSections.find(s => s.id === 'objectif');
  console.log(`  Section "Objectif": ${objectifSection.fields.length} champs`);
  objectifSection.fields.forEach(f => console.log(`    - ${f.label}`));

  // Mettre à jour le template
  const { data, error } = await supabase
    .from('bilan_templates')
    .update({ 
      sections: updatedSections,
      updated_at: new Date().toISOString()
    })
    .eq('name', 'Bilan Initial')
    .select();

  if (error) {
    console.error('❌ Erreur mise à jour:', error);
    return;
  }

  console.log('\n✅ Champ "Poids souhaité" supprimé avec succès!');
  
  // Vérification
  const { data: verification, error: errorCheck } = await supabase
    .from('bilan_templates')
    .select('sections')
    .eq('name', 'Bilan Initial')
    .single();

  if (!errorCheck && verification) {
    const objectifSectionVerif = verification.sections.find(s => s.id === 'objectif');
    const hasPoidsSouhaite = objectifSectionVerif?.fields.some(f => f.id === 'poids_souhaite');
    
    if (!hasPoidsSouhaite) {
      console.log('✅ Vérification: Le champ "Poids souhaité" n\'est plus présent');
    } else {
      console.log('⚠️  Attention: Le champ "Poids souhaité" est toujours présent');
    }
  }
}

removePoidsSouhaite();
