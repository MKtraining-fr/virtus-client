/**
 * Script d'importation des aliments CIQUAL dans Supabase
 * 
 * Ce script importe les données nutritionnelles de la base CIQUAL
 * dans la table food_items de Supabase.
 * 
 * Usage: node import-food-items.js
 */

import { createClient } from '@supabase/supabase-js';
import { CIQUAL_DATA } from './src/data/ciqualData.ts';

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importFoodItems() {
  console.log('🚀 Début de l\'importation des aliments CIQUAL...');
  console.log(`📊 Nombre d'aliments à importer: ${CIQUAL_DATA.length}`);

  try {
    // Vérifier si des aliments existent déjà
    const { data: existingItems, error: checkError } = await supabase
      .from('food_items')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      process.exit(1);
    }

    if (existingItems && existingItems.length > 0) {
      console.log('⚠️  Des aliments existent déjà dans la base de données');
      console.log('Voulez-vous continuer et ajouter les aliments manquants ? (y/n)');
      
      // Pour l'automatisation, on continue automatiquement
      console.log('✅ Continuation automatique...');
    }

    // Convertir les données CIQUAL au format Supabase
    const foodItemsToInsert = CIQUAL_DATA.map(item => ({
      name: item.name,
      category: item.category,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }));

    // Importer par lots de 100 pour éviter les timeouts
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < foodItemsToInsert.length; i += batchSize) {
      const batch = foodItemsToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('food_items')
        .upsert(batch, { 
          onConflict: 'name',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error(`❌ Erreur lors de l'importation du lot ${i / batchSize + 1}:`, error);
        errors++;
      } else {
        imported += batch.length;
        console.log(`✅ Lot ${i / batchSize + 1} importé (${imported}/${foodItemsToInsert.length})`);
      }
    }

    console.log('\n📊 Résumé de l\'importation:');
    console.log(`   ✅ Aliments traités: ${imported}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    
    if (errors === 0) {
      console.log('\n🎉 Importation réussie !');
    } else {
      console.log('\n⚠️  Importation terminée avec des erreurs');
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter l'importation
importFoodItems();
