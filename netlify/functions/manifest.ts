import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export const handler: Handler = async (event, context) => {
  try {
    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer la configuration PWA depuis la base de données
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'pwa_config')
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la config PWA:', error);
      // Retourner un manifest par défaut en cas d'erreur
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache 1 heure
        },
        body: JSON.stringify({
          name: 'Virtus',
          short_name: 'Virtus',
          description: 'Your personal fitness coaching companion.',
          start_url: '/',
          display: 'standalone',
          background_color: '#121212',
          theme_color: '#7A68FA',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/3043/3043222.png',
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
        }),
      };
    }

    const config = data?.value || {};

    // Construire le manifest avec les données de la base
    const manifest = {
      name: config.name || 'Virtus',
      short_name: config.short_name || 'Virtus',
      description: 'Your personal fitness coaching companion.',
      start_url: '/',
      display: 'standalone',
      background_color: config.background_color || '#121212',
      theme_color: config.theme_color || '#7A68FA',
      icons: [
        {
          src: config.icon_192 || 'https://cdn-icons-png.flaticon.com/512/3043/3043222.png',
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache 1 heure
      },
      body: JSON.stringify(manifest),
    };
  } catch (error) {
    console.error('Erreur dans la fonction manifest:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
