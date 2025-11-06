import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PWAConfig {
  icon_192: string;
  icon_512: string;
  name: string;
  short_name: string;
  theme_color: string;
  background_color: string;
}

interface Manifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose: string;
  }>;
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Récupérer la configuration PWA depuis la base de données
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'pwa_config')
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      throw error;
    }

    const config = data?.value as PWAConfig;

    // Construire le manifeste
    const manifest: Manifest = {
      name: config.name || 'Virtus',
      short_name: config.short_name || 'Virtus',
      description: 'Your personal fitness coaching companion.',
      start_url: '/index.html',
      display: 'standalone',
      background_color: config.background_color || '#121212',
      theme_color: config.theme_color || '#7A68FA',
      icons: [
        {
          src: config.icon_192,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: config.icon_512,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    // Retourner le manifeste avec les en-têtes appropriés
    return new Response(JSON.stringify(manifest, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache d'1 heure
      },
    });
  } catch (error) {
    console.error('Erreur dans generate-manifest:', error);
    
    // En cas d'erreur, retourner un manifeste par défaut
    const defaultManifest: Manifest = {
      name: 'Virtus',
      short_name: 'Virtus',
      description: 'Your personal fitness coaching companion.',
      start_url: '/index.html',
      display: 'standalone',
      background_color: '#121212',
      theme_color: '#7A68FA',
      icons: [
        {
          src: 'https://cdn-icons-png.flaticon.com/512/3043/3043222.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: 'https://cdn-icons-png.flaticon.com/512/3043/3043222.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    return new Response(JSON.stringify(defaultManifest, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache court en cas d'erreur
      },
      status: 200, // Toujours retourner 200 pour ne pas casser l'installation PWA
    });
  }
});
