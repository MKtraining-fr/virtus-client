# 📊 Spécification technique : Code couleur de progression

## 🎯 Vue d'ensemble

Système de **feedback visuel** qui indique au client s'il progresse, régresse ou maintient ses performances par rapport à la semaine précédente.

---

## 🏗️ Architecture

### 1. Récupération des données de la semaine précédente

**Fonction** : `previousPerformancePlaceholders` (lignes 178-205)

```typescript
const previousPerformancePlaceholders = useMemo(() => {
  if (!user || !user.performanceLog || !activeSession || (user.programWeek || 1) <= 1) {
    return null; // Pas de données en semaine 1
  }

  const currentWeek = user.programWeek || 1;
  const previousWeek = currentWeek - 1;

  // Récupérer le log de la MÊME séance de la semaine PRÉCÉDENTE
  const previousWeekSessionLog = user.performanceLog
    .slice()
    .filter(
      (log) => 
        log.programName === localProgram?.name && 
        log.sessionName === activeSession.name &&
        log.week === previousWeek  // ✅ Filtre par semaine
    )
    .pop();

  if (!previousWeekSessionLog) {
    return null;
  }

  const placeholderMap = new Map<string, PerformanceSet[]>();
  for (const exLog of previousWeekSessionLog.exerciseLogs) {
    placeholderMap.set(exLog.exerciseName, exLog.loggedSets);
  }
  return placeholderMap;
}, [user, activeSession, localProgram]);
```

**Clés** :
- ✅ Filtre par `log.week === previousWeek` (pas juste la dernière séance)
- ✅ Filtre par `programName` et `sessionName` (même séance)
- ✅ Retourne `null` en semaine 1 (pas de données précédentes)

---

### 2. Calcul de la couleur de progression

**Fonction** : `getProgressionColor` (lignes 156-176)

```typescript
const getProgressionColor = (currentValue: string, previousValue: string | undefined): string => {
  if (!previousValue || !currentValue || currentValue === '' || previousValue === '') {
    return 'text-gray-900 dark:text-client-light'; // Couleur par défaut
  }

  const current = parseFloat(currentValue);
  const previous = parseFloat(previousValue);

  if (isNaN(current) || isNaN(previous)) {
    return 'text-gray-900 dark:text-client-light'; // Couleur par défaut
  }

  if (current > previous) {
    return 'text-green-600 dark:text-green-400'; // Progression 🟢
  } else if (current < previous) {
    return 'text-red-600 dark:text-red-400'; // Régression 🔴
  } else {
    return 'text-gray-900 dark:text-client-light'; // Maintien ⚫
  }
};
```

**Logique** :
1. Si valeur vide → couleur par défaut
2. Si valeur non numérique → couleur par défaut
3. Si `current > previous` → VERT
4. Si `current < previous` → ROUGE
5. Si `current === previous` → NOIR

**Protection** :
- ✅ Gère les valeurs vides
- ✅ Gère les valeurs non numériques
- ✅ Gère les valeurs undefined

---

### 3. Priorité des placeholders

**Logique** (lignes 796, 809) :

```typescript
// Répétitions
placeholder={targetReps !== '0' ? targetReps : (setPlaceholder?.reps || '0')}

// Charge
placeholder={targetLoad !== '0' ? targetLoad : (setPlaceholder?.load || '0')}
```

**Priorité** :
1. **Priorité 1** : `targetReps` / `targetLoad` (valeurs du coach)
   - Si `!== '0'` → utilise la valeur du coach
2. **Priorité 2** : `setPlaceholder?.reps` / `setPlaceholder?.load` (semaine précédente)
   - Si coach n'a pas configuré → utilise la semaine précédente
3. **Priorité 3** : `'0'` (valeur par défaut)
   - Si aucune donnée → affiche "0"

---

### 4. Application de la couleur

**Calcul** (lignes 783-784) :

```typescript
const repsProgressionColor = getProgressionColor(repValue, setPlaceholder?.reps);
const loadProgressionColor = getProgressionColor(loadValue, setPlaceholder?.load);
```

**Application** (lignes 806, 819) :

```typescript
// Répétitions
className={`... ${isSetSelected ? '...' : `... ${repValue ? repsProgressionColor : 'text-gray-900 dark:text-client-light'} ...`}`}

// Charge
className={`... ${isSetSelected ? '...' : `... ${loadValue ? loadProgressionColor : 'text-gray-900 dark:text-client-light'} ...`}`}
```

