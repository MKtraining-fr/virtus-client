# Guide de Déploiement - Virtus

Ce guide vous accompagne dans le déploiement de l'application Virtus sur **Vercel**, une plateforme d'hébergement moderne et performante pour les applications React.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration Firebase](#configuration-firebase)
3. [Déploiement sur Vercel](#déploiement-sur-vercel)
4. [Configuration des Variables d'Environnement](#configuration-des-variables-denvironnement)
5. [Déploiement des Règles Firestore](#déploiement-des-règles-firestore)
6. [Vérification du Déploiement](#vérification-du-déploiement)
7. [Domaine Personnalisé](#domaine-personnalisé-optionnel)
8. [Déploiements Continus](#déploiements-continus)

---

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir :

- Un compte **Firebase** avec un projet configuré
- Un compte **Vercel** (gratuit : https://vercel.com)
- Un compte **GitHub** avec le repository Virtus
- Les clés Firebase de votre projet

---

## 🔥 Configuration Firebase

### 1. Activer l'Authentification

Dans la console Firebase (https://console.firebase.google.com) :

1. Sélectionnez votre projet
2. Allez dans **Authentication** > **Sign-in method**
3. Activez **Email/Password**
4. Configurez les templates d'emails (optionnel mais recommandé)

### 2. Créer la Base de Données Firestore

1. Allez dans **Firestore Database**
2. Cliquez sur **Create database**
3. Choisissez le mode **Production**
4. Sélectionnez une région proche de vos utilisateurs (ex: europe-west1)

### 3. Récupérer les Clés Firebase

1. Allez dans **Project Settings** (icône engrenage)
2. Descendez jusqu'à **Your apps**
3. Si vous n'avez pas d'app web, cliquez sur **Add app** > **Web**
4. Copiez les valeurs de configuration :

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

---

## 🚀 Déploiement sur Vercel

### Méthode 1 : Déploiement via l'Interface Vercel (Recommandé)

**Étape 1 : Importer le Projet**

1. Allez sur https://vercel.com et connectez-vous
2. Cliquez sur **Add New** > **Project**
3. Importez votre repository GitHub `MKtraining-fr/virtus`
4. Vercel détectera automatiquement que c'est un projet Vite

**Étape 2 : Configurer le Projet**

Vercel devrait détecter automatiquement les paramètres suivants :

| Paramètre | Valeur |
|-----------|--------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Si ce n'est pas le cas, configurez-les manuellement.

**Étape 3 : Configurer les Variables d'Environnement**

Avant de déployer, ajoutez vos variables d'environnement Firebase (voir section suivante).

**Étape 4 : Déployer**

1. Cliquez sur **Deploy**
2. Attendez que le build se termine (2-3 minutes)
3. Votre application sera disponible sur une URL du type `virtus-xxx.vercel.app`

### Méthode 2 : Déploiement via CLI

**Installation de la CLI Vercel**

```bash
npm install -g vercel
```

**Connexion à Vercel**

```bash
vercel login
```

**Déploiement**

```bash
# Depuis le dossier du projet
cd virtus

# Premier déploiement
vercel

# Suivez les instructions :
# - Set up and deploy? Yes
# - Which scope? Votre compte
# - Link to existing project? No
# - Project name? virtus
# - In which directory is your code located? ./
# - Want to override the settings? No

# Déploiement en production
vercel --prod
```

---

## 🔐 Configuration des Variables d'Environnement

### Via l'Interface Vercel

1. Allez dans votre projet sur Vercel
2. Cliquez sur **Settings** > **Environment Variables**
3. Ajoutez les variables suivantes :

| Nom | Valeur | Environnement |
|-----|--------|---------------|
| `VITE_FIREBASE_API_KEY` | Votre clé API Firebase | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | Votre domaine d'authentification | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | Votre ID de projet | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | Votre bucket de stockage | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Votre ID d'expéditeur | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | Votre ID d'application | Production, Preview, Development |
| `VITE_FIREBASE_MEASUREMENT_ID` | Votre ID de mesure (optionnel) | Production, Preview, Development |

**Important** : Cochez les trois environnements (Production, Preview, Development) pour chaque variable.

### Via la CLI

```bash
# Ajouter une variable
vercel env add VITE_FIREBASE_API_KEY

# Suivez les instructions pour entrer la valeur et sélectionner les environnements
```

### Redéployer Après Ajout des Variables

Après avoir ajouté les variables d'environnement, redéployez l'application :

- **Via l'interface** : Allez dans **Deployments** > Cliquez sur les trois points du dernier déploiement > **Redeploy**
- **Via la CLI** : `vercel --prod`

---

## 🔒 Déploiement des Règles Firestore

Les règles de sécurité Firestore doivent être déployées séparément.

### Installation de Firebase CLI

```bash
npm install -g firebase-tools
```

### Connexion à Firebase

```bash
firebase login
```

### Initialisation du Projet (si pas déjà fait)

```bash
cd virtus
firebase init

# Sélectionnez :
# - Firestore
# - Utilisez le projet Firebase existant
# - Firestore rules file: firestore.rules
# - Firestore indexes file: firestore.indexes.json
```

### Déploiement des Règles

```bash
# Déployer uniquement les règles Firestore
firebase deploy --only firestore:rules

# Déployer les règles et les index
firebase deploy --only firestore
```

### Vérification

1. Allez dans la console Firebase
2. Ouvrez **Firestore Database** > **Rules**
3. Vérifiez que les règles sont bien déployées

---

## ✅ Vérification du Déploiement

Une fois le déploiement terminé, vérifiez que tout fonctionne :

### Tests de Base

1. **Page d'accueil** : Ouvrez l'URL de votre application
2. **Inscription** : Créez un nouveau compte
3. **Connexion** : Connectez-vous avec le compte créé
4. **Navigation** : Testez la navigation entre les différentes pages
5. **Fonctionnalités** : Testez les fonctionnalités principales

### Tests de Performance

Utilisez **Lighthouse** pour vérifier les performances :

1. Ouvrez Chrome DevTools (F12)
2. Allez dans l'onglet **Lighthouse**
3. Lancez un audit complet
4. Vérifiez les scores (objectif : >90 pour Performance, Accessibility, Best Practices)

### Tests de Sécurité

1. Vérifiez que les règles Firestore sont actives
2. Testez l'accès aux données sans authentification (devrait être refusé)
3. Vérifiez que les utilisateurs ne peuvent accéder qu'à leurs propres données

---

## 🌐 Domaine Personnalisé (Optionnel)

### Ajouter un Domaine

1. Allez dans votre projet Vercel
2. Cliquez sur **Settings** > **Domains**
3. Cliquez sur **Add**
4. Entrez votre domaine (ex: `virtus.votredomaine.com`)
5. Suivez les instructions pour configurer les DNS

### Configuration DNS

Ajoutez un enregistrement CNAME chez votre registrar :

| Type | Nom | Valeur |
|------|-----|--------|
| CNAME | virtus | cname.vercel-dns.com |

Ou pour un domaine racine, ajoutez un enregistrement A :

| Type | Nom | Valeur |
|------|-----|--------|
| A | @ | 76.76.21.21 |

### Certificat SSL

Vercel génère automatiquement un certificat SSL gratuit via Let's Encrypt. Attendez quelques minutes après la configuration DNS.

---

## 🔄 Déploiements Continus

Vercel déploie automatiquement votre application à chaque push sur GitHub.

### Branches et Environnements

| Branche | Environnement | URL |
|---------|---------------|-----|
| `main` | Production | `virtus.vercel.app` ou votre domaine |
| Autres branches | Preview | `virtus-xxx-branch.vercel.app` |

### Pull Requests

Chaque Pull Request génère automatiquement un déploiement de preview, permettant de tester les changements avant de les merger.

### Annuler un Déploiement

Si un déploiement pose problème :

1. Allez dans **Deployments**
2. Trouvez un déploiement précédent fonctionnel
3. Cliquez sur les trois points > **Promote to Production**

---

## 🐛 Dépannage

### Le Build Échoue

**Erreur de compilation TypeScript**

```bash
# Vérifiez localement
npm run type-check

# Corrigez les erreurs et poussez
```

**Dépendances manquantes**

```bash
# Vérifiez package.json
# Assurez-vous que toutes les dépendances sont listées
```

### L'Application ne Se Connecte pas à Firebase

1. Vérifiez que toutes les variables d'environnement sont configurées
2. Vérifiez que les valeurs sont correctes (pas d'espaces, de guillemets)
3. Redéployez après avoir modifié les variables

### Erreurs 404

Si vous obtenez des erreurs 404 sur les routes :

1. Vérifiez que `vercel.json` contient la configuration de rewrites
2. Redéployez l'application

### Règles Firestore non Appliquées

```bash
# Redéployez les règles
firebase deploy --only firestore:rules

# Vérifiez dans la console Firebase
```

---

## 📊 Monitoring

### Vercel Analytics

Activez Vercel Analytics pour suivre les performances :

1. Allez dans **Analytics** dans votre projet Vercel
2. Activez **Web Analytics**
3. Les données seront disponibles après quelques heures

### Firebase Analytics

Firebase Analytics est automatiquement activé si vous avez configuré `measurementId`.

---

## 🎉 Félicitations !

Votre application Virtus est maintenant déployée en production ! Elle est accessible 24/7, sécurisée, et se met à jour automatiquement à chaque push sur GitHub.

---

**Date de création :** 4 octobre 2025  
**Auteur :** Manus AI
