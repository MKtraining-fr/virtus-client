import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dqsbfnsicmzovlrhuoif.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzY1MTcsImV4cCI6MjA3NTIxMjUxN30.fkhw3Uw7aJzgf_wPypd50_5ypNi4xGrINPXuBHAjuPg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log('👑 Création d\'un compte administrateur\n');

  // Demander les informations
  const email = process.argv[2];
  const password = process.argv[3];
  const firstName = process.argv[4] || 'Admin';
  const lastName = process.argv[5] || 'Virtus';

  if (!email || !password) {
    console.log('❌ Usage: node create-admin.js <email> <password> [firstName] [lastName]');
    console.log('   Exemple: node create-admin.js admin@virtus.com MonMotDePasse123! Admin Virtus');
    process.exit(1);
  }

  try {
    // Créer l'utilisateur
    console.log('1️⃣ Création du compte...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
        },
      },
    });

    if (signUpError) {
      console.log('   ❌ Erreur:', signUpError.message);
      process.exit(1);
    }

    console.log('   ✅ Compte créé!');
    console.log('   👤 ID:', signUpData.user.id);

    // Créer le profil avec le rôle admin
    console.log('\n2️⃣ Création du profil administrateur...');
    const { error: profileError } = await supabase
      .from('clients')
      .insert([
        {
          id: signUpData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
        },
      ]);

    if (profileError) {
      console.log('   ❌ Erreur:', profileError.message);
      process.exit(1);
    }

    console.log('   ✅ Profil administrateur créé!');
    console.log('\n✨ Compte administrateur créé avec succès!');
    console.log('   📧 Email:', email);
    console.log('   👤 Nom:', firstName, lastName);
    console.log('   🎭 Rôle: admin');
    console.log('\n⚠️  Note: Si la confirmation par email est activée, vérifiez votre boîte mail.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createAdmin();
