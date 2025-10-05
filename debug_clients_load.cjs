const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dqsbfnsicmzovlrhuoif.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzY1MTcsImV4cCI6MjA3NTIxMjUxN30.fkhw3Uw7aJzgf_wPypd50_5ypNi4xGrINPXuBHAjuPg'
);

async function test() {
  // Se connecter
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'contact@mktraining.fr',
    password: 'Darsche93.'
  });

  if (authError) {
    console.log('❌ Erreur de connexion:', authError.message);
    return;
  }

  console.log('✅ Connecté en tant que:', authData.user.email);
  console.log('User ID:', authData.user.id);

  // Récupérer tous les clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*');

  console.log('\n--- Résultat de la requête ---');
  console.log('Error:', clientsError);
  console.log('Data:', JSON.stringify(clients, null, 2));
  console.log(`\nTotal: ${clients?.length || 0} utilisateurs`);
}

test().catch(console.error);
