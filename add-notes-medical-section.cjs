const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addNotesAndMedicalSection() {
  console.log('🔄 Ajout de la section "Notes et Médical" au template...\n');
  
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

  // Créer la nouvelle section "Notes et Médical"
  const notesAndMedicalSection = {
    id: 'notes_medical',
    title: 'Notes et Médical',
    isRemovable: false,
    fields: [
      {
        id: 'antecedents_medicaux',
        type: 'textarea',
        label: 'Antécédents médicaux',
        placeholder: 'Maladies, opérations, traitements en cours...'
      },
      {
        id: 'notes_coach',
        type: 'textarea',
        label: 'Notes du coach',
        placeholder: 'Observations, remarques particulières...'
      }
    ]
  };

  // Ajouter la nouvelle section après la section "Alimentation"
  const updatedSections = [...currentTemplate.sections, notesAndMedicalSection];

  console.log('\n📝 Nouvelle section ajoutée:');
  console.log(`  Titre: ${notesAndMedicalSection.title}`);
  console.log(`  Nombre de champs: ${notesAndMedicalSection.fields.length}`);
  notesAndMedicalSection.fields.forEach(f => console.log(`    - ${f.label}`));

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

  console.log('\n✅ Section "Notes et Médical" ajoutée avec succès!');
  console.log(`\n📊 Nombre total de sections: ${updatedSections.length}`);
  
  // Vérification
  const { data: verification, error: errorCheck } = await supabase
    .from('bilan_templates')
    .select('sections')
    .eq('name', 'Bilan Initial')
    .single();

  if (!errorCheck && verification) {
    const hasNotesSection = verification.sections.some(s => s.id === 'notes_medical');
    
    if (hasNotesSection) {
      console.log('✅ Vérification: La section "Notes et Médical" est bien présente');
    } else {
      console.log('⚠️  Attention: La section "Notes et Médical" n\'a pas été ajoutée');
    }
  }
}

addNotesAndMedicalSection();
