# Plan de test pour la suppression d'un coach

## Objectif

Valider que la suppression d'un coach avec des clients affiliés fonctionne correctement après l'application de la migration.

## Prérequis

1. Appliquer la migration `fix_coach_deletion.sql`
2. Avoir un coach avec au moins un client affilié dans la base de données

## Scénarios de test

### Test 1 : Suppression d'un coach avec clients affiliés

**Données de test :**
- Coach : ID = `coach_test_id`
- Client 1 : ID = `client1_id`, coach_id = `coach_test_id`
- Client 2 : ID = `client2_id`, coach_id = `coach_test_id`

**Étapes :**
1. Vérifier que le coach a des clients affiliés :
   ```sql
   SELECT id, first_name, last_name, coach_id 
   FROM clients 
   WHERE coach_id = 'coach_test_id';
   ```

2. Supprimer le coach via l'interface admin ou la fonction RPC :
   ```sql
   SELECT delete_user_and_profile('coach_test_id');
   ```

3. Vérifier que les clients sont maintenant indépendants :
   ```sql
   SELECT id, first_name, last_name, coach_id 
   FROM clients 
   WHERE id IN ('client1_id', 'client2_id');
   ```
   **Résultat attendu :** `coach_id` doit être `NULL` pour les deux clients

4. Vérifier que les notifications ont été créées :
   ```sql
   SELECT user_id, title, message, type, created_at 
   FROM notifications 
   WHERE user_id IN ('client1_id', 'client2_id') 
   AND type = 'coach_removed'
   ORDER BY created_at DESC;
   ```
   **Résultat attendu :** Une notification pour chaque client avec le type `coach_removed`

5. Vérifier que le coach a été supprimé :
   ```sql
   SELECT id FROM clients WHERE id = 'coach_test_id';
   ```
   **Résultat attendu :** Aucun résultat

6. Vérifier que les données des clients sont préservées :
   ```sql
   SELECT id, performance_logs, nutrition_logs, bilans 
   FROM clients 
   WHERE id IN ('client1_id', 'client2_id');
   ```
   **Résultat attendu :** Toutes les données des clients doivent être intactes

### Test 2 : Suppression d'un coach sans clients affiliés

**Données de test :**
- Coach : ID = `coach_solo_id`, aucun client affilié

**Étapes :**
1. Vérifier qu'aucun client n'est affilié :
   ```sql
   SELECT COUNT(*) FROM clients WHERE coach_id = 'coach_solo_id';
   ```
   **Résultat attendu :** 0

2. Supprimer le coach :
   ```sql
   SELECT delete_user_and_profile('coach_solo_id');
   ```

3. Vérifier que le coach a été supprimé :
   ```sql
   SELECT id FROM clients WHERE id = 'coach_solo_id';
   ```
   **Résultat attendu :** Aucun résultat

### Test 3 : Suppression d'un client (non-coach)

**Données de test :**
- Client : ID = `client_test_id`, coach_id = `some_coach_id`

**Étapes :**
1. Supprimer le client :
   ```sql
   SELECT delete_user_and_profile('client_test_id');
   ```

2. Vérifier que le client a été supprimé :
   ```sql
   SELECT id FROM clients WHERE id = 'client_test_id';
   ```
   **Résultat attendu :** Aucun résultat

3. Vérifier qu'aucune notification n'a été créée :
   ```sql
   SELECT COUNT(*) FROM notifications WHERE type = 'coach_removed' AND created_at > NOW() - INTERVAL '1 minute';
   ```
   **Résultat attendu :** 0

### Test 4 : Vérifier la suppression des données du coach

**Données de test :**
- Coach : ID = `coach_data_id`
- Le coach a créé :
  - Des exercices personnalisés
  - Des templates de bilans
  - Des programmes templates
  - Des sessions templates
  - Des recettes
  - Des aliments personnalisés

**Étapes :**
1. Créer des données de test pour le coach
2. Supprimer le coach :
   ```sql
   SELECT delete_user_and_profile('coach_data_id');
   ```

3. Vérifier que les données du coach ont été supprimées :
   ```sql
   -- Exercices
   SELECT COUNT(*) FROM exercises WHERE created_by = 'coach_data_id';
   
   -- Templates de bilans
   SELECT COUNT(*) FROM bilan_templates WHERE coach_id = 'coach_data_id';
   
   -- Programmes templates
   SELECT COUNT(*) FROM programs WHERE created_by = 'coach_data_id' AND is_template = true;
   
   -- Sessions templates
   SELECT COUNT(*) FROM sessions WHERE created_by = 'coach_data_id' AND is_template = true;
   
   -- Recettes
   SELECT COUNT(*) FROM recipes WHERE created_by = 'coach_data_id';
   
   -- Aliments
   SELECT COUNT(*) FROM food_items WHERE created_by = 'coach_data_id';
   ```
   **Résultat attendu :** 0 pour toutes les requêtes

## Résultats attendus globaux

1. ✅ Le coach est supprimé de la table `clients`
2. ✅ Le coach est supprimé de `auth.users`
3. ✅ Les clients affiliés ont leur `coach_id` mis à `NULL`
4. ✅ Une notification est créée pour chaque client affilié
5. ✅ Les données des clients sont préservées
6. ✅ Les données créées par le coach sont supprimées
7. ✅ Aucune erreur de contrainte de clé étrangère n'est levée

## Notes

- Tester d'abord sur un environnement de développement ou de staging
- Faire une sauvegarde de la base de données avant d'appliquer la migration en production
- Vérifier les logs Supabase pour détecter d'éventuelles erreurs
