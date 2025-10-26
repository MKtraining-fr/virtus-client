import { supabase } from './supabase';

/**
 * Créer un utilisateur sans mot de passe et envoyer un email d'invitation
 * Le client définira son mot de passe via le lien dans l'email
 */
export const createUserWithInvitation = async (userData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'admin' | 'coach' | 'client';
  coachId?: string;
  status?: 'active' | 'prospect';
}): Promise<{ user: any; error: any }> => {
  // Générer un mot de passe temporaire aléatoire
  // Ce mot de passe ne sera jamais communiqué à l'utilisateur
  const tempPassword = generateSecurePassword();

  // Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: tempPassword,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || '',
        role: userData.role || 'client',
      },
      // Envoyer un email de confirmation avec lien de réinitialisation
      emailRedirectTo: `${window.location.origin}/set-password`,
    },
  });

  if (authError) {
    return { user: null, error: authError };
  }

  if (!authData.user) {
    return { user: null, error: new Error('Échec de la création du compte') };
  }

  // Créer le profil client dans la base de données
  const clientProfile = {
    id: authData.user.id,
    email: userData.email,
    first_name: userData.firstName,
    last_name: userData.lastName,
    phone: userData.phone || '',
    role: userData.role || 'client',
    coach_id: userData.coachId || null,
    status: userData.status || 'active',
  };

  const { error: profileError } = await supabase.from('clients').insert([clientProfile]);

  if (profileError) {
    console.error('Erreur lors de la création du profil:', profileError);
    // Ne pas bloquer si le profil échoue (peut-être déjà créé par trigger)
  }

  // Envoyer un email de réinitialisation de mot de passe
  // Cela permettra au client de définir son propre mot de passe
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(userData.email, {
    redirectTo: `${window.location.origin}/set-password`,
  });

  if (resetError) {
    console.error("Erreur lors de l'envoi de l'email d'invitation:", resetError);
    // Ne pas bloquer l'inscription si l'email échoue
  }

  return { user: authData.user, error: null };
};

/**
 * Générer un mot de passe sécurisé aléatoire
 */
function generateSecurePassword(): string {
  const length = 32;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';

  // Ajouter au moins un caractère de chaque type requis
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Majuscule
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minuscule
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Chiffre
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Caractère spécial

  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Mélanger les caractères
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
