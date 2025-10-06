const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

// Utiliser la clé service_role pour bypasser les politiques RLS
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updateTemplateWithServiceRole() {
  console.log('🔄 Mise à jour du template avec service_role...\n');
  
  const newSections = [
    {
      "id": "informations_generales",
      "title": "Informations Générales",
      "isCivility": true,
      "isRemovable": false,
      "fields": [
        { "id": "prenom", "type": "text", "label": "Prénom", "placeholder": "" },
        { "id": "nom", "type": "text", "label": "Nom", "placeholder": "" },
        { "id": "date_naissance", "type": "date", "label": "Date de naissance", "placeholder": "" },
        { "id": "sexe", "type": "select", "label": "Sexe", "options": ["Homme", "Femme", "Autre"] },
        { "id": "taille", "type": "number", "label": "Taille (cm)", "placeholder": "" },
        { "id": "poids", "type": "number", "label": "Poids actuel (kg)", "placeholder": "" },
        { "id": "email", "type": "text", "label": "Email", "placeholder": "" },
        { "id": "telephone", "type": "text", "label": "Téléphone", "placeholder": "" },
        {
          "id": "activite_physique",
          "type": "select",
          "label": "Niveau d'activité physique",
          "options": ["Sédentaire", "Légèrement actif", "Modérément actif", "Très actif", "Extrêmement actif"]
        }
      ]
    },
    {
      "id": "objectif",
      "title": "Objectif",
      "isRemovable": false,
      "fields": [
        { "id": "objectif_principal", "type": "textarea", "label": "Quel est votre objectif principal?", "placeholder": "" },
        { "id": "poids_souhaite", "type": "number", "label": "Poids souhaité (kg)", "placeholder": "" },
        { "id": "delai", "type": "text", "label": "Délai souhaité", "placeholder": "" }
      ]
    },
    {
      "id": "vie_quotidienne",
      "title": "Vie Quotidienne",
      "isRemovable": false,
      "fields": [
        { "id": "profession", "type": "text", "label": "Profession", "placeholder": "" }
      ]
    },
    {
      "id": "alimentation",
      "title": "Alimentation",
      "isRemovable": false,
      "fields": [
        {
          "id": "allergies",
          "type": "checkbox",
          "label": "Allergies alimentaires",
          "options": [
            "Céréales contenant du gluten (blé, seigle, orge, avoine)",
            "Crustacés",
            "Œufs",
            "Poisson",
            "Arachides (cacahuètes)",
            "Soja",
            "Lait et produits laitiers",
            "Fruits à coque (amandes, noisettes, noix, cajou, etc.)",
            "Céleri",
            "Moutarde",
            "Graines de sésame",
            "Sulfites",
            "Lupin",
            "Mollusques",
            "Autre"
          ],
          "hasOther": true,
          "otherFieldId": "allergies_autre"
        },
        {
          "id": "allergies_autre",
          "type": "text",
          "label": "Précisez autre allergie",
          "placeholder": "Indiquez les autres allergies...",
          "conditionalOn": "allergies",
          "conditionalValue": "Autre"
        },
        { "id": "aversions", "type": "textarea", "label": "Aliments que vous n'aimez pas", "placeholder": "" },
        { "id": "habitudes", "type": "textarea", "label": "Habitudes alimentaires actuelles", "placeholder": "" }
      ]
    }
  ];

  console.log('📝 Nouvelle structure préparée avec:');
  console.log('  - 4 sections');
  console.log('  - Champ "activité physique" dans "Informations Générales"');
  console.log('  - Champ "allergies" de type checkbox avec 15 options\n');

  // Mise à jour avec service_role
  const { data, error } = await supabase
    .from('bilan_templates')
    .update({ 
      sections: newSections,
      updated_at: new Date().toISOString()
    })
    .eq('name', 'Bilan Initial')
    .select();

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log('✅ Mise à jour effectuée avec succès!\n');
  
  // Vérification
  console.log('🔍 Vérification de la mise à jour...');
  const { data: verification, error: errorCheck } = await supabase
    .from('bilan_templates')
    .select('sections')
    .eq('name', 'Bilan Initial')
    .single();

  if (errorCheck) {
    console.error('❌ Erreur vérification:', errorCheck);
    return;
  }

  if (verification && verification.sections) {
    console.log('\n📋 Résultat de la vérification:');
    
    // Vérifier section Informations Générales
    const infoSection = verification.sections.find(s => s.id === 'informations_generales');
    const hasActivitePhysique = infoSection?.fields.some(f => f.id === 'activite_physique');
    console.log(`  ${hasActivitePhysique ? '✅' : '❌'} Champ "activité physique" dans "Informations Générales"`);
    
    // Vérifier section Vie Quotidienne
    const vieSection = verification.sections.find(s => s.id === 'vie_quotidienne');
    const vieFieldsCount = vieSection?.fields.length || 0;
    console.log(`  ${vieFieldsCount === 1 ? '✅' : '❌'} Section "Vie Quotidienne" avec ${vieFieldsCount} champ (profession uniquement)`);
    
    // Vérifier section Alimentation
    const alimentationSection = verification.sections.find(s => s.id === 'alimentation');
    const allergiesField = alimentationSection?.fields.find(f => f.id === 'allergies');
    const isCheckbox = allergiesField?.type === 'checkbox';
    const hasOptions = allergiesField?.options?.length === 15;
    const hasOtherField = alimentationSection?.fields.some(f => f.id === 'allergies_autre');
    
    console.log(`  ${isCheckbox ? '✅' : '❌'} Champ "allergies" de type checkbox`);
    console.log(`  ${hasOptions ? '✅' : '❌'} 15 options d'allergènes (14 officiels + Autre)`);
    console.log(`  ${hasOtherField ? '✅' : '❌'} Champ conditionnel "allergies_autre" présent`);
    
    if (hasActivitePhysique && vieFieldsCount === 1 && isCheckbox && hasOptions && hasOtherField) {
      console.log('\n🎉 SUCCÈS COMPLET! Toutes les modifications ont été appliquées correctement!');
    } else {
      console.log('\n⚠️  Certaines modifications n\'ont pas été appliquées correctement');
    }
  }
}

updateTemplateWithServiceRole();
