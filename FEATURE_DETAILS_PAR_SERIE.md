# 📊 Feature: Détails par série (reps, load, tempo, rest)

## 🎯 Objectif

Permettre au coach de configurer des valeurs **différentes pour chaque série** d'un exercice, et afficher ces valeurs en **placeholder grisé** sur l'interface client.

### Exemple d'utilisation

**Coach configure** :
- Série 1 : 12 reps, 30 kg, tempo 2010, repos 60s
- Série 2 : 10 reps, 40 kg, tempo 2010, repos 90s
- Série 3 : 8 reps, 50 kg, tempo 2010, repos 120s

**Client voit** :
- Champs de saisie avec placeholders grisés : "30", "40", "50"
- Les champs restent **écrasables** pour saisir les valeurs réelles

---

## 🏗️ Architecture

### Ancien format (avant)
```json
{
  "sets": 3,
  "reps": "12",
  "load": "30 kg",
  "tempo": "2010",
  "rest_time": "60s"
}
```

**Problème** : Une seule valeur pour toutes les séries (pas de variation possible).

### Nouveau format (après)
```json
{
  "sets": 3,
  "details": [
    { "reps": "12", "load": { "value": "30", "unit": "kg" }, "tempo": "2010", "rest": "60s" },
    { "reps": "10", "load": { "value": "40", "unit": "kg" }, "tempo": "2010", "rest": "90s" },
    { "reps": "8", "load": { "value": "50", "unit": "kg" }, "tempo": "2010", "rest": "120s" }
  ]
}
```

**Avantage** : Valeurs différentes par série (progression, pyramide, drop sets, etc.).

---

## 🗄️ Modifications de la base de données

### 1. Ajout de la colonne `details` (JSONB)

**Tables modifiées** :
- ✅ `session_exercise_templates` - Templates de programmes
- ✅ `client_session_exercises` - Programmes assignés aux clients

**Vue mise à jour** :
- ✅ `session_exercises` - Vue sur `session_exercise_templates`

### 2. Fonction RPC mise à jour

**`assign_program_atomic`** :
- ✅ Copie maintenant la colonne `details` lors de l'assignation d'un programme

### 3. Format de la colonne `details`

```json
[
  {
    "reps": "12",
    "load": { "value": "80", "unit": "kg" },
    "tempo": "2010",
    "rest": "60s"
  },
  {
    "reps": "10",
    "load": { "value": "90", "unit": "kg" },
    "tempo": "2010",
    "rest": "90s"
  }
]
```

**Unités supportées** : `kg`, `lbs`, `%`

---

## 💻 Modifications du code

### 1. WorkoutBuilder.tsx (ligne 1397)

**Sauvegarde du tableau `details`** :
```typescript
return {
  session_id: savedSession.id,
  exercise_id: normalized.exerciseId,
  // ... autres champs
  details: JSON.stringify(details), // ✅ Nouveau
};
```

### 2. sessionExerciseService.ts (ligne 20)

**Ajout du champ `details` à l'interface** :
```typescript
export interface SessionExerciseData {
  // ... autres champs
  details?: string; // ✅ JSONB stringifié
}
```

### 3. clientProgramService.ts (lignes 20-48)

**Utilisation de `details` si disponible** :
```typescript
if (exercise.details) {
  // Nouveau format: utiliser directement la colonne details
  const parsedDetails = typeof exercise.details === 'string' 
    ? JSON.parse(exercise.details) 
    : exercise.details;
  details = Array.isArray(parsedDetails) ? parsedDetails : [];
} else {
  // Ancien format: créer details à partir des colonnes individuelles
  // ... (code de fallback)
}
```

### 4. ClientCurrentProgram.tsx (lignes 746-751)

**Utilisation des valeurs par série** :
```typescript
const targetReps = currentExercise.details?.[setIndex]?.reps || 
                   currentExercise.details?.[0]?.reps || '0';
const targetLoad = currentExercise.details?.[setIndex]?.load?.value || 
                   currentExercise.details?.[0]?.load?.value || '0';
```

**Affichage en placeholder** (lignes 767, 780) :
```typescript
<input
  type="number"
  placeholder={setPlaceholder?.load || targetLoad} // ✅ Affiche la valeur du coach
  value={loadValue}
  // ... reste du code
/>
```

---

## ✅ Compatibilité avec les données existantes

### Programmes existants (sans `details`)
- ✅ Continuent de fonctionner normalement
- ✅ Fallback sur les colonnes `reps`, `load`, `tempo`, `rest_time`
- ✅ Affichent des valeurs uniformes pour toutes les séries

### Nouveaux programmes (avec `details`)
- ✅ Utilisent le nouveau format
- ✅ Supportent des valeurs différentes par série
- ✅ Affichent les bonnes valeurs en placeholder

---

## 🧪 Flux de données

### 1. Coach crée un programme

**WorkoutBuilder** → `session_exercise_templates.details`

