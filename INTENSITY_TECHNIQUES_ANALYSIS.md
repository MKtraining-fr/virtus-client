# Analyse des Techniques d'Intensité

## Date
18 janvier 2026

## Vue d'ensemble

L'application Virtus supporte **5 techniques d'intensification** pour les entraînements :

1. **Drop Set** ✅ 
2. **Rest-Pause** ⚠️
3. **Myo-Reps** ❌
4. **Cluster Set** ❌
5. **Tempo Contrôlé** ❌

---

## État actuel de chaque technique

### 1. ✅ Drop Set (IMPLÉMENTÉ)

**Configuration** (`DropSetConfig`)
- `applyTo`: 'all' | 'last' | 'specific'
- `specificSets`: number[] (optionnel)
- `dropLevels`: Array<{ type, value, targetReps }>

**Interface client** ✅
- Badge visuel "⚡ DROP SET" sur la série concernée
- Série principale avec champs de saisie standards
- Bouton expand/collapse "▼ Voir les paliers (X)"
- Paliers affichés en dessous avec indication de réduction (-20% ou -5kg)
- Design cohérent avec le reste de l'application

**Interface coach** ✅
- Configuration masquée dans l'interface client (affichée uniquement côté coach)
- Paramétrage dans le créateur de séances

**Statut** : ✅ **COMPLET ET FONCTIONNEL**

---

### 2. ⚠️ Rest-Pause (PARTIELLEMENT IMPLÉMENTÉ)

**Configuration** (`RestPauseConfig`)
- `applyTo`: 'all' | 'last' | 'specific'
- `specificSets`: number[] (optionnel)
- `pauseDuration`: number (durée de la micro-pause en secondes)
- `miniSets`: number (nombre de mini-séries après la pause)

**Interface client** ⚠️ BASIQUE
- Composant existe dans `AdaptiveSetInput.tsx` (lignes 234-330)
- Affiche "Série X - Rest-Pause"
- Champs pour la série principale (reps + load)
- **PROBLÈME** : Pas de champs pour les mini-séries
- **PROBLÈME** : Pas d'indication du temps de pause
- **PROBLÈME** : Pas de système expand/collapse comme le Drop Set

**Ce qui manque**
- [ ] Champs de saisie pour chaque mini-série
- [ ] Indicateur du temps de pause (15s, 20s, etc.)
- [ ] Système expand/collapse pour masquer les mini-séries
- [ ] Badge visuel distinctif comme le Drop Set
- [ ] Design cohérent avec le Drop Set

**Statut** : ⚠️ **STRUCTURE DE BASE PRÉSENTE, MAIS INCOMPLET**

---

### 3. ❌ Myo-Reps (NON IMPLÉMENTÉ)

