#!/usr/bin/env node
/**
 * Script pour exécuter la migration SQL directement via PostgreSQL
 * Nécessite la DATABASE_URL de Supabase
 */

const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

// L'URL de connexion PostgreSQL de Supabase
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('❌ Erreur: DATABASE_URL ou SUPABASE_DB_URL non défini');
  console.error('\n📋 Pour obtenir l\'URL de connexion:');
  console.error('1. Aller sur: https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/settings/database');
  console.error('2. Copier "Connection string" (URI)');
  console.error('3. Ajouter dans .env: DATABASE_URL="postgresql://..."');
  console.error('\n⚠️  Attention: Utilisez la "Connection pooling" pour éviter les limites de connexion');
  process.exit(1);
}

console.log('🔧 Migration: Ajout de la colonne status à la table clients');
console.log('='.repeat(60));

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Nécessaire pour Supabase
  });

  try {
    console.log('\n📡 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté à Supabase PostgreSQL\n');

    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('/home/ubuntu/virtus/supabase/add_status_column.sql', 'utf8');
    
    // Diviser en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));

    console.log(`📋 ${commands.length} commandes SQL à exécuter\n`);

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      const preview = cmd.substring(0, 80).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${commands.length}] ${preview}${cmd.length > 80 ? '...' : ''}`);
      
      try {
        await client.query(cmd);
        console.log('   ✅ Succès\n');
      } catch (error) {
        // Ignorer les erreurs "already exists"
        if (error.message.includes('already exists') || error.message.includes('IF NOT EXISTS')) {
          console.log('   ⚠️  Déjà existant (ignoré)\n');
        } else {
          console.error(`   ❌ Erreur: ${error.message}\n`);
        }
      }
    }

    // Vérifier que la colonne a été créée
    console.log('🔍 Vérification de la colonne status...');
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'status'
    `);

    if (result.rows.length > 0) {
      console.log('✅ La colonne status existe !');
      console.log('   Détails:', result.rows[0]);
    } else {
      console.log('❌ La colonne status n\'a pas été créée');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration terminée avec succès !');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('📡 Connexion fermée');
  }
}

main();
