#!/bin/bash

# Script de déploiement de l'Edge Function generate-manifest
# Ce script nécessite que la CLI Supabase soit installée et configurée

echo "🚀 Déploiement de l'Edge Function generate-manifest..."

# Vérifier si la CLI Supabase est installée
if ! command -v supabase &> /dev/null; then
    echo "❌ La CLI Supabase n'est pas installée."
    echo "📦 Installation de la CLI Supabase..."
    
    # Installer la CLI Supabase
    brew install supabase/tap/supabase 2>/dev/null || \
    npm install -g supabase 2>/dev/null || \
    (echo "⚠️  Veuillez installer la CLI Supabase manuellement: https://supabase.com/docs/guides/cli" && exit 1)
fi

# Se connecter à Supabase (si pas déjà connecté)
echo "🔐 Vérification de l'authentification..."
supabase login 2>/dev/null || echo "⚠️  Veuillez vous connecter à Supabase avec 'supabase login'"

# Lier le projet
echo "🔗 Liaison avec le projet Supabase..."
supabase link --project-ref dqsbfnsicmzovlrhuoif

# Déployer l'Edge Function
echo "📤 Déploiement de l'Edge Function..."
supabase functions deploy generate-manifest

echo "✅ Déploiement terminé!"
echo "🌐 URL de l'Edge Function: https://dqsbfnsicmzovlrhuoif.supabase.co/functions/v1/generate-manifest"
