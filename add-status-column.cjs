#!/usr/bin/env node
/**
 * Script pour ajouter la colonne status à la table clients
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

console.log('🔧 Vérification de la colonne status dans la table clients');
console.log('='.repeat(60));

// Fonction pour faire une requête GET
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function main() {
  try {
    // Vérifier si la colonne status existe en récupérant un client
    console.log('\n📋 Vérification de la structure actuelle...');
    const response = await makeRequest('/rest/v1/clients?limit=1');
    
    if (response.status === 200 && response.data && response.data.length > 0) {
      const client = response.data[0];
      console.log('✅ Client récupéré:', Object.keys(client).join(', '));
      
      if ('status' in client) {
        console.log('\n✅ La colonne "status" existe déjà !');
        console.log(`   Valeur actuelle: ${client.status}`);
      } else {
        console.log('\n❌ La colonne "status" n\'existe pas encore.');
        console.log('\n📋 Instructions pour ajouter la colonne:');
        console.log('1. Aller sur: https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql');
        console.log('2. Exécuter le SQL suivant:\n');
        
        const sqlContent = fs.readFileSync('/home/ubuntu/virtus/supabase/add_status_column.sql', 'utf8');
        console.log('─'.repeat(60));
        console.log(sqlContent);
        console.log('─'.repeat(60));
      }
    } else if (response.status === 200 && response.data && response.data.length === 0) {
      console.log('\n⚠️  La table clients est vide.');
      console.log('   Impossible de vérifier la structure.');
      console.log('\n📋 Instructions pour ajouter la colonne:');
      console.log('1. Aller sur: https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql');
      console.log('2. Copier le contenu de supabase/add_status_column.sql');
      console.log('3. Coller dans le SQL Editor et cliquer sur "Run"');
    } else {
      console.log(`\n❌ Erreur: ${response.status}`);
      console.log(JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
}

main();
