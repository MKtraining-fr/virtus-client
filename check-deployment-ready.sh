#!/bin/bash

# Script de vérification pré-déploiement
# Vérifie que tous les prérequis sont remplis avant de déployer sur Netlify

echo "🔍 Vérification de la préparation au déploiement..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0
SUCCESS=0

# Fonction de vérification
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((ERRORS++))
    fi
}

check_warning() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠️  $1${NC}"
        ((WARNINGS++))
    fi
}

# 1. Vérifier que Node.js est installé
echo "📦 Vérification de l'environnement..."
node --version > /dev/null 2>&1
check "Node.js installé"

npm --version > /dev/null 2>&1
check "npm installé"

# 2. Vérifier que les dépendances sont installées
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules présent${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ node_modules manquant - Exécutez 'npm install'${NC}"
    ((ERRORS++))
fi

# 3. Vérifier que netlify.toml existe
echo ""
echo "📝 Vérification des fichiers de configuration..."
if [ -f "netlify.toml" ]; then
    echo -e "${GREEN}✅ netlify.toml présent${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ netlify.toml manquant${NC}"
    ((ERRORS++))
fi

# 4. Vérifier que public/_redirects existe
if [ -f "public/_redirects" ]; then
    echo -e "${GREEN}✅ public/_redirects présent${NC}"
    ((SUCCESS++))
else
    echo -e "${RED}❌ public/_redirects manquant${NC}"
    ((ERRORS++))
fi

# 5. Vérifier que .env existe (pour le développement local)
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env présent${NC}"
    ((SUCCESS++))
    
    # Vérifier que les variables Supabase sont définies
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✅ Variables Supabase définies dans .env${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ Variables Supabase manquantes dans .env${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠️  .env manquant (optionnel pour le déploiement)${NC}"
    ((WARNINGS++))
fi

# 6. Vérifier qu'il n'y a pas de références à localhost
echo ""
echo "🔍 Vérification des dépendances locales..."
if grep -r "localhost\|127\.0\.0\.1" src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "xmlns" > /dev/null 2>&1; then
    echo -e "${RED}❌ Références à localhost trouvées dans le code${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Aucune référence à localhost${NC}"
    ((SUCCESS++))
fi

# 7. Vérifier qu'il n'y a pas de références à Firebase
if grep -r "firebase\|FIREBASE" src --include="*.ts" --include="*.tsx" | grep -v "node_modules" > /dev/null 2>&1; then
    echo -e "${RED}❌ Références à Firebase trouvées dans le code${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Aucune référence à Firebase${NC}"
    ((SUCCESS++))
fi

# 8. Vérifier que mockData.ts n'existe plus
if [ -f "src/data/mockData.ts" ]; then
    echo -e "${RED}❌ mockData.ts existe encore${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ mockData.ts supprimé${NC}"
    ((SUCCESS++))
fi

# 9. Tester le build
echo ""
echo "🏗️  Test du build de production..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build réussi${NC}"
    ((SUCCESS++))
    
    # Vérifier que dist existe
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ Dossier dist créé${NC}"
        ((SUCCESS++))
        
        # Vérifier que index.html existe
        if [ -f "dist/index.html" ]; then
            echo -e "${GREEN}✅ dist/index.html présent${NC}"
            ((SUCCESS++))
        else
            echo -e "${RED}❌ dist/index.html manquant${NC}"
            ((ERRORS++))
        fi
        
        # Vérifier que _redirects est copié
        if [ -f "dist/_redirects" ]; then
            echo -e "${GREEN}✅ dist/_redirects présent${NC}"
            ((SUCCESS++))
        else
            echo -e "${RED}❌ dist/_redirects manquant${NC}"
            ((ERRORS++))
        fi
    else
        echo -e "${RED}❌ Dossier dist non créé${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌ Build échoué - Vérifiez les erreurs TypeScript${NC}"
    ((ERRORS++))
fi

# 10. Vérifier la taille du build
if [ -d "dist" ]; then
    SIZE=$(du -sh dist | cut -f1)
    echo -e "${GREEN}✅ Taille du build: $SIZE${NC}"
    ((SUCCESS++))
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé de la vérification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Succès: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNINGS${NC}"
echo -e "${RED}❌ Erreurs: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Votre application est prête pour le déploiement !${NC}"
    echo ""
    echo "Prochaines étapes :"
    echo "1. Pousser le code sur GitHub : git push origin main"
    echo "2. Créer un site sur Netlify : https://app.netlify.com"
    echo "3. Configurer les variables d'environnement dans Netlify"
    echo "4. Déployer !"
    echo ""
    echo "📚 Consultez DEPLOIEMENT_NETLIFY.md pour les instructions détaillées"
    exit 0
else
    echo -e "${RED}❌ Des erreurs ont été détectées. Corrigez-les avant de déployer.${NC}"
    exit 1
fi
