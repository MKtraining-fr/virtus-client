import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const defaultAllowedOrigins = [
  'https://virtusofficiel.netlify.app',
  'https://www.virtusofficiel.netlify.app',
  'https://virtus-6zp.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
];

const allowedOriginCandidates =
  Deno.env
    .get('DELETE_USER_ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? defaultAllowedOrigins;

function normalizeOrigin(origin: string) {
  return origin ? origin.replace(/\/$/, '').toLowerCase() : '';
}

const allowedOrigins = new Set(allowedOriginCandidates.map((origin) => normalizeOrigin(origin)));

const defaultAllowedHeaders = ['authorization', 'x-client-info', 'apikey', 'content-type'];

const defaultCorsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin, Access-Control-Request-Headers',
};

function buildCorsHeaders(req: Request) {
  const rawOrigin = req.headers.get('origin') ?? req.headers.get('Origin') ?? '';
  const trimmedOrigin = rawOrigin.replace(/\/$/, '');
  const normalizedOrigin = normalizeOrigin(rawOrigin);
  const allowedOrigin =
    allowedOrigins.size === 0
      ? trimmedOrigin || '*'
      : normalizedOrigin && allowedOrigins.has(normalizedOrigin)
        ? trimmedOrigin
        : null;

  const requestHeaders = req.headers
    .get('Access-Control-Request-Headers')
    ?.split(',')
    .map((header) => header.trim())
    .filter(Boolean);

  const headerSet = new Map<string, string>();
  for (const header of defaultAllowedHeaders) {
    const key = header.toLowerCase();
    if (!headerSet.has(key)) {
      headerSet.set(key, header);
    }
  }

  if (requestHeaders) {
    for (const header of requestHeaders) {
      const key = header.toLowerCase();
      if (!headerSet.has(key)) {
        headerSet.set(key, header);
      }
    }
  }

  const headers: Record<string, string> = {
    ...defaultCorsHeaders,
    'Access-Control-Allow-Headers': Array.from(headerSet.values()).join(', '),
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    if (allowedOrigin !== '*') {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  return { headers, allowedOrigin, requestedOrigin: rawOrigin };
}

serve(async (req) => {
  const { headers: corsHeaders, allowedOrigin, requestedOrigin } = buildCorsHeaders(req);
  if (!allowedOrigin || allowedOrigin === '') {
    console.warn('Requête refusée pour une origine non autorisée:', requestedOrigin || '(aucune)');
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      status: 403,
    });
  }
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.warn(`Méthode non autorisée: ${req.method}`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("En-tête d'autorisation manquant.");
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 401,
      });
    }

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      console.error("Access Token manquant dans l'en-tête d'autorisation.");
      return new Response(JSON.stringify({ error: 'Access Token missing' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 401,
      });
    }

    // Créer un client Supabase pour la vérification de l'utilisateur (sans service_role)
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Utiliser la clé anon pour vérifier l'utilisateur
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    // Vérifier l'identité de l'appelant et son rôle (pour la sécurité)
    const {
      data: { user: callingUser },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !callingUser) {
      console.error("Erreur lors de la vérification de l'utilisateur appelant:", userError);
      return new Response(JSON.stringify({ error: 'Invalid or expired access token' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 401,
      });
    }

    // Créer le client Supabase avec la clé SERVICE_ROLE pour la suppression
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Client Supabase Service Role créé.');

    // Récupérer le profil de l'appelant pour vérifier son rôle
    const { data: callerProfile, error: callerProfileError } = await serviceRoleClient
      .from('clients')
      .select('role')
      .eq('id', callingUser.id)
      .single();

    if (callerProfileError || !callerProfile) {
      console.error("Erreur lors de la récupération du profil de l'appelant:", callerProfileError);
      return new Response(JSON.stringify({ error: 'Could not verify caller permissions' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 403,
      });
    }

    // Vérifier que l'appelant est admin ou coach
    if (callerProfile.role !== 'admin' && callerProfile.role !== 'coach') {
      console.error("L'appelant n'a pas les permissions nécessaires. Rôle:", callerProfile.role);
      return new Response(JSON.stringify({ error: 'Insufficient permissions. Only admin or coach can delete users.' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 403,
      });
    }

    // Si l'appelant est un coach, vérifier qu'il ne supprime que ses propres clients
    if (callerProfile.role === 'coach') {
      const { data: clientToDelete, error: clientError } = await serviceRoleClient
        .from('clients')
        .select('coach_id, role')
        .eq('id', userIdToDelete)
        .single();

      if (clientError || !clientToDelete) {
        console.error("Erreur lors de la vérification du client à supprimer:", clientError);
        return new Response(JSON.stringify({ error: 'Client not found' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 404,
        });
      }

      // Un coach ne peut supprimer que ses propres clients
      if (clientToDelete.coach_id !== callingUser.id) {
        console.error("Le coach essaie de supprimer un client qui ne lui appartient pas.");
        return new Response(JSON.stringify({ error: 'You can only delete your own clients' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 403,
        });
      }

      // Un coach ne peut pas supprimer un autre coach ou admin
      if (clientToDelete.role === 'coach' || clientToDelete.role === 'admin') {
        console.error("Le coach essaie de supprimer un autre coach ou admin.");
        return new Response(JSON.stringify({ error: 'Coaches cannot delete other coaches or admins' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 403,
        });
      }
    }

    // Supprimer d'abord le profil client de la table 'clients' (avant auth.users à cause des FK)
    console.log("Tentative de suppression du profil client de la table 'clients':", userIdToDelete);
    const { error: profileError } = await serviceRoleClient
      .from('clients')
      .delete()
      .eq('id', userIdToDelete);

    if (profileError) {
      console.error('Erreur lors de la suppression du profil client:', profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      });
    }
    console.log("Profil client supprimé de la table 'clients':", userIdToDelete);

    // Supprimer l'utilisateur de Supabase Auth
    console.log("Tentative de suppression de l'utilisateur de Supabase Auth:", userIdToDelete);
    const { error: authError } = await serviceRoleClient.auth.admin.deleteUser(userIdToDelete);

    if (authError) {
      console.error("Erreur lors de la suppression de l'utilisateur de Supabase Auth:", authError);
      // Note: Le profil a déjà été supprimé, mais l'utilisateur auth reste
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      });
    }
    console.log('Utilisateur supprimé de Supabase Auth:', userIdToDelete);

    return new Response(
      JSON.stringify({ message: 'Utilisateur et profil supprimés avec succès' }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur inattendue dans la fonction Edge delete-user:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});
