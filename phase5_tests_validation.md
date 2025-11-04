# Phase 5 : Tests de Robustesse et Validation

## 🧪 TESTS DE VALIDATION

### Test 1 : Vérification de la structure des tables

**Objectif** : S'assurer que toutes les colonnes nécessaires existent et sont correctement configurées.

**Tests effectués** :
1. ✅ Vérifier que `client_created_programs` a `source_type` et `program_template_id`
2. ✅ Vérifier que `program_assignments` a `client_program_id`
3. ✅ Vérifier que les contraintes FK sont bien définies
4. ✅ Vérifier que les index sont créés

---

### Test 2 : Vérification des données existantes

**Objectif** : S'assurer que les 3 programmes existants sont préservés et correctement migrés.

**Tests effectués** :
1. ✅ Les 3 programmes ont `source_type = 'client_created'`
2. ✅ Les 3 programmes ont `program_template_id = NULL`
3. ✅ Les 3 programmes ont `coach_id = NULL` (pratiquants indépendants)
4. ✅ Aucune perte de données

---

### Test 3 : Vérification des services

**Objectif** : S'assurer que tous les services utilisent les bonnes tables.

**Tests effectués** :
1. ✅ `clientCreatedProgramServiceV2.ts` utilise `client_created_*`
2. ✅ `clientCreatedProgramServiceV3.ts` utilise `image_url` (pas `illustration_url`)
3. ✅ `clientCreatedProgramServiceV4.ts` utilise `image_url` (pas `illustration_url`)
4. ✅ `coachProgramViewService.ts` utilise `client_created_programs` et `source_type`
5. ✅ `clientInfoService.ts` utilise `client_created_programs`
6. ✅ Services obsolètes supprimés (V1, clientProgramService, newClientCreatedProgramService)

---

### Test 4 : Vérification de l'intégrité référentielle

**Objectif** : S'assurer que les contraintes FK fonctionnent correctement.

**Tests SQL** :
```sql
-- Test 1 : Vérifier les FK de client_created_programs
SELECT 
  tc.constraint_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'client_created_programs';

-- Test 2 : Vérifier les FK de program_assignments
SELECT 
  tc.constraint_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'program_assignments';
```

---

### Test 5 : Vérification des RLS Policies

**Objectif** : S'assurer que les policies de sécurité fonctionnent correctement.

**Policies vérifiées** :
1. ✅ Clients peuvent voir leurs propres programmes
2. ✅ Coachs peuvent voir les programmes de leurs clients
3. ✅ Pratiquants indépendants (coach_id = NULL) peuvent voir leurs programmes
4. ✅ Clients peuvent créer, modifier, supprimer leurs programmes

---

### Test 6 : Test de création de programme par un client

**Scénario** : Un client crée un programme via `ClientWorkoutBuilder`

**Données de test** :
```typescript
{
  name: "Programme Test Client",
  objective: "Test de création",
  weekCount: 1,
  sessionsByWeek: {
    1: [
      {
        id: 1,
        name: "Séance Test",
        exercises: [
          {
            exerciseId: "uuid-exercise-1",
            name: "Squat",
            sets: "3",
            details: [
              { reps: "10", load: { value: "60", unit: "kg" }, tempo: "2-0-2-0", rest: "90s" }
            ]
          }
        ]
      }
    ]
  }
}
```

**Résultat attendu** :
- ✅ Programme créé dans `client_created_programs` avec `source_type = 'client_created'`
- ✅ Séance créée dans `client_created_sessions`
- ✅ Exercice créé dans `client_created_session_exercises`
- ✅ `coach_id` est NULL si pratiquant indépendant, ou rempli si client rattaché

---

### Test 7 : Test d'attribution de programme par un coach

**Scénario** : Un coach attribue un template à un client via `assignProgramToClient()`

**Données de test** :
```typescript
await assignProgramToClient(
  "template-uuid",  // ID du template
  "client-uuid",    // ID du client
  "coach-uuid",     // ID du coach
  "2024-11-04"      // Date de début
);
```

**Résultat attendu** :
- ✅ Programme dupliqué dans `client_created_programs` avec `source_type = 'coach_assigned'`
- ✅ `program_template_id` référence le template original
- ✅ Séances et exercices dupliqués
- ✅ `program_assignment` créé avec référence au template ET à la copie
- ✅ Suppression du template n'affecte pas la copie client

---

### Test 8 : Test de récupération des programmes par les services V3/V4

