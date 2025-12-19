import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'coach' | 'client';
  affiliationCode?: string;
}

/**
 * Edge Function: invite-user
 * 
 * Permet à un coach d'inviter un nouveau client par email.
 * Utilise supabase.auth.admin.inviteUserByEmail() pour envoyer un email d'invitation
 * avec un lien permettant au client de définir son mot de passe.
 * 
 * Le coach_id est automatiquement associé au nouveau client.
 */
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

    // Vérifier l'utilisateur actuel
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !currentUser) {
      throw new Error('Unauthorized: Invalid user');
    }

    // Récupérer le profil de l'utilisateur pour vérifier son rôle
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('clients')
      .select('role, id, first_name, last_name')
      .eq('id', currentUser.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Unauthorized: Profile not found');
    }

    // Vérifier que l'utilisateur est un coach ou un admin
    if (profile.role !== 'coach' && profile.role !== 'admin') {
      throw new Error('Unauthorized: Only coaches and admins can invite users');
    }

    // Parser les données de la requête
    const userData: InviteUserRequest = await req.json();

    // Valider les données requises
    if (!userData.email || !userData.firstName || !userData.lastName) {
      throw new Error('Missing required fields: email, firstName, lastName');
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Vérifier si l'email existe déjà
    const { data: existingUser } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', userData.email.toLowerCase())
      .single();

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Déterminer l'URL de redirection pour la définition du mot de passe
    const redirectUrl = Deno.env.get('SITE_URL') 
      ? `${Deno.env.get('SITE_URL')}/set-password`
      : 'https://virtus-6zp.pages.dev/set-password';

    // Inviter l'utilisateur via Supabase Auth
    // Cette méthode envoie automatiquement un email d'invitation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      userData.email,
      {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || '',
          role: userData.role || 'client',
          coach_id: profile.role === 'coach' ? currentUser.id : null,
          affiliation_code: userData.affiliationCode || null,
          status: 'active',
          invited_by: currentUser.id,
          invited_at: new Date().toISOString(),
        },
        redirectTo: redirectUrl,
      }
    );

    if (authError) {
      console.error('Error inviting user:', authError);
      
      // Fournir des messages d'erreur plus clairs
      let errorMessage = authError.message;
      
      if (authError.message.includes('already registered')) {
        errorMessage = 'Cette adresse email est déjà enregistrée dans le système.';
      } else if (authError.message.includes('rate limit')) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
      }
      
      throw new Error(errorMessage);
    }

    if (!authData.user) {
      throw new Error('No user returned from invitation');
    }

    // Le trigger on_auth_user_created_sync_clients va automatiquement créer
    // le profil dans public.clients avec les métadonnées fournies

    // Créer une notification pour le coach
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: currentUser.id,
        title: 'Invitation envoyée',
        message: `Une invitation a été envoyée à ${userData.firstName} ${userData.lastName} (${userData.email})`,
        type: 'invitation',
        read: false,
      });

    console.log(`User invited successfully: ${userData.email} by coach ${currentUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation envoyée à ${userData.email}`,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in invite-user function:', error);
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
