import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const defaultCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? req.headers.get("Origin") ?? "*";
  const requestHeaders = req.headers.get("Access-Control-Request-Headers");

  return {
    ...defaultCorsHeaders,
    ...(requestHeaders ? { 'Access-Control-Allow-Headers': requestHeaders } : {}),
    'Access-Control-Allow-Origin': origin,
    Vary: "Origin",
  };
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("Requête reçue par la fonction Edge delete-user.");

  try {
    const { userIdToDelete } = await req.json();
    console.log("ID utilisateur à supprimer:", userIdToDelete);

    if (!userIdToDelete) {
      console.error("userIdToDelete manquant dans le corps de la requête.");
      return new Response(JSON.stringify({ error: "userIdToDelete is required" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("En-tête d'autorisation manquant.");
      return new Response(JSON.stringify({ error: "Authorization header missing" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }

    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
      console.error("Access Token manquant dans l'en-tête d'autorisation.");
      return new Response(JSON.stringify({ error: "Access Token missing" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 401,
      });
    }

    // Créer un client Supabase pour la vérification de l'utilisateur (sans service_role)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "", // Utiliser la clé anon pour vérifier l'utilisateur
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    // Vérifier l'identité de l'appelant et son rôle (pour la sécurité)
    const { data: { user: callingUser }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !callingUser) {
        console.error("Erreur lors de la vérification de l'utilisateur appelant:", userError);
        return new Response(JSON.stringify({ error: "Invalid or expired access token" }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
            status: 401,
        });
    }

    // Récupérer le rôle de l'utilisateur appelant (nécessite une table de profils ou une RLS)
    // Pour simplifier, nous allons supposer que l'utilisateur appelant est un admin ou un coach
    // Une vérification de rôle plus robuste est recommandée ici.
    // Pour le moment, nous allons juste nous assurer que l'utilisateur est authentifié.

    // Créer le client Supabase avec la clé SERVICE_ROLE pour la suppression
    // Cela permet de contourner les RLS et d'effectuer la suppression admin.
    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    console.log("Client Supabase Service Role créé.");

    // Supprimer l'utilisateur de Supabase Auth
    console.log("Tentative de suppression de l'utilisateur de Supabase Auth:", userIdToDelete);
    const { error: authError } = await serviceRoleClient.auth.admin.deleteUser(userIdToDelete);

    if (authError) {
      console.error("Erreur lors de la suppression de l'utilisateur de Supabase Auth:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      });
    }
    console.log("Utilisateur supprimé de Supabase Auth:", userIdToDelete);

    // Supprimer le profil client de la table 'clients'
    console.log("Tentative de suppression du profil client de la table 'clients':", userIdToDelete);
    const { error: profileError } = await serviceRoleClient
      .from("clients")
      .delete()
      .eq("id", userIdToDelete);

    if (profileError) {
      console.error("Erreur lors de la suppression du profil client:", profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      });
    }
    console.log("Profil client supprimé de la table 'clients':", userIdToDelete);

    return new Response(JSON.stringify({ message: "Utilisateur et profil supprimés avec succès" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    console.error("Erreur inattendue dans la fonction Edge delete-user:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
