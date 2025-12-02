# Guide de Test - Flux Complet d'Assignation et Suivi des Séances

**Date** : 2 décembre 2025  
**Version** : 1.0

## Objectif

Valider le flux complet suivant :
**Assignation programme → visibilité élève → séance réalisée → compteur +1 → visibilité coach**

---

## Prérequis

### Comptes de Test

1. **Coach** : Un compte avec le rôle `coach`
   - Email : `coach@test.com` (à adapter)
   - ID : `[COACH_ID]`

2. **Client** : Un compte avec le rôle `client` rattaché au coach
   - Email : `client@test.com` (à adapter)
   - ID : `[CLIENT_ID]`
   - `coach_id` : `[COACH_ID]`

### Données de Test

1. **Programme Template** : Un programme avec au moins 2 séances
   - Nom : "Programme Test"
   - Semaines : 1
   - Séances : 2

2. **Exercices** : Au moins 3 exercices dans la bibliothèque

---

## Phase 1 : Vérification du Schéma Supabase

### Test 1.1 : Vérifier les Tables

**Objectif** : S'assurer que toutes les tables nécessaires existent

**Étapes** :
1. Se connecter à Supabase Dashboard
2. Aller dans "Table Editor"
3. Vérifier la présence des tables suivantes :

☐ `program_templates`  
☐ `session_templates`  
☐ `session_exercise_templates`  
☐ `program_assignments`  
☐ `client_programs`  
☐ `client_sessions`  
☐ `client_session_exercises`  
☐ `performance_logs` ou `client_exercise_performance`

**Résultat attendu** : Toutes les tables sont présentes

### Test 1.2 : Vérifier les RLS

**Objectif** : S'assurer que les politiques RLS sont activées

**Étapes** :
1. Dans Supabase Dashboard, aller dans "Authentication" → "Policies"
2. Vérifier que RLS est activé sur toutes les tables ci-dessus

**Résultat attendu** : RLS activé sur toutes les tables

---

## Phase 2 : Assignation de Programme (Coach)

### Test 2.1 : Créer un Programme Template

**Objectif** : Créer un programme template avec des séances

**Étapes** :
1. Se connecter en tant que **coach**
2. Aller dans "Bibliothèque" → "Programmes"
3. Cliquer sur "Créer un programme"
4. Remplir les informations :
   - Nom : "Programme Test Flux"
   - Objectif : "Test du flux complet"
   - Nombre de semaines : 1
5. Ajouter 2 séances :
   - Séance 1 : "Séance A" (3 exercices)
   - Séance 2 : "Séance B" (3 exercices)
6. Sauvegarder le programme

**Résultat attendu** :
- ✅ Le programme est créé
- ✅ Les séances apparaissent dans la liste
- ✅ Aucune erreur n'est affichée

**Vérification en base** :
```sql
SELECT * FROM program_templates WHERE name = 'Programme Test Flux';
SELECT * FROM session_templates WHERE program_template_id = '[PROGRAM_TEMPLATE_ID]';
SELECT * FROM session_exercise_templates WHERE session_template_id IN (
  SELECT id FROM session_templates WHERE program_template_id = '[PROGRAM_TEMPLATE_ID]'
);
```

### Test 2.2 : Assigner le Programme à un Client

**Objectif** : Assigner le programme template au client

**Étapes** :
1. Toujours connecté en tant que **coach**
2. Aller dans "Clients" → Sélectionner le client de test
3. Aller dans l'onglet "Programmes"
4. Cliquer sur "Assigner un programme"
5. Sélectionner "Programme Test Flux"
6. Choisir la date de début : Aujourd'hui
7. Confirmer l'assignation

**Résultat attendu** :
- ✅ Message de confirmation "Programme assigné avec succès"
- ✅ Le programme apparaît dans la liste des programmes du client
- ✅ Statut : "Actif"

**Vérification en base** :
```sql
-- Vérifier l'assignation
SELECT * FROM program_assignments 
WHERE client_id = '[CLIENT_ID]' 
AND program_template_id = '[PROGRAM_TEMPLATE_ID]';

-- Vérifier la duplication du programme
SELECT * FROM client_programs 
WHERE assignment_id = '[ASSIGNMENT_ID]';

-- Vérifier la duplication des séances
SELECT * FROM client_sessions 
WHERE client_program_id = '[CLIENT_PROGRAM_ID]';

-- Vérifier la duplication des exercices
SELECT * FROM client_session_exercises 
WHERE client_session_id IN (
  SELECT id FROM client_sessions WHERE client_program_id = '[CLIENT_PROGRAM_ID]'
);
```

---

## Phase 3 : Visibilité Côté Client

### Test 3.1 : Voir le Programme Assigné

**Objectif** : Vérifier que le client voit le programme assigné

