# Guide de Correction des Politiques RLS pour bilan_templates

## Problème Identifié

Les politiques RLS (Row Level Security) de la table `bilan_templates` empêchent les mises à jour du template "Bilan Initial" via l'API Supabase avec la clé anonyme.

## Solution

Exécuter le script SQL `fix-bilan-templates-rls.sql` dans le SQL Editor de Supabase.

## Étapes à Suivre

### 1. Se connecter à Supabase

1. Aller sur https://supabase.com/dashboard
2. Se connecter avec votre compte
3. Sélectionner le projet `dqsbfnsicmzovlrhuoif`

### 2. Ouvrir le SQL Editor

1. Dans le menu latéral gauche, cliquer sur "SQL Editor"
2. Cliquer sur "New query" pour créer une nouvelle requête

### 3. Exécuter le Script SQL

1. Copier tout le contenu du fichier `fix-bilan-templates-rls.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur "Run" (ou appuyer sur Ctrl+Enter)

### 4. Vérifier le Résultat

Le script devrait afficher les politiques créées. Vous devriez voir :
- `Allow read bilan_templates`
- `Allow insert bilan_templates`
- `Allow update bilan_templates`
- `Allow delete bilan_templates`

### 5. Tester la Mise à Jour

Après avoir exécuté le script SQL, revenir au terminal et exécuter :

```bash
cd /home/ubuntu/virtus
node force-update.cjs
```

Le résultat devrait maintenant afficher :
```
✅ SUCCÈS! Le template a été mis à jour correctement!
  ✓ Champ "activité physique" déplacé
  ✓ Champ "allergies" converti en checkbox avec 15 options
  ✓ Option "Autre" avec champ conditionnel ajoutée
```

## Modifications Appliquées par le Script

Le script SQL :
1. Supprime les anciennes politiques RLS
2. Crée de nouvelles politiques permissives :
   - **Lecture** : Accessible à tous pour les templates publics (coach_id NULL)
   - **Insertion** : Accessible à tous
   - **Mise à jour** : Accessible à tous pour les templates publics
   - **Suppression** : Réservée aux propriétaires

## Contenu du Script SQL

```sql
-- Voir le fichier fix-bilan-templates-rls.sql
```

## Alternative : Utilisation de la Clé Service Role

Si vous ne souhaitez pas modifier les politiques RLS, vous pouvez également :

1. Récupérer la clé "service_role" depuis Supabase (Settings > API)
2. L'ajouter dans le fichier `.env` :
   ```
   VITE_SUPABASE_SERVICE_KEY=votre_cle_service_role
   ```
3. Utiliser cette clé dans les scripts de mise à jour (elle bypass les politiques RLS)

**⚠️ Attention** : La clé service_role ne doit JAMAIS être exposée côté client !
