# Recherche: Solutions pour Corps Humain Interactif

## Objectif
Ajouter une sous-section "Blessures et douleurs chroniques" dans la section médicale du bilan initial avec un corps humain interactif.

## Solutions Identifiées

### 1. react-body-highlighter (RECOMMANDÉ)
- **URL**: https://github.com/giavinh79/react-body-highlighter
- **NPM**: react-body-highlighter
- **Stars**: 33
- **Licence**: MIT
- **Avantages**:
  - Composant React natif
  - SVG léger et performant
  - Support anterior/posterior (vue de face/dos)
  - Zones musculaires cliquables
  - Callback onClick avec données
  - Personnalisation des couleurs
  - Minimal dependencies
- **Zones supportées**:
  - Dos: trapezius, upper-back, lower-back
  - Poitrine: chest
  - Bras: biceps, triceps, forearm, back-deltoids, front-deltoids
  - Abdos: abs, obliques
  - Jambes: adductor, hamstring, quadriceps, abductors, calves, gluteal
  - Tête: head, neck

### 2. reactjs-human-body
- **URL**: https://github.com/mariohmol/reactjs-human-body
- **NPM**: reactjs-human-body
- **Stars**: 6
- **Licence**: MIT
- **Avantages**:
  - Support modèle masculin/féminin
  - Parties du corps cliquables
  - Callback onChange/onClick
- **Inconvénients**:
  - Moins de zones détaillées
  - Moins maintenu

### 3. BioDigital Human API
- **URL**: https://developer.biodigital.com/
- **Avantages**:
  - 3D complet avec dissection par couches
  - Modèles anatomiques professionnels
  - Support iOS/Android/Web
- **Inconvénients**:
  - Service payant (enterprise)
  - Nécessite compte développeur
  - Complexité d'intégration

### 4. Three.js + Modèles 3D
- **Avantages**:
  - Contrôle total sur le rendu 3D
  - Possibilité de dissection par couches
- **Inconvénients**:
  - Développement complexe
  - Nécessite modèles 3D (Sketchfab, etc.)
  - Performance à gérer

## Recommandation

**Solution principale**: `react-body-highlighter`
- Intégration facile avec React existant
- Léger et performant
- Suffisant pour identifier les zones de blessures/douleurs
- Open source et gratuit

**Approche proposée**:
1. Utiliser react-body-highlighter pour la sélection de zones
2. Créer une modale avec vue anterior + posterior
3. Permettre le clic sur les zones pour ouvrir un formulaire de détails
4. Stocker les blessures/douleurs par zone dans le bilan

## Structure de données proposée

```typescript
interface InjuryData {
  id: string;
  bodyPart: string; // ex: 'chest', 'lower-back', etc.
  type: 'injury' | 'chronic_pain';
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  since?: string; // date
  notes?: string;
}

interface MedicalInfo {
  history: string;
  allergies: string;
  injuries: InjuryData[]; // NOUVEAU
}
```