**Configuration** (`MyoRepsConfig`)
- `applyTo`: 'all' | 'last' | 'specific'
- `specificSets`: number[] (optionnel)
- `activationSet`: { targetReps: string } (série d'activation)
- `miniSets`: number (nombre de mini-séries)
- `restBetween`: number (repos entre mini-séries en secondes)
- `targetRepsPerMini`: string (reps par mini-série)

**Interface client** ❌ ABSENTE
- Aucun code trouvé dans `AdaptiveSetInput.tsx`
- Pas de gestion dans `ClientCurrentProgram.tsx`

**Ce qui manque**
- [ ] Composant complet pour Myo-Reps
- [ ] Champ pour la série d'activation (ex: 12-15 reps)
- [ ] Champs pour les mini-séries (ex: 3-5 mini-séries de 3-5 reps)
- [ ] Indicateur du temps de repos entre mini-séries (ex: 5s)
- [ ] Badge visuel distinctif
- [ ] Système expand/collapse

**Statut** : ❌ **NON IMPLÉMENTÉ**

---

### 4. ❌ Cluster Set (NON IMPLÉMENTÉ)

**Configuration** (`ClusterSetConfig`)
- `applyTo`: 'all' | 'last' | 'specific'
- `specificSets`: number[] (optionnel)
- `clusters`: number (nombre de clusters par série)
- `repsPerCluster`: string (reps par cluster)
- `restBetweenClusters`: number (repos entre clusters en secondes)

**Interface client** ❌ ABSENTE
- Aucun code trouvé dans `AdaptiveSetInput.tsx`
- Pas de gestion dans `ClientCurrentProgram.tsx`

**Ce qui manque**
- [ ] Composant complet pour Cluster Set
- [ ] Champs pour chaque cluster (ex: 3 clusters de 2-3 reps)
- [ ] Indicateur du temps de repos entre clusters (ex: 10-15s)
- [ ] Badge visuel distinctif
- [ ] Système expand/collapse

**Statut** : ❌ **NON IMPLÉMENTÉ**

---

### 5. ❌ Tempo Contrôlé (NON IMPLÉMENTÉ)

**Configuration** (`TempoConfig`)
- `applyTo`: 'all' | 'last' | 'specific'
- `specificSets`: number[] (optionnel)
- `eccentric`: number (phase excentrique en secondes)
- `pause1`: number (pause en bas en secondes)
- `concentric`: number (phase concentrique en secondes)
- `pause2`: number (pause en haut en secondes)

**Interface client** ❌ ABSENTE
- Aucun code trouvé dans `AdaptiveSetInput.tsx`
- Pas de gestion dans `ClientCurrentProgram.tsx`

**Ce qui manque**
- [ ] Indicateur visuel du tempo (ex: "4-1-1-0")
- [ ] Affichage clair de chaque phase (excentrique, pause bas, concentrique, pause haut)
- [ ] Badge visuel distinctif
- [ ] Pas besoin de champs supplémentaires (juste indication visuelle)

**Statut** : ❌ **NON IMPLÉMENTÉ**

---

## Résumé des priorités

### Priorité 1 : Compléter Rest-Pause ⚠️
**Effort** : Moyen (structure existante à améliorer)
- Ajouter les champs pour les mini-séries
- Ajouter l'indicateur de temps de pause
- Ajouter le système expand/collapse
- Harmoniser le design avec le Drop Set

### Priorité 2 : Implémenter Myo-Reps ❌
**Effort** : Moyen-Élevé (à créer de zéro)
- Créer le composant complet
- Gérer la série d'activation + mini-séries
- Ajouter les indicateurs de temps
- Design cohérent

### Priorité 3 : Implémenter Cluster Set ❌
**Effort** : Moyen (similaire à Rest-Pause)
- Créer le composant complet
- Gérer les clusters avec repos
- Design cohérent

### Priorité 4 : Implémenter Tempo Contrôlé ❌
**Effort** : Faible (principalement visuel)
- Ajouter l'indicateur visuel du tempo
- Pas de champs supplémentaires nécessaires
- Design cohérent

---

## Architecture recommandée

Pour maintenir la cohérence, toutes les techniques devraient suivre le modèle du Drop Set :

### Structure commune
```tsx
<div className="space-y-2">
  {/* Badge de la technique */}
  <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[color1] to-[color2] rounded-t-lg">
    <span className="text-xs font-bold text-white tracking-wider">
      [ICÔNE] [NOM TECHNIQUE]
    </span>
    <span className="text-xs text-white/90">
      [INFO CONTEXTUELLE]
    </span>
  </div>

  {/* Série principale */}
  <div className={`p-3 rounded-lg border-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>
    {/* Champs de saisie standards */}
  </div>

  {/* Bouton expand/collapse (si applicable) */}
  {hasSubSets && (
    <button onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded ? '▲ Cacher' : '▼ Voir'} les [sous-éléments] (X)
    </button>
  )}

  {/* Sous-éléments (paliers, mini-séries, clusters) */}
  {isExpanded && (
    <div className="space-y-2 pl-4">
      {/* Champs pour chaque sous-élément */}
    </div>
  )}
</div>
```

### Palette de couleurs suggérée
- **Drop Set** : Orange → Rouge (✅ implémenté)
- **Rest-Pause** : Bleu → Indigo
- **Myo-Reps** : Violet → Rose
- **Cluster Set** : Vert → Teal
- **Tempo** : Jaune → Orange (badge simple sans expand/collapse)

---

## Prochaines étapes recommandées

1. **Compléter Rest-Pause** (1-2h de travail)
   - Ajouter les champs mini-séries
   - Ajouter expand/collapse
   - Harmoniser le design

2. **Implémenter Myo-Reps** (2-3h de travail)
   - Créer le composant complet
   - Tester avec différentes configurations

3. **Implémenter Cluster Set** (2-3h de travail)
   - Créer le composant complet
   - Tester avec différentes configurations

4. **Implémenter Tempo** (1h de travail)
   - Ajouter l'indicateur visuel simple
   - Pas de logique complexe

**Temps total estimé** : 6-9 heures de développement
