/**
 * Script de test pour le flux d'emails
 * Teste l'envoi d'emails d'invitation et de réinitialisation de mot de passe
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailFlow() {
  console.log('🧪 Test du flux d\'emails Virtus\n');
  console.log('═'.repeat(60));
  
  // Test 1: Vérifier la connexion Supabase
  console.log('\n📡 Test 1: Connexion à Supabase');
  console.log('─'.repeat(60));
  try {
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connexion Supabase OK');
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return;
  }
  
  // Test 2: Lister les clients existants
  console.log('\n👥 Test 2: Liste des clients');
  console.log('─'.repeat(60));
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, email, first_name, last_name, role, status')
      .limit(5);
    
    if (error) throw error;
    
    if (clients && clients.length > 0) {
      console.log(`✅ ${clients.length} client(s) trouvé(s):\n`);
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.first_name} ${client.last_name}`);
        console.log(`      Email: ${client.email}`);
        console.log(`      Rôle: ${client.role}`);
        console.log(`      Statut: ${client.status}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Aucun client trouvé dans la base de données');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des clients:', error.message);
  }
  
  // Test 3: Tester l'envoi d'un email de réinitialisation
  console.log('\n📧 Test 3: Envoi d\'email de réinitialisation');
  console.log('─'.repeat(60));
  
  // Demander l'email à tester
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Entrez une adresse email pour tester l\'envoi (ou appuyez sur Entrée pour passer): ', async (testEmail) => {
    if (testEmail && testEmail.trim()) {
      try {
        console.log(`\n📤 Envoi d'un email de test à: ${testEmail}`);
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
          redirectTo: 'http://localhost:5173/set-password',
        });
        
        if (error) {
          console.error('❌ Erreur lors de l\'envoi:', error.message);
          
          if (error.message.includes('SMTP')) {
            console.log('\n⚠️  Configuration SMTP requise:');
            console.log('   1. Allez sur https://supabase.com/dashboard');
            console.log('   2. Sélectionnez votre projet');
            console.log('   3. Authentication → Settings → SMTP Settings');
            console.log('   4. Activez "Enable Custom SMTP"');
            console.log('   5. Configurez avec vos identifiants Brevo');
            console.log('\n📖 Consultez CONFIGURATION_BREVO_SMTP.md pour plus de détails');
          } else if (error.message.includes('rate limit')) {
            console.log('\n⚠️  Limite de taux atteinte. Attendez quelques minutes avant de réessayer.');
          } else if (error.message.includes('not found')) {
            console.log('\n⚠️  Cet email n\'est pas enregistré dans le système d\'authentification.');
            console.log('   Assurez-vous que le compte existe dans Supabase Auth.');
          }
        } else {
          console.log('✅ Email envoyé avec succès !');
          console.log('   Vérifiez la boîte de réception de', testEmail);
          console.log('   (Pensez à vérifier les spams)');
        }
      } catch (error) {
        console.error('❌ Exception:', error.message);
      }
    } else {
      console.log('⏭️  Test d\'envoi d\'email ignoré');
    }
    
    // Test 4: Vérifier les templates d'email
    console.log('\n📝 Test 4: Configuration des templates');
    console.log('─'.repeat(60));
    console.log('Les templates d\'email sont configurés dans le dashboard Supabase:');
    console.log('   → Authentication → Email Templates');
    console.log('\nTemplates disponibles:');
    console.log('   • Confirm signup: Email de confirmation d\'inscription');
    console.log('   • Invite user: Email d\'invitation');
    console.log('   • Magic Link: Email avec lien de connexion');
    console.log('   • Reset Password: Email de réinitialisation');
    console.log('   • Change Email: Email de confirmation de changement');
    
    // Test 5: Résumé et recommandations
    console.log('\n\n📊 Résumé des tests');
    console.log('═'.repeat(60));
    console.log('\n✅ Tests terminés\n');
    
    console.log('📋 Prochaines étapes:');
    console.log('   1. Configurez Brevo SMTP dans Supabase (voir CONFIGURATION_BREVO_SMTP.md)');
    console.log('   2. Personnalisez les templates d\'email dans le dashboard');
    console.log('   3. Testez l\'envoi d\'emails depuis l\'application');
    console.log('   4. Vérifiez que les emails n\'arrivent pas en spam');
    console.log('   5. Configurez SPF et DKIM pour votre domaine');
    
    console.log('\n💡 Conseils:');
    console.log('   • Utilisez une adresse email vérifiée dans Brevo');
    console.log('   • Testez avec plusieurs adresses email (Gmail, Outlook, etc.)');
    console.log('   • Surveillez les logs dans Supabase → Logs → Auth Logs');
    console.log('   • Consultez les quotas Brevo pour éviter les dépassements');
    
    console.log('\n═'.repeat(60));
    console.log('🎉 Test terminé !\n');
    
    rl.close();
    process.exit(0);
  });
}

// Exécuter les tests
testEmailFlow().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
