const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUpdate() {
  console.log('🔍 Diagnostic de la mise à jour...\n');
  
  // 1. Récupérer le template actuel
  const { data: before, error: errorBefore } = await supabase
    .from('bilan_templates')
    .select('*')
    .eq('name', 'Bilan Initial')
    .single();

  if (errorBefore) {
    console.error('❌ Erreur récupération:', errorBefore);
    return;
  }

  console.log('📋 Template AVANT mise à jour:');
  console.log('  - Nombre de sections:', before.sections?.length || 0);
  if (before.sections && before.sections.length > 0) {
    before.sections.forEach((section, idx) => {
      console.log(`  - Section ${idx + 1}: ${section.title} (${section.fields?.length || 0} champs)`);
      if (section.id === 'alimentation') {
        const allergiesField = section.fields.find(f => f.id === 'allergies');
        console.log(`    → Allergies: type="${allergiesField?.type}", options=${allergiesField?.options?.length || 0}`);
      }
    });
  }

  // 2. Préparer la nouvelle structure
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

  console.log('\n📝 Nouvelle structure préparée:');
  console.log('  - Nombre de sections:', newSections.length);
  newSections.forEach((section, idx) => {
    console.log(`  - Section ${idx + 1}: ${section.title} (${section.fields.length} champs)`);
    if (section.id === 'alimentation') {
      const allergiesField = section.fields.find(f => f.id === 'allergies');
      console.log(`    → Allergies: type="${allergiesField.type}", options=${allergiesField.options.length}`);
    }
  });

  // 3. Effectuer la mise à jour
  console.log('\n🔄 Exécution de la mise à jour...');
  const { data: updated, error: errorUpdate } = await supabase
    .from('bilan_templates')
    .update({ 
      sections: newSections,
      updated_at: new Date().toISOString()
    })
    .eq('id', before.id)
    .select()
    .single();

  if (errorUpdate) {
    console.error('❌ Erreur mise à jour:', errorUpdate);
    console.error('Détails:', JSON.stringify(errorUpdate, null, 2));
    return;
  }

  console.log('✅ Mise à jour effectuée!');

  // 4. Vérifier le résultat
  const { data: after, error: errorAfter } = await supabase
    .from('bilan_templates')
    .select('*')
    .eq('name', 'Bilan Initial')
    .single();

  if (errorAfter) {
    console.error('❌ Erreur vérification:', errorAfter);
    return;
  }

  console.log('\n📋 Template APRÈS mise à jour:');
  console.log('  - Nombre de sections:', after.sections?.length || 0);
  if (after.sections && after.sections.length > 0) {
    after.sections.forEach((section, idx) => {
      console.log(`  - Section ${idx + 1}: ${section.title} (${section.fields?.length || 0} champs)`);
      if (section.id === 'alimentation') {
        const allergiesField = section.fields.find(f => f.id === 'allergies');
        console.log(`    → Allergies: type="${allergiesField?.type}", options=${allergiesField?.options?.length || 0}`);
        if (allergiesField?.options && allergiesField.options.length > 0) {
          console.log(`    → Première option: "${allergiesField.options[0]}"`);
          console.log(`    → Dernière option: "${allergiesField.options[allergiesField.options.length - 1]}"`);
        }
      }
    });
  }

  console.log('\n✅ Diagnostic terminé!');
}

debugUpdate();