```json
{
  "details": "[{\"reps\":\"12\",\"load\":{\"value\":\"30\",\"unit\":\"kg\"},\"tempo\":\"2010\",\"rest\":\"60s\"},{\"reps\":\"10\",\"load\":{\"value\":\"40\",\"unit\":\"kg\"},\"tempo\":\"2010\",\"rest\":\"90s\"}]"
}
```

### 2. Coach assigne le programme à un client

**RPC `assign_program_atomic`** → Copie `details` vers `client_session_exercises`

```sql
INSERT INTO client_session_exercises (..., details)
VALUES (..., v_exercise_template.details);
```

### 3. Client consulte son programme

**`clientProgramService`** → Parse `details` et crée le tableau

```typescript
const parsedDetails = JSON.parse(exercise.details);
// → [{ reps: "12", load: { value: "30", unit: "kg" }, ... }, ...]
```

### 4. Interface client affiche les placeholders

**`ClientCurrentProgram`** → Affiche les valeurs par série

```typescript
// Série 1: placeholder="30"
// Série 2: placeholder="40"
// Série 3: placeholder="50"
```

---

## 🎨 Résultat visuel

### Avant
```
Série 1: [Répétition: 0] [Charge: 0]
Série 2: [Répétition: 0] [Charge: 0]
Série 3: [Répétition: 0] [Charge: 0]
```

### Après
```
Série 1: [Répétition: placeholder="12"] [Charge: placeholder="30"]
Série 2: [Répétition: placeholder="10"] [Charge: placeholder="40"]
Série 3: [Répétition: placeholder="8"] [Charge: placeholder="50"]
```

Les placeholders sont **grisés** et **écrasables**.

---

## 🧪 Tests à effectuer

### Test 1 : Programme avec valeurs uniformes
1. Créer un exercice avec 3 séries, toutes avec 12 reps et 80 kg
2. Assigner au client
3. **Vérifier** : Toutes les séries ont placeholder="80" ✅

### Test 2 : Programme avec valeurs différentes par série
1. Créer un exercice avec 3 séries :
   - S1: 12 reps, 30 kg
   - S2: 10 reps, 40 kg
   - S3: 8 reps, 50 kg
2. Assigner au client
3. **Vérifier** : 
   - S1 placeholder="30" ✅
   - S2 placeholder="40" ✅
   - S3 placeholder="50" ✅

### Test 3 : Écrasabilité
1. Dans l'interface client, saisir une valeur différente (ex: 35 kg)
2. **Vérifier** : La valeur saisie remplace le placeholder ✅
3. **Vérifier** : Le placeholder réapparaît si on efface la saisie ✅

### Test 4 : Compatibilité avec programmes existants
1. Consulter un programme créé avant la migration
2. **Vérifier** : Les valeurs s'affichent correctement (fallback sur ancien format) ✅
3. **Vérifier** : Pas de crash ✅

---

## 📦 Fichiers modifiés

### Migrations SQL
- `add_details_column_to_client_session_exercises.sql`
- `add_details_column_to_session_exercise_templates.sql`
- `update_assign_program_atomic_with_details.sql`
- `recreate_session_exercises_view_with_details.sql`

### Code TypeScript
- `src/pages/WorkoutBuilder.tsx` (ligne 1397)
- `src/services/sessionExerciseService.ts` (ligne 20)
- `src/services/clientProgramService.ts` (lignes 20-48)

---

## 🚀 Déploiement

### Étape 1 : Migrations
- ✅ Toutes les migrations ont été appliquées sur Supabase

### Étape 2 : Code
- ✅ Modifications commitées dans la branche `feat/add-exercise-details-column`
- 🔄 PR à créer

### Étape 3 : Tests
- 🔄 Tests manuels à effectuer après merge

---

## ⚠️ Points d'attention

### 1. Rétrocompatibilité
- ✅ Les programmes existants continuent de fonctionner
- ✅ Le code gère les deux formats (avec et sans `details`)

### 2. Validation des données
- ✅ Le code parse `details` avec try/catch
- ✅ Fallback sur tableau vide en cas d'erreur

### 3. Performance
- ✅ Index GIN ajouté sur les colonnes `details`
- ✅ Pas d'impact sur les requêtes existantes

---

## 📊 Impact

### Fonctionnel
- ✅ Coach peut configurer des valeurs différentes par série
- ✅ Client voit les valeurs attendues en placeholder
- ✅ Meilleure expérience utilisateur (guidage)

### Technique
- ✅ Architecture plus flexible
- ✅ Support de programmes complexes (pyramide, drop sets, etc.)
- ✅ Rétrocompatibilité totale

### UX
- ✅ Placeholders grisés (non intrusifs)
- ✅ Champs écrasables (liberté du client)
- ✅ Guidage sans contrainte

---

**Type** : Feature  
**Priorité** : Haute  
**Breaking change** : Non  
**Rétrocompatibilité** : Oui
