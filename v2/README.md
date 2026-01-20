# IronTrack V2 - Interface de Suivi d'Entraînement

## Description

IronTrack V2 est une interface de suivi d'entraînement optimisée pour mobile, avec un design moderne et des interactions fluides.

## Fonctionnalités

### ✅ Implémentées

- **Cylindre de séries** : Navigation 3D fluide entre les séries d'exercices
- **Sélection poids/reps via modal** : Cylindres de sélection qui s'ouvrent au clic sur les valeurs
- **Barre d'action** : 4 boutons (Chrono, Rec, Notes, Drop Set)
- **Modal technique d'intensification** : Affichage des techniques (Drop Set, etc.)
- **Design responsive** : Adapté automatiquement mobile/desktop
- **Animations** : Transitions fluides et effets 3D

### 🎨 Design

- **Couleurs** : Zinc/noir avec accents violet et orange
- **Typographie** : Font-black, uppercase, tracking serré
- **Effets** : Blur, gradients, shadows, 3D transforms

## Structure des fichiers

```
v2/
├── components/
│   └── irontrack/
│       ├── NumberPicker.tsx       # Cylindre de sélection numérique
│       ├── RestTimer.tsx          # Timer de repos
│       ├── SetRow.tsx             # Carte d'une série
│       ├── SetWheel.tsx           # Cylindre de navigation des séries
│       └── irontrack-types.ts     # Types TypeScript
└── pages/
    └── demo/
        └── IronTrackDemo.tsx      # Page principale de démo
```

## Utilisation

### Route

```
/demo/irontrack
```

### Intégration

Le composant est déjà intégré dans `src/App.tsx` avec la route `/demo/irontrack`.

## Optimisations Mobile

- Hauteur responsive avec `calc(100vh - XXXpx)`
- Media queries pour mobile vs desktop
- Bouton LOG SET toujours visible
- Cylindres poids/reps en modal pour gagner de l'espace

## Technologies

- React + TypeScript
- Tailwind CSS
- Lucide React (icônes)
- Vite

## Prochaines étapes

- [ ] Connecter à Supabase pour données réelles
- [ ] Implémenter la logique métier complète
- [ ] Ajouter les techniques d'intensification fonctionnelles
- [ ] Intégrer le chronomètre et l'enregistrement vidéo
- [ ] Tests et optimisations de performance

---

**Version** : 2.0  
**Date** : Janvier 2026  
**Statut** : Prototype fonctionnel
