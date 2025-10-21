# Guide de Test - Fonctionnalité d'Archivage des Exercices

## Objectif
Ce guide vous aidera à tester la nouvelle fonctionnalité d'archivage et de suppression multiple d'exercices dans l'application Virtus.

## Prérequis
- L'application doit être démarrée en mode développement
- Vous devez être connecté en tant qu'administrateur ou coach
- La base de données Supabase doit être configurée avec les tables `exercise_archives` et `archive_cleanup_logs`

## Étapes de Test

### 1. Démarrer l'Application
```bash
cd /home/ubuntu/virtus
npm run dev
```

### 2. Accéder à la Page de Base de Données d'Exercices
- Naviguez vers la page "Base de données d'exercices"
- Vous devriez voir la liste des exercices disponibles

### 3. Tester le Mode de Sélection
1. Cliquez sur le bouton **"Sélectionner"** en haut à droite
2. Vérifiez que :
   - Des cases à cocher apparaissent sur les exercices que vous avez créés
   - Les exercices système (créés par d'autres) sont grisés et non sélectionnables
   - Une barre d'actions bleue apparaît en haut de la page

### 4. Tester la Sélection d'Exercices
1. Cochez quelques exercices individuellement
2. Vérifiez que :
   - Le compteur dans la barre d'actions se met à jour
   - Les exercices sélectionnés ont un anneau bleu autour d'eux
3. Cliquez sur **"Tout sélectionner"**
   - Tous vos exercices doivent être sélectionnés
4. Cliquez sur **"Tout désélectionner"**
   - Tous les exercices doivent être désélectionnés

### 5. Tester l'Archivage d'Exercices
1. Sélectionnez 2-3 exercices
2. Cliquez sur le bouton **"Archiver"**
3. Confirmez l'action dans la boîte de dialogue
4. Vérifiez que :
   - Un message de succès s'affiche
   - Les exercices disparaissent de la liste
   - Le mode de sélection se désactive automatiquement

### 6. Vérifier l'Archivage dans Supabase
1. Ouvrez votre tableau de bord Supabase
2. Naviguez vers **Table Editor** > `exercise_archives`
3. Vérifiez que :
   - Les exercices archivés apparaissent dans la table
   - Les champs `exercise_id`, `exercise_name`, `exercise_data`, `archived_at`, et `archived_by` sont remplis
   - Le champ `marked_for_deletion_at` est NULL

### 7. Tester la Suppression Définitive (Optionnel)
1. Sélectionnez quelques exercices
2. Cliquez sur le bouton **"Supprimer"** (rouge)
3. Confirmez l'action dans la boîte de dialogue
4. Vérifiez que :
   - Un message de succès s'affiche
   - Les exercices disparaissent de la liste
   - Les exercices sont complètement supprimés (pas d'archive créée)

### 8. Tester le Workflow GitHub Actions
1. Allez sur votre dépôt GitHub : `https://github.com/MKtraining-fr/Virtus`
2. Cliquez sur l'onglet **"Actes"** (Actions)
3. Sélectionnez le workflow **"Cleanup Archived Exercises"**
4. Cliquez sur **"Run workflow"** pour déclencher manuellement
5. Attendez que l'exécution se termine
6. Vérifiez les logs pour confirmer que la fonction Edge a été appelée avec succès

### 9. Vérifier le Nettoyage Automatique (Après 3 Mois)
Pour tester le nettoyage automatique sans attendre 3 mois :
1. Ouvrez votre tableau de bord Supabase
2. Allez dans **SQL Editor**
3. Exécutez la requête suivante pour modifier la date d'archivage d'un exercice :
```sql
UPDATE exercise_archives
SET archived_at = NOW() - INTERVAL '91 days'
WHERE id = '<ID_DE_L_EXERCICE>';
```
4. Déclenchez manuellement le workflow GitHub Actions
5. Vérifiez que l'exercice a été supprimé de la table `exercise_archives`
6. Vérifiez que l'opération a été enregistrée dans `archive_cleanup_logs`

## Résultats Attendus

### Interface Utilisateur
- ✅ Le bouton "Sélectionner" active/désactive le mode de sélection
- ✅ Les cases à cocher apparaissent uniquement sur les exercices de l'utilisateur
- ✅ La barre d'actions affiche le nombre d'exercices sélectionnés
- ✅ Les boutons "Archiver" et "Supprimer" fonctionnent correctement
- ✅ Les messages de confirmation et de succès s'affichent

### Base de Données
- ✅ Les exercices archivés sont enregistrés dans `exercise_archives`
- ✅ Les données de l'exercice sont stockées dans le champ `exercise_data` (JSONB)
- ✅ Le champ `archived_by` contient l'ID de l'utilisateur
- ✅ Le nettoyage automatique supprime les exercices après 3 mois
- ✅ Les opérations de nettoyage sont enregistrées dans `archive_cleanup_logs`

### Workflow GitHub Actions
- ✅ Le workflow s'exécute quotidiennement à 2h du matin (UTC)
- ✅ Le workflow peut être déclenché manuellement
- ✅ La fonction Edge Supabase est appelée avec succès
- ✅ Les logs montrent les résultats du nettoyage

## Dépannage

### Problème : Les exercices ne s'archivent pas
**Solution** :
1. Vérifiez que vous êtes bien connecté
2. Vérifiez que les variables d'environnement Supabase sont configurées dans `.env`
3. Vérifiez les logs de la console du navigateur pour les erreurs

### Problème : Erreur "Missing Supabase environment variables"
**Solution** :
1. Vérifiez que le fichier `.env` existe à la racine du projet
2. Vérifiez que les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définies
3. Redémarrez le serveur de développement

### Problème : Le workflow GitHub Actions échoue
**Solution** :
1. Vérifiez que les secrets GitHub sont configurés :
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `CLEANUP_API_KEY`
2. Vérifiez que la fonction Edge `cleanup-archived-exercises` est déployée
3. Vérifiez que les variables d'environnement de la fonction Edge sont configurées dans Supabase

### Problème : Erreur RLS (Row Level Security)
**Solution** :
1. Vérifiez que les politiques RLS sont en place pour `exercise_archives`
2. Exécutez la migration SQL pour créer les politiques si nécessaire
3. Vérifiez que l'utilisateur a les permissions appropriées

## Contact
Pour toute question ou problème, veuillez consulter la documentation Supabase ou contacter l'équipe de développement.

