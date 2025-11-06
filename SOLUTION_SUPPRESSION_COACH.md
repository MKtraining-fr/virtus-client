# Solution pour la suppression d'un coach avec clients affiliés

## Résumé du problème

Lors de la tentative de suppression d'un coach ayant des clients affiliés, une erreur se produit en raison d'une contrainte de clé étrangère qui empêche la suppression.

## Cause racine identifiée

### 1. Contrainte de clé étrangère restrictive

La table `clients` contient une colonne `coach_id` qui référence la même table avec la règle `ON DELETE NO ACTION` :

```sql
coach_id UUID FOREIGN KEY REFERENCES clients(id) ON DELETE NO ACTION
```

Cette règle empêche la suppression d'un coach s'il a des clients affiliés, car PostgreSQL refuse de supprimer une ligne référencée par d'autres lignes.

### 2. Fonction RPC incomplète

La fonction `delete_user_and_profile` ne gère pas les clients affiliés avant de tenter la suppression du coach, ce qui déclenche une violation de contrainte.

## Solution implémentée

La solution complète se trouve dans le fichier `fix_coach_deletion.sql` et comprend deux modifications principales :

### Modification 1 : Contrainte de clé étrangère

Changement de la règle `ON DELETE NO ACTION` en `ON DELETE SET NULL` :

```sql
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_coach_id_fkey;

ALTER TABLE clients 
ADD CONSTRAINT clients_coach_id_fkey 
FOREIGN KEY (coach_id) 
REFERENCES clients(id) 
ON DELETE SET NULL;
```

**Effet :** Lorsqu'un coach est supprimé, tous les clients affiliés voient automatiquement leur `coach_id` mis à `NULL`, les rendant indépendants.

### Modification 2 : Fonction RPC améliorée

La fonction `delete_user_and_profile` a été complètement réécrite pour :

1. **Détecter le rôle de l'utilisateur** à supprimer (coach ou client)

2. **Si c'est un coach :**
   - Identifier tous les clients affiliés
   - Créer une notification pour chaque client affilié avec le message :
     > "Votre coach [Nom] n'est plus présent sur la plateforme Virtus. Vous êtes maintenant un pratiquant indépendant et conservez l'accès à toutes vos données (programmes, séances, performances, etc.). Vous pouvez continuer à utiliser la plateforme de manière autonome ou vous affilier à un nouveau coach."
   
   - Mettre à jour les clients affiliés (coach_id = NULL)
   
   - Supprimer toutes les données créées par le coach :
     - Templates de bilans
     - Exercices personnalisés
     - Programmes templates
     - Sessions templates
     - Recettes
     - Aliments personnalisés
     - Techniques d'intensification personnalisées

3. **Préserver les données des clients :**
   - Performances (performance_logs)
   - Logs nutritionnels (nutrition_logs)
   - Bilans complétés
   - Programmes assignés (non-templates)
   - Séances assignées (non-templates)

4. **Supprimer le coach :**
   - Suppression de `auth.users`
   - Suppression de la table `clients`

## Avantages de cette solution

1. **Conformité aux exigences :** Les clients sont notifiés et deviennent indépendants
2. **Préservation des données clients :** Toutes les données importantes des clients sont conservées
3. **Nettoyage approprié :** Les données du coach sont supprimées pour éviter les références orphelines
4. **Robustesse :** La contrainte `ON DELETE SET NULL` garantit l'intégrité référentielle
5. **Traçabilité :** Les notifications permettent aux clients de comprendre le changement

## Instructions d'application

### Étape 1 : Sauvegarde

Avant d'appliquer la migration, effectuez une sauvegarde complète de la base de données :

```bash
# Via l'interface Supabase ou via pg_dump
```

### Étape 2 : Application de la migration

Deux options sont disponibles :

**Option A : Via l'interface Supabase SQL Editor**

1. Connectez-vous à votre projet Supabase
2. Allez dans "SQL Editor"
3. Copiez le contenu de `fix_coach_deletion.sql`
4. Exécutez la requête

**Option B : Via MCP CLI (recommandé)**

```bash
manus-mcp-cli tool call apply_migration \
  --server supabase \
  --input '{
    "project_id": "dqsbfnsicmzovlrhuoif",
    "name": "fix_coach_deletion_with_notifications",
    "query": "<contenu du fichier fix_coach_deletion.sql>"
  }'
```

### Étape 3 : Tests

Suivez le plan de test détaillé dans `test_coach_deletion.md` pour valider que la migration fonctionne correctement.

### Étape 4 : Déploiement en production

Une fois les tests validés en développement/staging :

1. Planifiez une fenêtre de maintenance (optionnel, la migration est rapide)
2. Appliquez la migration en production
3. Testez immédiatement avec un compte de test
4. Surveillez les logs pour détecter d'éventuelles erreurs

## Points d'attention

### Données existantes

Si des coachs ont déjà été supprimés ou si des clients ont un `coach_id` référençant un coach inexistant, nettoyez ces données avant d'appliquer la migration :

```sql
-- Identifier les clients avec un coach_id invalide
SELECT id, first_name, last_name, coach_id 
FROM clients 
WHERE coach_id IS NOT NULL 
  AND coach_id NOT IN (SELECT id FROM clients WHERE role = 'coach');

-- Nettoyer les références invalides
UPDATE clients 
SET coach_id = NULL 
WHERE coach_id IS NOT NULL 
  AND coach_id NOT IN (SELECT id FROM clients WHERE role = 'coach');
```

### Notifications

La table `notifications` doit exister avec la structure suivante :

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Si la table n'existe pas ou a une structure différente, adaptez la fonction en conséquence.

### Tables optionnelles

La fonction tente de supprimer des données de plusieurs tables. Si certaines tables n'existent pas dans votre schéma (par exemple `intensity_techniques`), vous pouvez :

1. Commenter les lignes correspondantes dans la fonction
2. Ou laisser tel quel (PostgreSQL ignorera les suppressions sur des tables inexistantes si vous ajoutez des vérifications)

## Rollback

Si vous devez annuler la migration, voici les étapes :

```sql
-- 1. Restaurer l'ancienne contrainte
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_coach_id_fkey;

ALTER TABLE clients 
ADD CONSTRAINT clients_coach_id_fkey 
FOREIGN KEY (coach_id) 
REFERENCES clients(id) 
ON DELETE NO ACTION;

-- 2. Restaurer l'ancienne fonction (version simplifiée)
CREATE OR REPLACE FUNCTION public.delete_user_and_profile(user_id_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_id uuid;
BEGIN
  user_id := user_id_text::uuid;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    PERFORM supabase_auth.delete_user(user_id);
  END IF;

  DELETE FROM public.clients WHERE id = user_id;
END;
$function$;
```

## Support et questions

Pour toute question ou problème lors de l'application de cette solution, consultez :

- La documentation Supabase sur les fonctions RPC
- La documentation PostgreSQL sur les contraintes de clés étrangères
- Les logs Supabase pour le débogage

## Conclusion

Cette solution résout complètement le problème de suppression des coachs avec clients affiliés tout en respectant les exigences fonctionnelles :

✅ Suppression du coach possible même avec des clients affiliés  
✅ Clients notifiés de la suppression de leur coach  
✅ Clients rendus indépendants (coach_id = NULL)  
✅ Données des clients préservées  
✅ Données du coach supprimées  
✅ Intégrité référentielle maintenue  

La migration est prête à être appliquée et testée.
