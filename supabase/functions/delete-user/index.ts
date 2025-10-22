import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

console.log("Hello from Functions!" );

serve(async (req) => {
  console.log("Requête reçue par la fonction Edge delete-user.");

  if (req.method !== "POST") {
    console.warn(`Méthode non autorisée: ${req.method}`);
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const { userIdToDelete } = await req.json();
    console.log("ID utilisateur à supprimer:", userIdToDelete);

    if (!userIdToDelete) {
      console.error("userIdToDelete manquant dans le corps de la requête.");
      return new Response(JSON.stringify({ error: "userIdToDelete is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const authHeader = req.headers.get("Authorization");
    console.log("En-tête d'autorisation:", authHeader ? "Présent" : "Absent");

    if (!authHeader) {
      console.error("En-tête d'autorisation manquant.");
      return new Response(JSON.stringify({ error: "Authorization header missing" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      });
    }

    const accessToken = authHeader.split(" ")[1];
    console.log("Access Token:", accessToken ? "Présent" : "Absent");

    if (!accessToken) {
      console.error("Access Token manquant dans l'en-tête d'autorisation.");
      return new Response(JSON.stringify({ error: "Access Token missing" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    console.log("Client Supabase créé.");

    // Supprimer l'utilisateur de Supabase Auth
    console.log("Tentative de suppression de l'utilisateur de Supabase Auth:", userIdToDelete);
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userIdToDelete);

    if (authError) {
      console.error("Erreur lors de la suppression de l'utilisateur de Supabase Auth:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
    console.log("Utilisateur supprimé de Supabase Auth:", userIdToDelete);

    // Supprimer le profil client de la table 'clients'
    console.log("Tentative de suppression du profil client de la table 'clients':", userIdToDelete);
    const { error: profileError } = await supabaseClient
      .from("clients")
      .delete()
      .eq("id", userIdToDelete);

    if (profileError) {
      console.error("Erreur lors de la suppression du profil client:", profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
    console.log("Profil client supprimé de la table 'clients':", userIdToDelete);

    return new Response(JSON.stringify({ message: "Utilisateur et profil supprimés avec succès" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erreur inattendue dans la fonction Edge delete-user:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

