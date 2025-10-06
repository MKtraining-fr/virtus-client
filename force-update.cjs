const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceUpdate() {
  console.log('🔄 Mise à jour forcée du template...\n');
  
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

  // Mise à jour sans récupération du résultat
  const { error } = await supabase
    .from('bilan_templates')
    .update({ 
      sections: newSections,
      updated_at: new Date().toISOString()
    })
    .eq('name', 'Bilan Initial');

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log('✅ Mise à jour envoyée!\n');
  
  // Attendre un peu
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Vérifier
  console.log('🔍 Vérification...');
  const { data, error: errorCheck } = await supabase
    .from('bilan_templates')
    .select('sections')
    .eq('name', 'Bilan Initial')
    .single();

  if (errorCheck) {
    console.error('❌ Erreur vérification:', errorCheck);
    return;
  }

  if (data && data.sections) {
    const alimentationSection = data.sections.find(s => s.id === 'alimentation');
    if (alimentationSection) {
      const allergiesField = alimentationSection.fields.find(f => f.id === 'allergies');
      console.log('\n📋 Résultat:');
      console.log('  Type du champ allergies:', allergiesField?.type);
      console.log('  Nombre d\'options:', allergiesField?.options?.length || 0);
      if (allergiesField?.type === 'checkbox' && allergiesField?.options?.length === 15) {
        console.log('\n✅ SUCCÈS! Le template a été mis à jour correctement!');
        console.log('  ✓ Champ "activité physique" déplacé');
        console.log('  ✓ Champ "allergies" converti en checkbox avec 15 options');
        console.log('  ✓ Option "Autre" avec champ conditionnel ajoutée');
      } else {
        console.log('\n⚠️  La mise à jour n\'a pas été appliquée complètement');
      }
    }
  }
}

forceUpdate();
