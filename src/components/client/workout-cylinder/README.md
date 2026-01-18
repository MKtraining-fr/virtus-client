# Composants Workout Cylinder

Ce dossier contient tous les composants de la nouvelle interface de tracking avec cylindre 3D.

## 📁 Structure

```
workout-cylinder/
├── ActionButtons.tsx      # Boutons de validation (Terminer l'exercice, Suivant)
├── ExerciseHeader.tsx     # Header avec protocole et infos de l'exercice
├── RestTimer.tsx          # Timer de repos flottant circulaire
├── SetCard.tsx            # Card de série (composant de base avec animations 3D)
├── SetCardActive.tsx      # Contenu de la série active (inputs, boutons)
└── SetsCylinder.tsx       # Conteneur principal du cylindre avec gestures
```

## 🎯 Composants

### SetsCylinder.tsx

**Rôle:** Conteneur principal qui gère le cylindre 3D et les gestures verticaux.

**Props:**
- `exercise`: Exercice courant
- `previousPerformances`: Performances de la semaine dernière
- `loadUnit`: Unité de charge (kg, lbs, etc.)
- `onVideoClick`: Callback pour ouvrir la modal vidéo
- `onNotesClick`: Callback pour ouvrir la modal notes

**Fonctionnalités:**
- Swipe vertical pour changer de série
- Virtualization (render ±2 séries autour de l'active)
- Snap automatique sur chaque série
- Haptic feedback

### SetCard.tsx

**Rôle:** Card de série individuelle avec animations 3D.

**Props:**
- `setIndex`: Index de la série
- `totalSets`: Nombre total de séries
- `isActive`: Si la série est active
- `distance`: Distance par rapport à la série active
- `performanceData`: Données de performance
- `onSetClick`: Callback au clic
- `children`: Contenu personnalisé

**Animations:**
- Scale selon distance (1.0 → 0.6)
- Opacity selon distance (1.0 → 0.3)
- Rotation 3D (perspective)
- Spring physics

### SetCardActive.tsx

**Rôle:** Contenu de la série active avec inputs et boutons.

**Props:**
- `setIndex`: Index de la série
- `totalSets`: Nombre total de séries
- `performanceData`: Données actuelles
- `previousPerformance`: Performance précédente
- `recommendedLoad`: Charge recommandée
- `loadUnit`: Unité de charge
- `onUpdateData`: Callback pour mise à jour
- `onVideoClick`: Callback vidéo
- `onNotesClick`: Callback notes
- `onDropSetClick`: Callback Drop Set

**Contenu:**
- Header avec numéro de série
- Référence semaine dernière
- Inputs poids et reps (grands, centrés)
- Recommandation de charge
- Boutons d'action (Vidéo, Notes, Drop Set)

### ExerciseHeader.tsx

**Rôle:** Header fixe avec informations de l'exercice.

**Props:**
- `exercise`: Exercice courant
- `fullExerciseDetails`: Détails complets de l'exercice
- `onBack`: Callback retour
- `onOptionsClick`: Callback menu options
- `onVideoClick`: Callback vidéo démo
- `onAlternativesClick`: Callback mouvements alternatifs

**Contenu:**
- Titre de l'exercice
- Boutons retour et options
- Protocole (séries, reps, tempo, repos)
- Thumbnail vidéo (si disponible)
- Boutons "Voir vidéo" et "Alternatifs"

### RestTimer.tsx

**Rôle:** Timer de repos flottant avec progression circulaire.

**Props:**
- `isActive`: Si le timer est actif
- `duration`: Durée en secondes
- `onComplete`: Callback fin du timer
- `onStop`: Callback arrêt manuel

**Fonctionnalités:**
- Cercle de progression animé
- Affichage temps restant (mm:ss)
- Boutons Pause/Reprendre et Arrêter
- Vibration pattern à la fin
- Animation d'entrée/sortie

### ActionButtons.tsx

**Rôle:** Boutons de validation en bas de l'écran.

**Props:**
- `onComplete`: Callback terminer l'exercice
- `onNext`: Callback exercice suivant
- `isLastExercise`: Si c'est le dernier exercice
- `canComplete`: Si toutes les séries sont complétées

**Contenu:**
- Bouton principal "Terminer l'exercice" (orange)
- Bouton secondaire "Exercice suivant" (gris)
- Indicateur de progression

## 🎨 Styles

Tous les composants utilisent la nouvelle palette de couleurs définie dans `tailwind.config.js`.

**Couleurs principales:**
- `brand-primary`: #7b6df2 (violet)
- `accent-cyan`: #00D9FF (progression)
- `accent-orange`: #FF6B35 (actions)
- `accent-green`: #00FF88 (succès)
- `bg-primary`: #0A0E14 (fond)
- `bg-card`: #151922 (cards)

## 🔧 Utilisation

```tsx
import WorkoutCylinderView from './pages/client/workout/WorkoutCylinderView';

// La page principale gère l'orchestration de tous les composants
<Route path="workout/cylinder" element={<WorkoutCylinderView />} />
```

## 📝 Notes

- Tous les composants sont typés avec TypeScript
- Les animations utilisent Framer Motion
- Les gestures utilisent @use-gesture/react
- Le state est géré par Zustand (workoutStore)
