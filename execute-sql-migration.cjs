#!/usr/bin/env node
/**
 * Script pour exécuter le SQL de migration directement dans Supabase
 * Utilise l'API REST de Supabase
 */

const https = require('https');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dqsbfnsicmzovlrhuoif.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Erreur: VITE_SUPABASE_ANON_KEY non défini');
  process.exit(1);
}

console.log('🔧 Exécution de la migration SQL: ajout de la colonne status');
console.log('='.repeat(60));

// Lire le fichier SQL
const sqlContent = fs.readFileSync('/home/ubuntu/virtus/supabase/add_status_column.sql', 'utf8');

console.log('\n📄 SQL à exécuter:');
console.log('─'.repeat(60));
console.log(sqlContent);
console.log('─'.repeat(60));

// Fonction pour exécuter du SQL via l'API PostgREST
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Fonction pour exécuter une requête SQL brute via l'API
async function executeSQLDirect(sql) {
  // Diviser le SQL en commandes individuelles
  const commands = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  console.log(`\n📋 ${commands.length} commandes SQL à exécuter\n`);

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    console.log(`\n[${i + 1}/${commands.length}] Exécution de:`);
    console.log(cmd.substring(0, 100) + (cmd.length > 100 ? '...' : ''));
    
    try {
      // Pour les commandes ALTER TABLE, UPDATE, CREATE INDEX, etc.
      // On ne peut pas les exécuter via l'API REST standard
      console.log('⚠️  Cette commande nécessite des privilèges d\'administration');
    } catch (error) {
      console.error(`❌ Erreur: ${error.message}`);
    }
  }
}

async function main() {
  console.log('\n⚠️  LIMITATION DE L\'API REST:');
  console.log('L\'API REST de Supabase (PostgREST) ne permet pas d\'exécuter');
  console.log('des commandes DDL (ALTER TABLE, CREATE INDEX, etc.)');
  console.log('Ces commandes nécessitent des privilèges d\'administration.\n');
  
  console.log('📋 SOLUTION: Utiliser le SQL Editor du dashboard Supabase\n');
  console.log('Instructions:');
  console.log('1. Aller sur: https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql');
  console.log('2. Créer une nouvelle requête');
  console.log('3. Copier-coller le SQL ci-dessus');
  console.log('4. Cliquer sur "Run"\n');
  
  console.log('💡 Ou utiliser la CLI Supabase:');
  console.log('   npx supabase db push --db-url "postgresql://..."');
  
  console.log('\n' + '='.repeat(60));
  
  // Vérifier si la colonne existe déjà
  console.log('\n🔍 Vérification de l\'état actuel...');
  
  const https = require('https');
  const url = new URL('/rest/v1/clients?limit=1', SUPABASE_URL);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data && data.length > 0) {
          const client = data[0];
          if ('status' in client) {
            console.log('✅ La colonne "status" existe déjà !');
            console.log(`   Valeur: ${client.status}`);
            console.log('   Aucune action nécessaire.');
          } else {
            console.log('❌ La colonne "status" n\'existe pas encore.');
            console.log('   Veuillez exécuter le SQL dans le dashboard Supabase.');
          }
        } else {
          console.log('⚠️  La table clients est vide, impossible de vérifier.');
        }
      } catch (e) {
        console.log('⚠️  Impossible de vérifier:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur:', e.message);
  });

  req.end();
}

main();
