import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // 1. Vérifier si l'utilisateur est un administrateur
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser();

    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Récupérer le rôle de l'utilisateur
    const { data: adminProfile, error: adminError } = await supabaseClient
      .from('clients')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (adminError || adminProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Accès refusé. Seul un administrateur peut usurper une identité.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Récupérer l'ID de l'utilisateur cible
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID utilisateur cible manquant.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Générer un jeton JWT pour l'utilisateur cible
    const { data: tokenData, error: tokenError } = await supabaseClient.auth.admin.generateUserByEmail(userId);
    
    if (tokenError) {
        // La méthode generateUserByEmail ne prend pas l'ID, mais l'email.
        // Je vais devoir récupérer l'email de l'utilisateur cible.
        const { data: targetProfile, error: targetError } = await supabaseClient
            .from('clients')
            .select('email')
            .eq('id', userId)
            .single();

        if (targetError || !targetProfile) {
             return new Response(JSON.stringify({ error: 'Utilisateur cible introuvable.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const { data: tokenDataFinal, error: tokenErrorFinal } = await supabaseClient.auth.admin.generateUserByEmail(targetProfile.email);
        
        if (tokenErrorFinal) {
            return new Response(JSON.stringify({ error: 'Échec de la génération du jeton pour l\'utilisateur cible.', details: tokenErrorFinal.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ token: tokenDataFinal.token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ token: tokenData.token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
