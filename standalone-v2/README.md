# Virtus Client v2 - Application Standalone

Application cliente v2 complète avec dashboard et navigation multi-pages.

## 🎨 Design System

- **Couleur principale** : Violet #6D5DD3
- **Fond** : Noir/Gris foncé
- **Accents** : Orange, Vert, Bleu, Rouge
- **Typographie** : Inter, SF Pro, Roboto

## 📦 Structure

```
standalone-v2/
├── src/
│   ├── components/dashboard/    # Composants du dashboard
│   ├── layouts/                 # Layout principal avec navigation
│   ├── pages/                   # Pages de l'application
│   ├── App.tsx                  # Configuration des routes
│   ├── main.tsx                 # Point d'entrée
│   └── index.css                # Styles globaux
├── public/                      # Assets statiques
├── index.html                   # HTML principal
├── vite.config.ts              # Configuration Vite
├── tailwind.config.js          # Configuration Tailwind CSS
└── package.json                # Dépendances

```

## 🚀 Installation

```bash
cd standalone-v2
pnpm install
```

## 🛠️ Développement

```bash
pnpm dev
```

## 📦 Build

```bash
pnpm build
```

## 📄 Pages

1. **Dashboard** - Vue d'ensemble avec KPIs, graphiques, activités
2. **Entraînement** - Gestion des séances (IronTrack v2 à intégrer)
3. **Nutrition** - Suivi nutritionnel
4. **Bibliothèque** - Ressources et contenus
5. **Messages** - Communication avec le coach
6. **Shop** - Boutique
7. **Profil** - Paramètres et informations personnelles

## 🎯 Composants Dashboard

- **KPICard** - Cartes de métriques clés avec tendances
- **ProgressChart** - Graphiques de progression (bar/line)
- **ActivityCard** - Liste des activités récentes
- **QuickActionCard** - Actions rapides
- **StreakCard** - Série d'entraînements consécutifs
- **NextWorkoutCard** - Prochain entraînement prévu

## 🔧 Technologies

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 3.4
- React Router 7
- Lucide React (icônes)

## 📝 Notes

- Front-end uniquement avec données mockées
- Isolation complète du projet principal
- Prêt pour déploiement Cloudflare Pages