**Logique** :
1. Si série sélectionnée (`isSetSelected`) → texte blanc (fond violet)
2. Sinon :
   - Si valeur saisie (`repValue` / `loadValue`) → couleur de progression
   - Si champ vide → couleur par défaut

---

## 🎨 Classes CSS utilisées

### Progression (VERT) 🟢
```css
text-green-600 dark:text-green-400
```

### Régression (ROUGE) 🔴
```css
text-red-600 dark:text-red-400
```

### Maintien (NOIR) ⚫
```css
text-gray-900 dark:text-client-light
```

### Série sélectionnée (BLANC)
```css
text-white
```

---

## 🔄 Flux de données

### Semaine 1

```
Coach configure: S1 = 30 kg
       ↓
Client voit: placeholder="30" (grisé)
       ↓
Client saisit: 32 kg (NOIR - pas de comparaison)
       ↓
Sauvegarde: performanceLog[week=1] = { load: "32" }
```

### Semaine 2 (sans nouvelle config coach)

```
Récupération: performanceLog[week=1] = { load: "32" }
       ↓
Client voit: placeholder="32" (grisé)
       ↓
Client saisit: 35 kg
       ↓
Comparaison: 35 > 32 → VERT 🟢
       ↓
Affichage: "35" en vert
```

### Semaine 2 (avec nouvelle config coach)

```
Coach configure: S1 = 50 kg (semaine 2)
       ↓
Récupération: performanceLog[week=1] = { load: "32" }
       ↓
Client voit: placeholder="50" (grisé) ← Priorité coach !
       ↓
Client saisit: 48 kg
       ↓
Comparaison: 48 > 32 → VERT 🟢 ← Compare avec semaine 1, pas avec coach !
       ↓
Affichage: "48" en vert
```

---

## 🧪 Cas limites gérés

### 1. Semaine 1 (pas de données précédentes)
```typescript
if ((user.programWeek || 1) <= 1) {
  return null; // Pas de placeholders
}
```

### 2. Pas de log de la semaine précédente
```typescript
if (!previousWeekSessionLog) {
  return null; // Pas de placeholders
}
```

### 3. Exercice non trouvé dans les logs
```typescript
const setPlaceholder = placeholders?.[setIndex];
// → undefined si pas trouvé
```

### 4. Valeur non numérique
```typescript
if (isNaN(current) || isNaN(previous)) {
  return 'text-gray-900 dark:text-client-light'; // Couleur par défaut
}
```

### 5. Valeur vide
```typescript
if (!previousValue || !currentValue || currentValue === '' || previousValue === '') {
  return 'text-gray-900 dark:text-client-light'; // Couleur par défaut
}
```

---

## 📊 Impact sur les performances

### Calculs ajoutés
- `getProgressionColor` : O(1) - Comparaison simple
- `previousPerformancePlaceholders` : O(n) - Filtre du performanceLog (déjà existant)

**Impact** : ✅ Négligeable (calculs légers, déjà en mémoire)

---

## ✅ Avantages

### Fonctionnel
- ✅ Feedback visuel immédiat
- ✅ Motivation du client (voir la progression)
- ✅ Guidage sans contrainte

### Technique
- ✅ Code simple et maintenable
- ✅ Pas de requête supplémentaire
- ✅ Utilise les données déjà chargées

### UX
- ✅ Couleurs intuitives (vert=bien, rouge=attention)
- ✅ Non intrusif (seulement quand valeur saisie)
- ✅ Compatible avec le thème sombre

---

## 🚀 Évolutions futures possibles

### 1. Indicateur de progression en %
```
S1: [Charge: 35 kg en VERT] (+16.7% vs semaine 1)
```

### 2. Graphique de progression
- Afficher un graphique de l'évolution sur plusieurs semaines

### 3. Badge de performance
- "🏆 Nouvelle PR !" si le client bat son record

### 4. Comparaison avec objectif coach
- Afficher si le client est au-dessus ou en-dessous de l'objectif

---

**Type** : Feature  
**Priorité** : Haute  
**Breaking change** : Non  
**Rétrocompatibilité** : Oui  
**Complexité** : Moyenne
