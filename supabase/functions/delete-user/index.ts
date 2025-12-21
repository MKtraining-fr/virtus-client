import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: corsHeaders,
      status: 405,
    });
  }

  console.log('Requête reçue par la fonction Edge delete-user.');

  try {
    const { userIdToDelete } = await req.json();
    console.log('ID utilisateur à supprimer:', userIdToDelete);

    if (!userIdToDelete) {
      console.error('userIdToDelete manquant dans le corps de la requête.');
      return new Response(JSON.stringify({ error: 'userIdToDelete is required' }), {
        headers: corsHeaders,
        status: 400,
      });
    }

    // Vérifier que la requête provient d'un utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("En-tête d'autorisation manquant.");
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: corsHeaders,
        status: 401,
      });
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
    console.log('Token extrait, vérification de l\'utilisateur...');

    // Vérifier que l'utilisateur actuel est valide (utiliser la même méthode que create-user-admin)
    const {
      data: { user: callingUser },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !callingUser) {
      console.error("Erreur lors de la vérification de l'utilisateur appelant:", userError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user' }), {
        headers: corsHeaders,
        status: 401,
      });
    }

    console.log('Utilisateur vérifié:', callingUser.id, callingUser.email);

    // Récupérer le profil de l'appelant pour vérifier son rôle
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('clients')
      .select('role')
      .eq('id', callingUser.id)
      .single();

    if (callerProfileError || !callerProfile) {
      console.error("Erreur lors de la récupération du profil de l'appelant:", callerProfileError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Profile not found' }), {
        headers: corsHeaders,
        status: 403,
      });
    }

    console.log('Rôle de l\'appelant:', callerProfile.role);

    // Vérifier que l'appelant est admin ou coach
    if (callerProfile.role !== 'admin' && callerProfile.role !== 'coach') {
      console.error("L'appelant n'a pas les permissions nécessaires. Rôle:", callerProfile.role);
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin or Coach access required' }), {
        headers: corsHeaders,
        status: 403,
      });
    }

    // Si l'appelant est un coach, vérifier qu'il ne supprime que ses propres clients
    if (callerProfile.role === 'coach') {
      const { data: clientToDelete, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('coach_id, role')
        .eq('id', userIdToDelete)
        .single();

      if (clientError || !clientToDelete) {
        console.error("Erreur lors de la vérification du client à supprimer:", clientError);
        return new Response(JSON.stringify({ error: 'Client not found' }), {
          headers: corsHeaders,
          status: 404,
        });
      }

      // Un coach ne peut supprimer que ses propres clients
      if (clientToDelete.coach_id !== callingUser.id) {
        console.error("Le coach essaie de supprimer un client qui ne lui appartient pas.");
        return new Response(JSON.stringify({ error: 'You can only delete your own clients' }), {
          headers: corsHeaders,
          status: 403,
        });
      }

      // Un coach ne peut pas supprimer un autre coach ou admin
      if (clientToDelete.role === 'coach' || clientToDelete.role === 'admin') {
        console.error("Le coach essaie de supprimer un autre coach ou admin.");
        return new Response(JSON.stringify({ error: 'Coaches cannot delete other coaches or admins' }), {
          headers: corsHeaders,
          status: 403,
        });
      }
    }

    // Supprimer d'abord le profil client de la table 'clients' (avant auth.users à cause des FK)
    console.log("Tentative de suppression du profil client de la table 'clients':", userIdToDelete);
    const { error: profileError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', userIdToDelete);

    if (profileError) {
      console.error('Erreur lors de la suppression du profil client:', profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        headers: corsHeaders,
        status: 500,
      });
    }
    console.log("Profil client supprimé de la table 'clients':", userIdToDelete);

    // Supprimer l'utilisateur de Supabase Auth
    console.log("Tentative de suppression de l'utilisateur de Supabase Auth:", userIdToDelete);
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (authError) {
      console.error("Erreur lors de la suppression de l'utilisateur de Supabase Auth:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: corsHeaders,
        status: 500,
      });
    }
    console.log('Utilisateur supprimé de Supabase Auth:', userIdToDelete);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Utilisateur et profil supprimés avec succès' 
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur inattendue dans la fonction Edge delete-user:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