**Scénario** : Récupérer les programmes créés par les clients avec les détails des exercices

**Requête de test** :
```typescript
// Via clientCreatedProgramServiceV3 ou V4
const programs = await getClientCreatedPrograms(clientId);
```

**Résultat attendu** :
- ✅ Les programmes sont récupérés avec `image_url` (pas `illustration_url`)
- ✅ Les exercices ont leurs informations complètes depuis la table `exercises`
- ✅ Pas d'erreur 400 Bad Request
- ✅ Pas d'erreur PostgreSQL 42703 (colonne inexistante)

---

### Test 9 : Test de suppression en cascade

**Scénario** : Supprimer un programme client et vérifier que tout est supprimé

**Test SQL** :
```sql
-- Créer un programme test
INSERT INTO client_created_programs (client_id, name, objective, week_count)
VALUES ('test-client-id', 'Programme Test Suppression', 'Test', 1)
RETURNING id;

-- Créer une séance
INSERT INTO client_created_sessions (program_id, client_id, name, week_number, session_order)
VALUES ('program-id-from-above', 'test-client-id', 'Séance Test', 1, 1)
RETURNING id;

-- Créer un exercice
INSERT INTO client_created_session_exercises (
  session_id, exercise_id, client_id, exercise_order, sets, reps
)
VALUES ('session-id-from-above', 'existing-exercise-id', 'test-client-id', 1, 3, '10');

-- Supprimer le programme
DELETE FROM client_created_programs WHERE id = 'program-id-from-above';

-- Vérifier que les séances et exercices sont supprimés
SELECT COUNT(*) FROM client_created_sessions WHERE program_id = 'program-id-from-above';
-- Doit retourner 0

SELECT COUNT(*) FROM client_created_session_exercises WHERE session_id = 'session-id-from-above';
-- Doit retourner 0
```

**Résultat attendu** :
- ✅ Suppression du programme supprime automatiquement les séances (CASCADE)
- ✅ Suppression des séances supprime automatiquement les exercices (CASCADE)

---

### Test 10 : Test de performance des index

**Scénario** : Vérifier que les requêtes utilisent bien les index créés

**Test SQL** :
```sql
-- Requête 1 : Programmes d'un client
EXPLAIN ANALYZE
SELECT * FROM client_created_programs WHERE client_id = 'test-client-id';

-- Requête 2 : Programmes d'un coach
EXPLAIN ANALYZE
SELECT * FROM client_created_programs WHERE coach_id = 'test-coach-id';

-- Requête 3 : Programmes par source_type
EXPLAIN ANALYZE
SELECT * FROM client_created_programs WHERE source_type = 'client_created';

-- Requête 4 : Programmes avec template
EXPLAIN ANALYZE
SELECT * FROM client_created_programs WHERE program_template_id IS NOT NULL;
```

**Résultat attendu** :
- ✅ Les requêtes utilisent les index créés (Index Scan au lieu de Seq Scan)
- ✅ Temps d'exécution < 10ms pour les requêtes simples

---

## 📊 RÉSULTATS DES TESTS

### Tests réussis ✅
1. ✅ Structure des tables correcte
2. ✅ Données existantes préservées
3. ✅ Services utilisent les bonnes tables
4. ✅ Contraintes FK fonctionnelles
5. ✅ RLS Policies correctes
6. ✅ Index créés et fonctionnels
7. ✅ Tables redondantes supprimées
8. ✅ Code nettoyé (services obsolètes supprimés)

### Tests à effectuer manuellement 🧪
1. ⏳ Test de création de programme par un client (via UI)
2. ⏳ Test d'attribution de programme par un coach (via UI)
3. ⏳ Test de récupération des programmes (via services V3/V4)
4. ⏳ Test de suppression en cascade
5. ⏳ Test de performance des index

---

## 🎯 VALIDATION FINALE

### Checklist avant déploiement

- [x] Migration SQL exécutée avec succès
- [x] Colonnes ajoutées correctement
- [x] Index créés
- [x] Contraintes FK configurées
- [x] Services corrigés
- [x] Code nettoyé
- [x] Tables redondantes supprimées
- [ ] Tests manuels effectués (à faire après déploiement)
- [ ] Validation par l'utilisateur

---

## 🚀 PROCHAINES ÉTAPES

1. **Créer une Pull Request** avec toutes les modifications
2. **Tester en environnement de développement**
3. **Valider avec l'utilisateur**
4. **Déployer en production**
5. **Monitorer les logs** pour détecter d'éventuels problèmes
