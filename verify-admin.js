import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dqsbfnsicmzovlrhuoif.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzY1MTcsImV4cCI6MjA3NTIxMjUxN30.fkhw3Uw7aJzgf_wPypd50_5ypNi4xGrINPXuBHAjuPg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAdmin() {
  console.log('🔐 Vérification du compte administrateur\n');

  try {
    // Connexion
    console.log('1️⃣ Connexion...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'contact@mktraining.fr',
      password: 'Darsche93.',
    });

    if (signInError) {
      console.log('   ❌ Erreur:', signInError.message);
      return;
    }

    console.log('   ✅ Connexion réussie!');
    console.log('   👤 ID:', signInData.user.id);

    // Récupération du profil
    console.log('\n2️⃣ Récupération du profil...');
    const { data: profile, error: profileError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.log('   ❌ Erreur:', profileError.message);
      return;
    }

    console.log('   ✅ Profil récupéré!');
    console.log('   📧 Email:', profile.email);
    console.log('   👤 Nom:', profile.first_name, profile.last_name);
    console.log('   🎭 Rôle:', profile.role);

    if (profile.role === 'admin') {
      console.log('\n✨ Compte administrateur vérifié avec succès!');
      console.log('\n🚀 Vous pouvez maintenant vous connecter à l\'application avec:');
      console.log('   Email: contact@mktraining.fr');
      console.log('   Mot de passe: Darsche93.');
    } else {
      console.log('\n⚠️  Le rôle n\'est pas "admin"');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

verifyAdmin();
