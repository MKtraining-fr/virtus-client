#!/bin/bash

echo "🚀 Script de commit de la migration Supabase"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet Virtus"
    exit 1
fi

echo "📋 Étape 1/9 : Mise à jour de .gitignore"
git add .gitignore
git commit -m "chore: mise à jour .gitignore pour exclure les fichiers sensibles"

echo ""
echo "📚 Étape 2/9 : Documentation"
git add GUIDE_MIGRATION_SUPABASE.md PROCHAINES_ETAPES.md SCRIPTS_UTILITAIRES.md GUIDE_COMMIT_GIT.md
git commit -m "docs: ajout de la documentation de migration Supabase"

echo ""
echo "🗄️ Étape 3/9 : Schéma et types"
git add supabase/ src/types/
git commit -m "feat: ajout du schéma PostgreSQL et des types Supabase"

echo ""
echo "⚙️ Étape 4/9 : Nouveaux services"
git add src/services/supabase.ts src/services/dataService.ts src/services/typeMappers.ts
git commit -m "feat: ajout des services Supabase"

echo ""
echo "🔐 Étape 5/9 : Migration de l'authentification"
git add src/services/authService.ts src/context/AuthContext.tsx
git commit -m "feat: migration de l'authentification vers Supabase"

echo ""
echo "📦 Étape 6/9 : Configuration"
git add package.json package-lock.json .env.example
git commit -m "chore: mise à jour des dépendances pour Supabase"

echo ""
echo "🧹 Étape 7/9 : Suppression des fichiers Firebase"
git rm -f src/services/firebase.ts firestore.rules firestore.indexes.json DEPLOIEMENT_FIRESTORE_RULES.md pages/ClientProfile.tsx 2>/dev/null || true
git commit -m "chore: suppression des fichiers Firebase obsolètes" || echo "   (Aucun fichier à supprimer)"

echo ""
echo "🛠️ Étape 8/9 : Script utilitaire"
git add create-admin.js
git commit -m "feat: ajout du script de création d'administrateur"

echo ""
echo "✅ Tous les commits sont prêts!"
echo ""
echo "📤 Étape 9/9 : Push vers GitHub"
read -p "Voulez-vous pousser vers GitHub maintenant ? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]
then
    git push origin main
    echo "✨ Migration commitée et poussée avec succès!"
else
    echo "ℹ️  Vous pouvez pousser manuellement avec: git push origin main"
fi
