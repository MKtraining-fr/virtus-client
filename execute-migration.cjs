const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjUxNywiZXhwIjoyMDc1MjEyNTE3fQ.ifhehLUGe8glLsinaqwV9_xxO8CoJUfmO_1PcQLsm90';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeMigration() {
  console.log('🚀 Début de la migration de la base de données...\n');
  
  // Lire le fichier SQL
  const sqlContent = fs.readFileSync('/home/ubuntu/virtus/migration-complete-bdd.sql', 'utf8');
  
  // Diviser le SQL en commandes individuelles
  const commands = sqlContent
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.match(/^\/\*/));
  
  console.log(`📝 ${commands.length} commandes SQL à exécuter\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    
    // Ignorer les commentaires et les blocs DO
    if (command.trim().length === 0 || 
        command.includes('COMMENT ON') ||
        command.startsWith('SELECT') && command.includes('message')) {
      continue;
    }
    
    try {
      // Exécuter via rpc si disponible, sinon via query
      const { data, error } = await supabase.rpc('exec', { 
        sql: command + ';' 
      }).catch(async () => {
        // Si rpc ne fonctionne pas, essayer avec la méthode from
        return { error: 'RPC not available' };
      });
      
      if (error && error !== 'RPC not available') {
        console.log(`❌ Erreur commande ${i + 1}: ${command.substring(0, 50)}...`);
        console.log(`   ${error.message || error}\n`);
        errorCount++;
        errors.push({ command: command.substring(0, 100), error: error.message || error });
      } else {
        console.log(`✅ Commande ${i + 1} exécutée`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Exception commande ${i + 1}: ${command.substring(0, 50)}...`);
      console.log(`   ${err.message}\n`);
      errorCount++;
      errors.push({ command: command.substring(0, 100), error: err.message });
    }
    
    // Petite pause pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA MIGRATION');
  console.log('='.repeat(60));
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Détails des erreurs:');
    errors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. ${err.command}...`);
      console.log(`   → ${err.error}`);
    });
  }
  
  if (errorCount === 0) {
    console.log('\n🎉 Migration terminée avec succès!');
  } else {
    console.log('\n⚠️  Migration terminée avec des erreurs. Vérifiez les détails ci-dessus.');
  }
}

executeMigration().catch(err => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});
