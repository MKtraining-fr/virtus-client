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
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true,
      },
    },
    
    // Chunking stratégique pour un meilleur caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    
    // Optimisation des assets
    assetsInlineLimit: 4096, // Inline les assets < 4kb
    chunkSizeWarningLimit: 1000, // Warning si chunk > 1000kb
  },

  // Optimisation du serveur de développement
  server: {
    port: 5173,
    open: true,
    watch: {
      ignored: ["**/node_modules/**"],
    },
  },

  // Optimisation des dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
  },
});
