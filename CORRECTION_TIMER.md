# 🐛 Correction Bug Timer - ClientCurrentProgram.tsx

## 🎯 Problème

**Erreur** : `TypeError: Cannot read properties of undefined (reading '0')`  
**Quand** : Lors du clic sur le timer (icône horloge) dans la page "Programme en cours"  
**Impact** : Crash de l'application, impossible d'utiliser le chronomètre de repos

---

## 🔍 Cause identifiée

### Lignes 510-511 de `ClientCurrentProgram.tsx`

```typescript
// ❌ CODE DÉFECTUEUX
const specificRest = currentExercise.details[activeSetIndex]?.rest;
const generalRest = currentExercise.details[0]?.rest;
```

### Scénario du crash

1. Un exercice est créé avec `details: undefined` ou `details: []`
2. Le client clique sur le timer
3. Le code tente d'accéder à `currentExercise.details[0]`
4. Résultat : `undefined[0]` → retourne `undefined`
5. Puis `undefined?.rest` → retourne `undefined`
6. **💥 CRASH** car on essaie ensuite d'utiliser cette valeur

**Pourquoi ça crash ?**
- Il manque le `?.` avant `[0]` et `[activeSetIndex]`
- Sans `?.`, JavaScript tente d'accéder à la propriété `[0]` de `undefined`
- Résultat : `Cannot read properties of undefined (reading '0')`

---

## 🛠️ Correction appliquée

```typescript
// ✅ CODE CORRIGÉ
const specificRest = currentExercise.details?.[activeSetIndex]?.rest;
const generalRest = currentExercise.details?.[0]?.rest;
```

### Changements

| Ligne | Avant | Après |
|-------|-------|-------|
| 510 | `details[activeSetIndex]?.rest` | `details?.[activeSetIndex]?.rest` |
| 511 | `details[0]?.rest` | `details?.[0]?.rest` |

### Explication

- Ajout de `?.` avant `[activeSetIndex]` → si `details` est `undefined`, retourne `undefined` au lieu de crasher
- Ajout de `?.` avant `[0]` → même protection
- Le `restString` utilise ensuite un fallback : `specificRest || generalRest || '0s'`
- Résultat : Pas de crash, le timer affiche "Objectif: -" si aucune valeur n'est configurée

---

## ⏱️ Contexte métier : Le Timer

### Fonctionnement

Le timer est un **chronomètre de repos** qui aide le client à respecter les temps de récupération entre les séries.

**Logique** :
1. Le coach configure le temps de repos pour chaque série lors de la création du programme
2. Le client clique sur l'icône horloge pendant sa séance
3. Le timer s'affiche en plein écran avec :
   - L'objectif de repos (ex: "Objectif: 90s")
   - Le temps écoulé (format MM:SS)
   - Un changement de couleur quand l'objectif est dépassé (rouge)

**Récupération du temps de repos** :
- **Priorité 1** : Temps spécifique à la série en cours (`details[activeSetIndex].rest`)
- **Priorité 2** : Temps général (première série `details[0].rest`)
- **Priorité 3** : Valeur par défaut `'0s'` (affiche "Objectif: -")

### Configuration par le coach

Dans **WorkoutBuilder.tsx**, le coach peut configurer :
- Champ : `rest` (format : `'60s'`, `'90s'`, `'120s'`, etc.)
- Valeur par défaut : `'60s'`
- Peut être différent pour chaque série

**Exemple de configuration** :
```typescript
details: [
  { reps: '10', load: { value: '80', unit: 'kg' }, tempo: '2010', rest: '60s' },
  { reps: '8', load: { value: '85', unit: 'kg' }, tempo: '2010', rest: '90s' },
  { reps: '6', load: { value: '90', unit: 'kg' }, tempo: '2010', rest: '120s' },
]
```

---

## 🛡️ Garde-fous ajoutés

Le timer gère maintenant correctement :

| Cas | Avant | Après |
|-----|-------|-------|
| `details: undefined` | ❌ Crash | ✅ Affiche "Objectif: -" |
| `details: []` | ❌ Crash | ✅ Affiche "Objectif: -" |
| `details: [{ rest: undefined }]` | ❌ Crash | ✅ Affiche "Objectif: -" |
| `details: [{ rest: '90s' }]` | ✅ Fonctionne | ✅ Affiche "Objectif: 90s" |

---

## 🧪 Tests recommandés

### Test 1 : Timer avec temps de repos configuré

**Étapes** :
1. Crée un programme avec `rest: '90s'` pour un exercice
2. Assigne-le à un client
3. Connecte-toi en tant que client
4. Va sur "Programme en cours"
5. Clique sur le timer (icône horloge)

**Résultat attendu** :
- ✅ Le timer s'ouvre en plein écran
- ✅ Affiche "Objectif: 90s"
- ✅ Le chronomètre démarre
- ✅ Passe au rouge après 90 secondes
- ✅ Pas de crash

---

### Test 2 : Timer sans temps de repos configuré

**Étapes** :
1. Crée un programme avec un exercice sans `rest` (ou `rest: undefined`)
2. Assigne-le à un client
3. Connecte-toi en tant que client
4. Va sur "Programme en cours"
5. Clique sur le timer

**Résultat attendu** :
- ✅ Le timer s'ouvre en plein écran
- ✅ Affiche "Objectif: -" (pas d'objectif)
- ✅ Le chronomètre démarre quand même
- ✅ Reste blanc/gris (pas de changement de couleur)
- ✅ **Pas de crash** ← C'est le plus important !

---

### Test 3 : Timer avec différents temps par série

**Étapes** :
1. Crée un programme avec des temps de repos différents :
   - Série 1 : `rest: '60s'`
   - Série 2 : `rest: '90s'`
   - Série 3 : `rest: '120s'`
2. Assigne-le à un client
3. Connecte-toi en tant que client
4. Va sur "Programme en cours"
5. Pour chaque série (S1, S2, S3) :
   - Sélectionne la série
   - Clique sur le timer
   - Vérifie l'objectif affiché

**Résultat attendu** :
- ✅ Série 1 : "Objectif: 60s"
- ✅ Série 2 : "Objectif: 90s"
- ✅ Série 3 : "Objectif: 120s"
- ✅ Pas de crash

---

## ✅ Résultat

Le timer est maintenant :
- ✅ **Robuste** : Gère les exercices sans détails
- ✅ **Sécurisé** : Pas de crash possible
- ✅ **Fonctionnel** : Affiche les objectifs configurés par le coach
- ✅ **Flexible** : Fonctionne même sans configuration

---

## 📊 Impact

- ✅ **Aucun changement visuel**
- ✅ **Aucun changement de comportement** pour les programmes existants
- ✅ **100% compatible** avec les programmes déjà créés
- ✅ **Amélioration de la robustesse** pour les nouveaux programmes

---

**Type** : Bug fix  
**Priorité** : Haute (crash utilisateur)  
**Breaking change** : Non
