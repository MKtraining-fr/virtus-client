const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeUpdate() {
  console.log('🔄 Mise à jour du template "Bilan Initial"...\n');
  
  // Nouvelle structure avec les modifications demandées
  const updatedSections = [
    {
      "id": "informations_generales",
      "title": "Informations Générales",
      "fields": [
        {
          "id": "prenom",
          "type": "text",
          "label": "Prénom",
          "placeholder": ""
        },
        {
          "id": "nom",
          "type": "text",
          "label": "Nom",
          "placeholder": ""
        },
        {
          "id": "date_naissance",
          "type": "date",
          "label": "Date de naissance",
          "placeholder": ""
        },
        {
          "id": "sexe",
          "type": "select",
          "label": "Sexe",
          "options": [
            "Homme",
            "Femme",
            "Autre"
          ]
        },
        {
          "id": "taille",
          "type": "number",
          "label": "Taille (cm)",
          "placeholder": ""
        },
        {
          "id": "poids",
          "type": "number",
          "label": "Poids actuel (kg)",
          "placeholder": ""
        },
        {
          "id": "email",
          "type": "text",
          "label": "Email",
          "placeholder": ""
        },
        {
          "id": "telephone",
          "type": "text",
          "label": "Téléphone",
          "placeholder": ""
        },
        {
          "id": "activite_physique",
          "type": "select",
          "label": "Niveau d'activité physique",
          "options": [
            "Sédentaire",
            "Légèrement actif",
            "Modérément actif",
            "Très actif",
            "Extrêmement actif"
          ]
        }
      ],
      "isCivility": true,
      "isRemovable": false
    },
    {
      "id": "objectif",
      "title": "Objectif",
      "fields": [
        {
          "id": "objectif_principal",
          "type": "textarea",
          "label": "Quel est votre objectif principal?",
          "placeholder": ""
        },
        {
          "id": "poids_souhaite",
          "type": "number",
          "label": "Poids souhaité (kg)",
          "placeholder": ""
        },
        {
          "id": "delai",
          "type": "text",
          "label": "Délai souhaité",
          "placeholder": ""
        }
      ],
      "isRemovable": false
    },
    {
      "id": "vie_quotidienne",
      "title": "Vie Quotidienne",
      "fields": [
        {
          "id": "profession",
          "type": "text",
          "label": "Profession",
          "placeholder": ""
        }
      ],
      "isRemovable": false
    },
    {
      "id": "alimentation",
      "title": "Alimentation",
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
        {
          "id": "aversions",
          "type": "textarea",
          "label": "Aliments que vous n'aimez pas",
          "placeholder": ""
        },
        {
          "id": "habitudes",
          "type": "textarea",
          "label": "Habitudes alimentaires actuelles",
          "placeholder": ""
        }
      ],
      "isRemovable": false
    }
  ];

  // D'abord, récupérer le template actuel
  const { data: currentTemplate, error: fetchError } = await supabase
    .from('bilan_templates')
    .select('*')
    .eq('name', 'Bilan Initial')
    .single();

  if (fetchError) {
    console.error('❌ Erreur lors de la récupération:', fetchError);
    return;
  }

  console.log('✓ Template actuel récupéré');
  console.log('  ID:', currentTemplate.id);

  // Mettre à jour avec la nouvelle structure
  const { data, error } = await supabase
    .from('bilan_templates')
    .update({ 
      sections: updatedSections,
      updated_at: new Date().toISOString()
    })
    .eq('id', currentTemplate.id)
    .select();

  if (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    console.error('Détails:', JSON.stringify(error, null, 2));
    return;
  }

  console.log('\n✅ Template mis à jour avec succès!\n');
  console.log('📋 Modifications appliquées:');
  console.log('  1. ✓ Champ "Niveau d\'activité physique" déplacé de "Vie Quotidienne" vers "Informations Générales"');
  console.log('  2. ✓ Champ "Allergies alimentaires" remplacé par une liste de cases à cocher (14 allergènes officiels UE)');
  console.log('  3. ✓ Option "Autre" ajoutée avec champ conditionnel pour préciser\n');
  
  if (data && data.length > 0) {
    console.log('📊 Template mis à jour:', data[0].name);
    console.log('🆔 ID:', data[0].id);
    console.log('📅 Dernière mise à jour:', data[0].updated_at);
  }
}

executeUpdate();
