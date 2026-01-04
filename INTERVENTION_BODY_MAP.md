# Intervention #14 - Système de Blessures et Douleurs Chroniques avec Carte Corporelle Interactive (Janvier 2026)

**Date:** 4 janvier 2026  
**Type:** Nouvelle Fonctionnalité / Interface  
**Statut:** ✅ Implémenté  
**PR:** À créer

## Contexte

L'objectif était d'améliorer la section "Antécédents et Notes Coach" du bilan initial en ajoutant une sous-section permettant d'enregistrer les blessures et douleurs chroniques des clients via une carte corporelle interactive.

### Demande Initiale

Le coach souhaitait pouvoir :
- Visualiser un corps humain interactif (idéalement 3D avec dissection par couches)
- Cliquer sur des zones anatomiques pour y associer des blessures/douleurs
- Enregistrer les informations de manière structurée dans le profil client

## Recherche et Analyse

### Solutions Évaluées

| Solution | Type | Avantages | Inconvénients | Coût |
| :--- | :--- | :--- | :--- | :--- |
| **react-body-highlighter** | SVG 2D | Léger, React natif, zones musculaires cliquables | Pas de 3D | Gratuit (MIT) |
| **BioDigital Human API** | 3D complet | Dissection par couches, modèles professionnels | Complexe | Enterprise (payant) |
| **Zygote Body** | 3D | Modèles anatomiques détaillés | Licence requise | Payant |
| **Three.js + modèles** | 3D custom | Contrôle total | Développement très complexe | Variable |

### Solution Retenue

**react-body-highlighter** a été choisi pour sa simplicité d'intégration, sa légèreté et son adéquation avec les besoins fonctionnels (identification des zones de blessures sans nécessité de dissection anatomique).

## Implémentation

### Fichiers Créés

| Fichier | Description |
| :--- | :--- |
| `src/components/coach/BodyMapModal.tsx` | Modale principale avec corps humain interactif et gestion des blessures |
| `src/types.ts` (ajouts) | Types `InjuryData`, `BodyPart`, `InjuryType`, `InjurySeverity`, `InjuryStatus`, `MedicalInfoExtended` |

### Fichiers Modifiés

| Fichier | Modification |
| :--- | :--- |
| `src/pages/NewBilan.tsx` | Ajout de la sous-section "Blessures et Douleurs Chroniques" dans la section medical |
| `package.json` | Ajout des dépendances `react-body-highlighter`, `uuid`, `@types/uuid` |
| `vite.config.ts` | Ajout de `allowedHosts: true` pour le développement |

### Types Ajoutés

```typescript
// Types pour les blessures et douleurs
export type InjuryType = 'injury' | 'chronic_pain' | 'surgery' | 'limitation';
export type InjurySeverity = 'mild' | 'moderate' | 'severe';
export type InjuryStatus = 'active' | 'recovering' | 'healed' | 'chronic';

export type BodyPart =
  | 'head' | 'neck' | 'trapezius' | 'upper-back' | 'lower-back'
  | 'chest' | 'abs' | 'obliques' | 'front-deltoids' | 'back-deltoids'
  | 'biceps' | 'triceps' | 'forearm' | 'gluteal' | 'adductor'
  | 'abductors' | 'quadriceps' | 'hamstring' | 'calves';

export interface InjuryData {
  id: string;
  bodyPart: BodyPart;
  type: InjuryType;
  description: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  since?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Fonctionnalités Implémentées

1. **Carte corporelle interactive**
   - Vue anterior (face) et posterior (dos)
   - Zones musculaires cliquables
   - Code couleur selon la sévérité (jaune = légère, orange = modérée, rouge = sévère)

2. **Formulaire de saisie des blessures**
   - Type : Blessure, Douleur chronique, Chirurgie/Opération, Limitation fonctionnelle
   - Sévérité : Légère, Modérée, Sévère
   - Statut : Active, En récupération, Guérie, Chronique
   - Date de début (optionnel)
   - Notes additionnelles (optionnel)

3. **Affichage des blessures**
   - Liste des blessures enregistrées avec badges colorés
   - Possibilité de supprimer une blessure
   - Visualisation sur la carte corporelle

4. **Intégration dans le bilan**
   - Sous-section dans "Antécédents et Notes Coach"
   - Bouton pour ouvrir la modale
   - Affichage du nombre de blessures enregistrées
   - Sauvegarde dans `medicalInfo.injuries`

## Dépendances Ajoutées

```json
{
  "react-body-highlighter": "^2.0.x",
  "uuid": "^9.x.x",
  "@types/uuid": "^9.x.x"
}
```

## Évolutions Futures Possibles

1. **Intégration 3D** : Si le budget le permet, intégration de BioDigital Human API pour une visualisation 3D avec dissection par couches
2. **Historique des blessures** : Suivi de l'évolution des blessures dans le temps
3. **Alertes automatiques** : Notification au coach si un exercice assigné touche une zone blessée
4. **Export PDF** : Génération d'un rapport médical avec la carte corporelle

## Notes Techniques

- La bibliothèque `react-body-highlighter` utilise des SVG pour le rendu, ce qui garantit de bonnes performances
- Les données des blessures sont stockées dans le champ JSONB `medicalInfo` de la table `clients`
- Le composant `BodyMapModal` est réutilisable et peut être intégré ailleurs dans l'application
