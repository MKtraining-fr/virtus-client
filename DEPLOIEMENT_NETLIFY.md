# Guide de Déploiement sur Netlify

## 📋 Prérequis

Avant de déployer sur Netlify, assurez-vous d'avoir :

1. ✅ Un compte Netlify (gratuit sur https://netlify.com)
2. ✅ Un projet Supabase configuré avec les tables nécessaires
3. ✅ Les clés d'API Supabase (URL et Anon Key)
4. ✅ Le code source sur GitHub/GitLab (recommandé) ou en local

---

## 🚀 Méthode 1 : Déploiement via GitHub (Recommandé)

### Étape 1 : Pousser le code sur GitHub

```bash
# Si ce n'est pas déjà fait
git init
git add .
git commit -m "Prêt pour déploiement Netlify"
git branch -M main
git remote add origin https://github.com/votre-username/virtus.git
git push -u origin main
```

### Étape 2 : Connecter Netlify à GitHub

1. Aller sur https://app.netlify.com
2. Cliquer sur **"Add new site"** → **"Import an existing project"**
3. Choisir **"GitHub"** et autoriser l'accès
4. Sélectionner le repository **virtus**

### Étape 3 : Configurer le Build

Netlify détectera automatiquement la configuration depuis `netlify.toml`, mais vérifiez :

- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Node version** : `22.13.0` (défini dans netlify.toml)

### Étape 4 : Configurer les Variables d'Environnement

1. Dans Netlify, aller dans **Site settings** → **Environment variables**
2. Cliquer sur **"Add a variable"**
3. Ajouter les variables suivantes :

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://votre-projet.supabase.co` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Clé anonyme Supabase |

**⚠️ Important** : Ces variables sont **obligatoires** pour que l'application fonctionne.

### Étape 5 : Déployer

1. Cliquer sur **"Deploy site"**
2. Attendre la fin du build (environ 2-3 minutes)
3. Votre site sera disponible sur une URL du type : `https://random-name-123456.netlify.app`

---

## 🚀 Méthode 2 : Déploiement via Netlify CLI

### Installation

```bash
npm install -g netlify-cli
```

### Connexion

```bash
netlify login
```

### Initialisation

```bash
cd /path/to/virtus
netlify init
```

Suivez les instructions :
- **Create & configure a new site** → Oui
- **Team** : Choisir votre équipe
- **Site name** : virtus (ou un nom disponible)

### Configuration des Variables

```bash
# Ajouter les variables d'environnement
netlify env:set VITE_SUPABASE_URL "https://votre-projet.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "votre-cle-anon"
```

### Déploiement

```bash
# Build et déploiement
netlify deploy --prod
```

---

## 🚀 Méthode 3 : Déploiement Manuel (Drag & Drop)

### Étape 1 : Build Local

```bash
npm run build
```

Cela créera un dossier `dist/` avec les fichiers de production.

### Étape 2 : Configurer les Variables d'Environnement

**⚠️ Attention** : Avec cette méthode, vous devez créer un fichier `.env.production` :

```bash
# .env.production
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

Puis rebuild :

```bash
npm run build
```

### Étape 3 : Upload sur Netlify

1. Aller sur https://app.netlify.com
2. Cliquer sur **"Add new site"** → **"Deploy manually"**
3. Glisser-déposer le dossier `dist/` dans la zone de drop

---

## ✅ Vérification Post-Déploiement

### 1. Tester l'Authentification

1. Aller sur votre site Netlify
2. Cliquer sur **"Connexion"**
3. Essayer de se connecter avec un compte existant
4. ✅ La connexion doit fonctionner

### 2. Tester la Création de Données

1. Se connecter en tant que coach
2. Créer un programme d'entraînement
3. Rafraîchir la page (F5)
4. ✅ Le programme doit toujours être visible

### 3. Tester la Messagerie

1. Envoyer un message à un client
2. Rafraîchir la page
3. ✅ Le message doit être visible

### 4. Vérifier les Erreurs

1. Ouvrir la console du navigateur (F12)
2. Vérifier qu'il n'y a pas d'erreurs en rouge
3. ✅ Aucune erreur de connexion Supabase

---

## 🔧 Configuration Avancée

### Nom de Domaine Personnalisé

1. Dans Netlify, aller dans **Domain settings**
2. Cliquer sur **"Add custom domain"**
3. Suivre les instructions pour configurer le DNS

### HTTPS (Automatique)

Netlify active automatiquement HTTPS avec Let's Encrypt. Aucune configuration nécessaire.

### Redirections SPA

Déjà configuré dans `netlify.toml` :
- Toutes les routes redirigent vers `index.html` pour React Router

### Headers de Sécurité

Déjà configurés dans `netlify.toml` :
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

---

## 📊 Suivi et Monitoring

### Analytics Netlify

1. Dans Netlify, aller dans **Analytics**
2. Activer **Netlify Analytics** (payant, mais optionnel)

### Logs de Build

1. Dans Netlify, aller dans **Deploys**
2. Cliquer sur un déploiement pour voir les logs

### Logs d'Application

Les erreurs JavaScript sont visibles dans :
- Console du navigateur (F12)
- Sentry (si configuré)

---

## 🐛 Résolution de Problèmes

### Erreur : "VITE_SUPABASE_URL is not defined"

**Cause** : Variables d'environnement manquantes

**Solution** :
1. Aller dans **Site settings** → **Environment variables**
2. Vérifier que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définies
3. Redéployer le site

### Erreur 404 sur les routes

**Cause** : Redirections SPA mal configurées

**Solution** :
1. Vérifier que `netlify.toml` existe à la racine
2. Vérifier que `public/_redirects` existe
3. Redéployer

### Build Failed

**Cause** : Erreur de compilation TypeScript

**Solution** :
1. Vérifier les logs de build dans Netlify
2. Tester le build en local : `npm run build`
3. Corriger les erreurs TypeScript
4. Pousser les corrections sur GitHub

### Données ne s'affichent pas

**Cause** : Problème de connexion Supabase ou RLS

**Solution** :
1. Vérifier les variables d'environnement
2. Vérifier les politiques RLS dans Supabase
3. Voir `fix_rls_final.sql` pour corriger les politiques

---

## 🔄 Mises à Jour

### Déploiement Automatique (GitHub)

Avec la méthode GitHub, chaque push sur la branche `main` déclenche automatiquement un nouveau déploiement.

```bash
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main
```

### Déploiement Manuel (CLI)

```bash
npm run build
netlify deploy --prod
```

---

## 📚 Ressources

- [Documentation Netlify](https://docs.netlify.com/)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vite](https://vitejs.dev/)
- [Support Netlify](https://answers.netlify.com/)

---

## ✅ Checklist de Déploiement

Avant de déployer, vérifiez que :

- [ ] Le code compile sans erreur : `npm run build`
- [ ] Les variables d'environnement sont configurées dans Netlify
- [ ] Le fichier `netlify.toml` existe à la racine
- [ ] Le fichier `public/_redirects` existe
- [ ] Les tables Supabase sont créées (voir `supabase/schema.sql`)
- [ ] Les politiques RLS sont configurées (voir `fix_rls_final.sql`)
- [ ] Un utilisateur admin existe dans Supabase (voir `create-admin.js`)
- [ ] Les données de test sont supprimées (mockData.ts supprimé ✅)

---

## 🎉 Félicitations !

Votre application Virtus est maintenant déployée sur Netlify avec Supabase comme backend !

**URL de production** : `https://votre-site.netlify.app`

---

**Auteur** : Manus AI  
**Date** : 5 octobre 2025  
**Version** : 1.0