**Étapes** :
1. Se déconnecter du compte coach
2. Se connecter en tant que **client**
3. Aller dans "Mes Programmes" ou "Entraînement"

**Résultat attendu** :
- ✅ Le programme "Programme Test Flux" apparaît
- ✅ Statut : "Actif"
- ✅ Les séances de la semaine sont visibles
- ✅ Séance actuelle : "Séance A"

**Capture d'écran** : Prendre une capture d'écran de la page

### Test 3.2 : Ouvrir une Séance

**Objectif** : Ouvrir la première séance du programme

**Étapes** :
1. Cliquer sur "Séance A"
2. Vérifier que les exercices s'affichent correctement

**Résultat attendu** :
- ✅ La séance s'ouvre
- ✅ Les 3 exercices sont visibles
- ✅ Les informations (séries, reps, charge) sont affichées

---

## Phase 4 : Exécution d'une Séance

### Test 4.1 : Lancer la Séance

**Objectif** : Lancer la séance et renseigner les données

**Étapes** :
1. Cliquer sur "Lancer la séance" ou "Commencer"
2. Pour chaque exercice :
   - Renseigner les répétitions réalisées
   - Renseigner la charge utilisée
   - Renseigner le RPE (1-10)
   - Ajouter un commentaire (optionnel)
3. Compléter tous les exercices

**Résultat attendu** :
- ✅ Les champs de saisie sont fonctionnels
- ✅ Les données sont enregistrées au fur et à mesure
- ✅ Aucune erreur n'apparaît

### Test 4.2 : Terminer la Séance

**Objectif** : Terminer la séance et vérifier l'enregistrement

**Étapes** :
1. Cliquer sur "Terminer la séance"
2. Vérifier le message de confirmation

**Résultat attendu** :
- ✅ Message : "Séance terminée ! Vos performances ont été enregistrées avec succès."
- ✅ Modal de félicitations ou récapitulatif s'affiche
- ✅ Redirection vers la page "Entraînement" ou "Mes Programmes"

**Vérification en base** :
```sql
-- Vérifier que la séance est marquée comme complétée
SELECT * FROM client_sessions 
WHERE id = '[CLIENT_SESSION_ID]' 
AND status = 'completed';

-- Vérifier les logs de performance
SELECT * FROM client_exercise_performance 
WHERE client_session_exercise_id IN (
  SELECT id FROM client_session_exercises 
  WHERE client_session_id = '[CLIENT_SESSION_ID]'
);

-- Vérifier la mise à jour de la progression
SELECT current_week, current_session_order 
FROM program_assignments 
WHERE id = '[ASSIGNMENT_ID]';
```

---

## Phase 5 : Compteur d'Entraînements

### Test 5.1 : Vérifier le Compteur

**Objectif** : Vérifier que le compteur d'entraînements a augmenté

**Étapes** :
1. Toujours connecté en tant que **client**
2. Aller sur la page "Dashboard" ou "Entraînement"
3. Localiser le compteur d'entraînements

**Résultat attendu** :
- ✅ Le compteur affiche "1 entraînement" (ou N+1 si des séances existaient déjà)

### Test 5.2 : Rafraîchir la Page

**Objectif** : Vérifier la persistance du compteur

**Étapes** :
1. Appuyer sur F5 pour rafraîchir la page
2. Vérifier que le compteur affiche toujours la même valeur

**Résultat attendu** :
- ✅ Le compteur affiche toujours "1 entraînement"
- ✅ Les données sont persistées en base

**Vérification en base** :
```sql
-- Compter les séances complétées
SELECT COUNT(*) 
FROM client_sessions 
WHERE client_id = '[CLIENT_ID]' 
AND status = 'completed';
```

---

## Phase 6 : Visibilité Côté Coach

### Test 6.1 : Voir les Séances du Client

**Objectif** : Vérifier que le coach voit les séances complétées

**Étapes** :
1. Se déconnecter du compte client
2. Se connecter en tant que **coach**
3. Aller dans "Clients" → Sélectionner le client de test
4. Aller dans l'onglet "Progression" ou "Séances"

**Résultat attendu** :
- ✅ La séance "Séance A" apparaît dans la liste
- ✅ Date de complétion : Aujourd'hui
- ✅ Statut : "Complétée"

### Test 6.2 : Voir les Détails de la Séance

**Objectif** : Voir les détails de performance de la séance

**Étapes** :
1. Cliquer sur la séance "Séance A"
2. Vérifier les détails affichés

**Résultat attendu** :
- ✅ Les exercices sont listés
- ✅ Les séries, reps, charges sont affichées
- ✅ Les RPE et commentaires sont visibles
- ✅ Le tonnage total est calculé (si applicable)

**Capture d'écran** : Prendre une capture d'écran de la page

---

## Phase 7 : Test de Bout en Bout (E2E)

