# Virtus - Plateforme de Coaching Sportif

Application web complète de gestion de coaching sportif et nutritionnel.

## Fonctionnalités

- **Gestion multi-rôles** : Admin, Coach, Client
- **Programmes d'entraînement** : Création et suivi de programmes personnalisés
- **Plans nutritionnels** : Gestion de plans alimentaires et suivi des macros
- **Messagerie** : Communication entre coachs et clients
- **Bilans** : Système de questionnaires et suivi de progression
- **Bibliothèque d'exercices** : Base de données complète d'exercices
- **Suivi des performances** : Historique et statistiques détaillées

## Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn

## Installation

1. Cloner le repository :
   ```bash
   git clone https://github.com/MKtraining-fr/Virtus.git
   cd virtus
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer Firebase :
   - Créer un fichier `.env.local` à la racine du projet
   - Ajouter vos variables d'environnement Firebase :
     ```
     VITE_FIREBASE_API_KEY=votre_api_key
     VITE_FIREBASE_AUTH_DOMAIN=votre_auth_domain
     VITE_FIREBASE_PROJECT_ID=votre_project_id
     VITE_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
     VITE_FIREBASE_APP_ID=votre_app_id
     ```

4. Lancer l'application en mode développement :
   ```bash
   npm run dev
   ```

5. Construire pour la production :
   ```bash
   npm run build
   ```

## Structure du projet

```
virtus/
├── src/
│   ├── components/     # Composants réutilisables
│   ├── pages/          # Pages de l'application
│   ├── layouts/        # Layouts par rôle
│   ├── services/       # Services (Firebase, génération)
│   ├── context/        # Contextes React
│   ├── data/           # Données statiques
│   ├── hooks/          # Hooks personnalisés
│   ├── constants/      # Constantes et configuration
│   └── types.ts        # Types TypeScript
├── public/             # Fichiers statiques
└── package.json
```

## Technologies utilisées

- **React 19** avec TypeScript
- **Vite** pour le build
- **React Router** pour la navigation
- **Firebase** pour la base de données et l'authentification
- **CSS personnalisé** pour le styling

## Licence

Propriétaire - MKtraining-fr
