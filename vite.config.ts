import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Base URL pour le déploiement
  base: '/',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },

  build: {
    // Optimisation du build
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Garder les console.log pour le débogage
        drop_debugger: true,
      },
    },
    
    // Chunking stratégique pour un meilleur caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('chart.js') || id.includes('recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('@heroicons') || id.includes('lucide')) {
              return 'icons-vendor';
            }
            if (id.includes('@daily-co')) {
              return 'daily-vendor';
            }
            // Autres dépendances dans un chunk séparé
            return 'vendor';
          }
          
          // Séparer les layouts
          if (id.includes('/src/layouts/') || id.includes('/src/pages/')) {
            if (id.includes('Coach')) return 'coach';
            if (id.includes('Client')) return 'client';
            if (id.includes('Admin')) return 'admin';
          }
        },
      },
    },
    
    // Optimisation des assets
    assetsInlineLimit: 4096, // Inline les assets < 4kb
    chunkSizeWarningLimit: 500, // Warning si chunk > 500kb
    
    // Optimisations supplémentaires
    sourcemap: false, // Désactiver les sourcemaps en production
    cssCodeSplit: true, // Séparer le CSS en chunks
  },

  // Optimisation du serveur de développement
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    allowedHosts: true,
    watch: {
      ignored: ["**/node_modules/**"],
    },
  },

  // Optimisation des dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
  },
});
