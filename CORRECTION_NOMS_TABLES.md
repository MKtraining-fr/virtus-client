# Correction des Noms de Tables - Débogage

**Date** : 2 décembre 2025  
**Problème** : Création de programmes échouait dans l'interface coach

---

## 🐛 Problème Identifié

Lors de la création d'un programme dans l'interface coach, les erreurs suivantes apparaissaient :
- ❌ Erreur de bypass cache pour `/rest/v1/program_templates`
- ❌ Erreur de bypass cache pour `/rest/v1/sessions`
- ❌ Erreur de bypass cache pour `/rest/v1/session_exercises`
- ❌ Le programme n'apparaissait pas dans la bibliothèque
- ❌ Le client ne voyait pas le programme assigné

**Cause racine** : Les services utilisaient les **mauvais noms de tables** qui n'existent pas dans le nouveau schéma.

---

## 🔧 Corrections Appliquées

### 1. `programTemplateService.ts`

**Lignes modifiées** : 44, 119

**Avant** :
```typescript
.from('sessions')
.from('session_exercises')
```

**Après** :
```typescript
.from('session_templates')
.from('session_exercise_templates')
```

**Colonnes corrigées** :
- `program_id` → `program_template_id`
- `session_id` → `session_template_id`

---

### 2. `programService.ts`

**Lignes modifiées** : 68, 94

**Avant** :
```typescript
.from('sessions')
.eq('program_id', programId)

.from('session_exercises')
.eq('session_id', sessionId)
```

**Après** :
```typescript
.from('session_templates')
.eq('program_template_id', programId)

.from('session_exercise_templates')
.eq('session_template_id', sessionId)
```

---

### 3. `sessionService.ts`

**Lignes modifiées** : 7, 20, 38, 63, 80, 98, 123, 140

**Avant** :
```typescript
export interface Session {
  program_id?: string | null;
}

export interface SessionInput {
  program_id?: string;
}

.from('sessions')
```

**Après** :
```typescript
export interface Session {
  program_template_id?: string | null;
}

export interface SessionInput {
  program_template_id?: string;
}

.from('session_templates')
```

---

### 4. `sessionExerciseService.ts`

**Lignes modifiées** : 9, 31, 58, 89, 117, 146, 170

**Avant** :
```typescript
export interface SessionExerciseData {
  session_id: string;
}

.from('session_exercises')
.eq('session_id', sessionId)
```

**Après** :
```typescript
export interface SessionExerciseData {
  session_template_id: string;
}

.from('session_exercise_templates')
.eq('session_template_id', sessionId)
```

---

### 5. `WorkoutBuilder.tsx`

**Lignes modifiées** : 1331, 1350, 1384

**Avant** :
```typescript
.filter((s) => s.program_id === savedProgram.id)

const sessionData = {
  program_id: savedProgram.id,
}

return {
  session_id: savedSession.id,
}
```

**Après** :
```typescript
.filter((s) => s.program_template_id === savedProgram.id)

const sessionData = {
  program_template_id: savedProgram.id,
}

return {
  session_template_id: savedSession.id,
}
```

---

## 📊 Résumé des Changements

| Ancien Nom | Nouveau Nom | Type |
|------------|-------------|------|
| `sessions` | `session_templates` | Table |
| `session_exercises` | `session_exercise_templates` | Table |
| `program_id` | `program_template_id` | Colonne |
| `session_id` | `session_template_id` | Colonne |

---

## ✅ Résultat Attendu

Après ces corrections :
1. ✅ La création de programmes fonctionne sans erreur
2. ✅ Les programmes apparaissent dans la bibliothèque coach
3. ✅ L'assignation de programmes aux clients fonctionne
4. ✅ Les clients voient les programmes assignés
5. ✅ Le flux complet fonctionne de bout en bout

---

## 🧪 Tests à Effectuer

1. **Créer un programme template** (coach)
   - Aller dans "Bibliothèque" → "Programmes"
   - Créer un nouveau programme avec 2 séances
   - Vérifier qu'il apparaît dans la liste

2. **Assigner le programme** (coach)
   - Aller dans "Clients" → Sélectionner un client
   - Assigner le programme créé
   - Vérifier qu'aucune erreur n'apparaît

3. **Voir le programme** (client)
   - Se connecter en tant que client
   - Aller dans "Mes Programmes"
   - Vérifier que le programme assigné apparaît

4. **Exécuter une séance** (client)
   - Lancer une séance
   - Renseigner les données
   - Terminer la séance
   - Vérifier que le compteur augmente

5. **Voir les séances** (coach)
   - Se reconnecter en tant que coach
   - Aller dans "Clients" → Progression du client
   - Vérifier que la séance complétée apparaît

---

## 📂 Fichiers Modifiés

1. `src/services/programTemplateService.ts` ✅
2. `src/services/programService.ts` ✅
3. `src/services/sessionService.ts` ✅
4. `src/services/sessionExerciseService.ts` ✅
5. `src/pages/WorkoutBuilder.tsx` ✅

---

## 🔄 Commit Git

**Commit** : `f63c6e9`  
**Message** : "fix: Correction des noms de tables pour utiliser les tables templates"  
**Branche** : `main`  
**Repository** : `MKtraining-fr/Virtus`

---

**Auteur** : Manus AI  
**Date** : 2 décembre 2025
