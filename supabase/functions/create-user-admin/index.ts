import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'admin' | 'coach' | 'client';
  coachId?: string;
  affiliationCode?: string;
  status?: 'active' | 'prospect';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Vérifier que la requête provient d'un utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Créer un client Supabase avec la clé service pour les opérations admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Extraire le token JWT du header Authorization
    const token = authHeader.replace('Bearer ', '');

    // Vérifier que l'utilisateur actuel est un admin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized: Invalid user');
    }

    // Récupérer le profil de l'utilisateur pour vérifier son rôle
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    // Parser les données de la requête
    const userData: CreateUserRequest = await req.json();

    // Valider les données requises
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      throw new Error('Missing required fields: email, password, firstName, lastName');
    }

    // Créer l'utilisateur dans Supabase Auth sans envoyer d'email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || '',
        role: userData.role || 'client',
        affiliation_code: userData.affiliationCode || null,
        coach_id: userData.coachId && userData.coachId !== '' ? userData.coachId : null,
        // Flag pour indiquer que l'utilisateur a été créé par un admin/coach
        // et doit changer son mot de passe à la première connexion
        created_by_admin: true,
        password_changed: false,
        created_at: new Date().toISOString(),
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      // Fournir des messages d'erreur plus clairs pour les erreurs courantes
      let errorMessage = authError.message;
      
      if (authError.message.includes('Password')) {
        errorMessage = 'Le mot de passe ne respecte pas les exigences de sécurité. Il doit contenir au moins 8 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.';
      } else if (authError.message.includes('email')) {
        errorMessage = 'Cette adresse email est déjà utilisée ou invalide.';
      }
      
      throw new Error(errorMessage);
    }

    if (!authData.user) {
      throw new Error('No user returned from auth creation');
    }

    // Créer le profil dans la table clients
    const clientProfile = {
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone: userData.phone || '',
      role: userData.role || 'client',
      affiliation_code: userData.affiliationCode || null,
      coach_id: userData.coachId && userData.coachId !== '' ? userData.coachId : null,
      status: userData.status || 'active',
    };

    const { data: profileData, error: profileInsertError } = await supabaseAdmin
      .from('clients')
      .insert([clientProfile])
      .select()
      .single();

    if (profileInsertError) {
      console.error('Error creating profile:', profileInsertError);
      // Si la création du profil échoue, supprimer l'utilisateur Auth créé
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${profileInsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile: profileData,
        },
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-user-admin function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: corsHeaders,
        status: 400,
      }
    );
  }
});
