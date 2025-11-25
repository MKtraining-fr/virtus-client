# Analyse des erreurs - ClientCurrentProgram.tsx

## Résumé

L'erreur **"Cannot read properties of undefined (reading '0')"** se produit à cause d'accès non sécurisés à des tableaux qui peuvent être vides ou undefined.

## Erreurs identifiées

### 🔴 CRITIQUE - Ligne 193 (loadUnit)

```typescript
const firstUnit = currentExercise.details[0].load.unit;
```

**Problème** : Accès direct à `details[0]` alors que la ligne 190 vérifie que `details` existe et n'est pas vide, MAIS cette vérification retourne "Charge" avant d'atteindre la ligne 193. Cependant, si `details` est un tableau vide `[]`, la condition `details.length === 0` sera vraie et on retournera "Charge". **Cette ligne est donc protégée indirectement**.

**Statut** : ✅ Protégé (early return si tableau vide)

---

### 🔴 CRITIQUE - Ligne 594 (technique)

```typescript
const technique = currentExercise?.intensification?.[0]?.value;
```

**Problème** : Utilise optional chaining `?.[0]?`, donc si `intensification` est undefined ou un tableau vide, `technique` sera `undefined`.

**Statut** : ✅ Protégé (optional chaining)

---

### 🟡 ATTENTION - Lignes 747-750 (targetReps/targetLoad)

```typescript
const targetReps = currentExercise.details[setIndex]?.reps || currentExercise.details[0]?.reps || '0';
const targetLoad = currentExercise.details[setIndex]?.load.value || currentExercise.details[0]?.load.value || '0';
```

**Problème** : 
- `currentExercise.details[0]` accède directement à l'index 0 SANS vérifier si `details` existe ou est non vide
- Si `details` est `undefined`, alors `details[0]` retourne `undefined`, et `undefined?.reps` retourne `undefined`
- Si `details` est un tableau vide `[]`, alors `details[0]` retourne `undefined`, et `undefined?.reps` retourne `undefined`
- Le fallback `|| '0'` protège contre undefined, MAIS...

**ERREUR POTENTIELLE** : 
```typescript
currentExercise.details[0]?.load.value
```
Si `details` est `undefined`, alors `details[0]` retourne `undefined`, et on tente d'accéder à `undefined?.load.value`.
Le `?.` après `[0]` protège, donc `undefined?.load` retourne `undefined`, puis `undefined.value` **CRASH** ❌

**Correction nécessaire** :
```typescript
currentExercise.details?.[0]?.load?.value
```

**Statut** : 🔴 **ERREUR CONFIRMÉE** - Ligne 750

---

### 🟡 ATTENTION - Ligne 40 (getDisplayValue)

```typescript
const firstValue = details[0][key];
```

**Problème** : La fonction vérifie `if (!details || details.length === 0)` à la ligne 39, donc cette ligne est protégée.

**Statut** : ✅ Protégé (early return si tableau vide)

---

### 🟡 ATTENTION - Ligne 511 (restTimeInSeconds)

```typescript
const generalRest = currentExercise.details[0]?.rest;
```

**Problème** : Accès à `details[0]` sans vérifier si `details` existe.
- Si `details` est `undefined`, alors `details[0]` retourne `undefined`, et `undefined?.rest` retourne `undefined` ✅
- Si `details` est `[]`, alors `details[0]` retourne `undefined`, et `undefined?.rest` retourne `undefined` ✅

**Statut** : ✅ Protégé (optional chaining après [0])

---

## Conclusion

### Erreur principale identifiée : **Ligne 750**

```typescript
currentExercise.details[0]?.load.value
```

**Scénario de crash** :
1. Un exercice est créé avec `details: undefined` ou `details: []`
2. Le code tente d'accéder à `details[0]` → retourne `undefined`
3. Puis `undefined?.load` → retourne `undefined`
4. Puis `undefined.value` → **CRASH : Cannot read properties of undefined (reading 'value')**

### Corrections nécessaires

#### Ligne 747 - targetReps
```typescript
// Avant
const targetReps = currentExercise.details[setIndex]?.reps || currentExercise.details[0]?.reps || '0';

// Après
const targetReps = currentExercise.details?.[setIndex]?.reps || currentExercise.details?.[0]?.reps || '0';
```

#### Ligne 749-750 - targetLoad
```typescript
// Avant
const targetLoad =
  currentExercise.details[setIndex]?.load.value ||
  currentExercise.details[0]?.load.value ||
  '0';

// Après
const targetLoad =
  currentExercise.details?.[setIndex]?.load?.value ||
  currentExercise.details?.[0]?.load?.value ||
  '0';
```

### Autres améliorations recommandées

#### Ligne 193 - Renforcer la sécurité
```typescript
// Avant
const firstUnit = currentExercise.details[0].load.unit;

// Après (plus explicite)
const firstUnit = currentExercise.details[0]?.load?.unit || 'kg';
```

## Tests recommandés

Créer des cas de test avec :
1. Un exercice avec `details: undefined`
2. Un exercice avec `details: []`
3. Un exercice avec `intensification: undefined`
4. Un exercice avec `intensification: []`
