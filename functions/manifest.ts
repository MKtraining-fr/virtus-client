// Cloudflare Pages Function pour générer le manifest.json dynamiquement
// https://developers.cloudflare.com/pages/platform/functions/

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

interface PWAConfig {
  icon_192?: string;
  icon_512?: string;
  name?: string;
  short_name?: string;
  theme_color?: string;
  background_color?: string;
}

export async function onRequest(context: { env: Env }): Promise<Response> {
  try {
    const { env } = context;
    
    // Récupérer la configuration PWA depuis Supabase
    const response = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/app_settings?key=eq.pwa_config&select=value`,
      {
        headers: {
          'apikey': env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let config: PWAConfig = {};

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0 && data[0].value) {
        config = data[0].value as PWAConfig;
      }
    } else {
      console.error('Erreur lors de la récupération de la config PWA:', response.statusText);
    }

    // Construire le manifest avec les données de la base ou les valeurs par défaut
    const manifest = {
      name: config.name || 'Virtus',
      short_name: config.short_name || 'Virtus',
      description: 'Your personal fitness coaching companion.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: config.background_color || '#F7F8FA',
      theme_color: config.theme_color || '#6D5DD3',
      icons: [
        {
          src: config.icon_192 || 'https://cdn-icons-png.flaticon.com/192/3043/3043222.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: config.icon_512 || 'https://cdn-icons-png.flaticon.com/512/3043/3043222.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    return new Response(JSON.stringify(manifest, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600', // Cache 1 heure
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Erreur dans la fonction manifest:', error);
    
    // Retourner un manifest par défaut en cas d'erreur
    const defaultManifest = {
      name: 'Virtus',
      short_name: 'Virtus',
      description: 'Your personal fitness coaching companion.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#F7F8FA',
      theme_color: '#6D5DD3',
      icons: [
        {
          src: 'https://cdn-icons-png.flaticon.com/192/3043/3043222.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: 'https://cdn-icons-png.flaticon.com/512/3043/3043222.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    return new Response(JSON.stringify(defaultManifest, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