### Test 7.1 : Compléter une Deuxième Séance

**Objectif** : Valider le flux complet une deuxième fois

**Étapes** :
1. Se connecter en tant que **client**
2. Ouvrir "Séance B"
3. Lancer la séance
4. Renseigner les données
5. Terminer la séance
6. Vérifier le compteur : "2 entraînements"
7. Se connecter en tant que **coach**
8. Vérifier que "Séance B" apparaît dans la progression du client

**Résultat attendu** :
- ✅ Tout le flux fonctionne sans erreur
- ✅ Le compteur affiche "2 entraînements"
- ✅ Le coach voit les 2 séances complétées

---

## Phase 8 : Tests de Régression

### Test 8.1 : Programmes Créés par le Client

**Objectif** : Vérifier que les programmes créés par le client (non assignés) fonctionnent toujours

**Étapes** :
1. Se connecter en tant que **client**
2. Créer un programme personnel (non assigné par le coach)
3. Ajouter des séances
4. Exécuter une séance
5. Vérifier que le compteur augmente

**Résultat attendu** :
- ✅ Le programme personnel fonctionne
- ✅ Le compteur augmente également pour les programmes personnels

### Test 8.2 : Pratiquant (sans coach)

**Objectif** : Vérifier que les pratiquants (non rattachés à un coach) peuvent toujours utiliser l'application

**Étapes** :
1. Créer un compte **pratiquant** (sans `coach_id`)
2. Créer un programme
3. Exécuter une séance
4. Vérifier le compteur

**Résultat attendu** :
- ✅ Le pratiquant peut créer des programmes
- ✅ Le compteur fonctionne
- ✅ Aucune erreur liée à l'absence de coach

---

## Checklist Finale

☐ **Phase 1** : Schéma Supabase vérifié  
☐ **Phase 2** : Programme assigné avec succès  
☐ **Phase 3** : Client voit le programme  
☐ **Phase 4** : Séance exécutée et enregistrée  
☐ **Phase 5** : Compteur d'entraînements à jour  
☐ **Phase 6** : Coach voit les séances du client  
☐ **Phase 7** : Flux E2E validé (2 séances)  
☐ **Phase 8** : Tests de régression passés  

---

## Problèmes Connus et Solutions

### Problème 1 : "Programme non trouvé"

**Symptôme** : Le client ne voit pas le programme assigné

**Causes possibles** :
1. RLS mal configuré sur `program_assignments` ou `client_programs`
2. L'assignation n'a pas créé les instances client

**Solution** :
1. Vérifier les politiques RLS
2. Vérifier que la fonction `assign_program_atomic` a bien été exécutée
3. Vérifier les logs Supabase

### Problème 2 : "Erreur lors de l'enregistrement"

**Symptôme** : Message d'erreur lors de la fin de séance

**Causes possibles** :
1. Nom de table ou colonne incorrect
2. RLS bloque l'insertion
3. Contrainte de clé étrangère non respectée

**Solution** :
1. Vérifier les noms de tables/colonnes dans le code
2. Vérifier les politiques RLS
3. Vérifier les logs Supabase

### Problème 3 : "Compteur ne s'incrémente pas"

**Symptôme** : Le compteur reste à 0 ou ne change pas

**Causes possibles** :
1. La séance n'est pas marquée comme `completed`
2. La fonction `getCompletedSessionsCount()` n'est pas appelée
3. Le composant utilise l'ancien état local

**Solution** :
1. Vérifier que `markSessionAsCompleted()` est bien appelé
2. Vérifier que le composant Dashboard utilise `getCompletedSessionsCount()`
3. Vérifier les logs de la console

---

## Logs et Debugging

### Logs Supabase

Pour voir les logs d'erreur :
1. Aller dans Supabase Dashboard
2. Aller dans "Logs" → "API"
3. Filtrer par niveau : "Error"

### Logs Console

Pour voir les logs JavaScript :
1. Ouvrir la console du navigateur (F12)
2. Filtrer par "error" ou "warn"
3. Vérifier les messages d'erreur

### Requêtes SQL de Debug

```sql
-- Vérifier les assignations
SELECT * FROM program_assignments WHERE client_id = '[CLIENT_ID]';

-- Vérifier les programmes clients
SELECT * FROM client_programs WHERE client_id = '[CLIENT_ID]';

-- Vérifier les séances
SELECT * FROM client_sessions WHERE client_id = '[CLIENT_ID]';

-- Vérifier les performances
SELECT * FROM client_exercise_performance WHERE client_id = '[CLIENT_ID]';

-- Compter les séances complétées
SELECT COUNT(*) FROM client_sessions 
WHERE client_id = '[CLIENT_ID]' AND status = 'completed';
```

---

**Auteur** : Manus AI  
**Date** : 2 décembre 2025  
**Version** : 1.0
