# Analyse de l'erreur de suppression d'un coach

## Problème identifié

Lors de la tentative de suppression d'un coach ayant des clients affiliés, une erreur se produit. L'analyse du code révèle la cause exacte du problème.

## Structure de la base de données

### Table `clients`

La table `clients` contient une colonne `coach_id` qui référence la même table :

```sql
coach_id UUID FOREIGN KEY REFERENCES clients(id) ON DELETE NO ACTION
```

**Point critique** : La règle `ON DELETE NO ACTION` empêche la suppression d'un coach s'il a des clients affiliés.

## Fonction actuelle de suppression

La fonction RPC `delete_user_and_profile` dans Supabase :

```sql
CREATE OR REPLACE FUNCTION public.delete_user_and_profile(user_id_text text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_id uuid;
BEGIN
  -- Convertir le texte en UUID
  user_id := user_id_text::uuid;

  -- Vérifier si l'utilisateur existe avant de tenter la suppression
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    -- Supprimer l'utilisateur de l'authentification (auth.users)
    PERFORM supabase_auth.delete_user(user_id);
  END IF;

  -- Supprimer le profil client (clients)
  DELETE FROM public.clients
  WHERE id = user_id;

  -- Supprimer d'autres données liées si nécessaire
END;
$function$
```

### Problèmes identifiés

1. **Contrainte de clé étrangère** : La règle `ON DELETE NO ACTION` sur `coach_id` empêche la suppression d'un coach ayant des clients affiliés.

2. **Pas de gestion des clients affiliés** : La fonction ne gère pas les clients affiliés avant de supprimer le coach.

3. **Pas de notification** : Aucune notification n'est envoyée aux clients lorsque leur coach est supprimé.

4. **Pas de mise à jour du statut des clients** : Les clients ne sont pas transformés en "pratiquants indépendants" après la suppression de leur coach.

## Solution requise

Pour corriger ce problème, la fonction `delete_user_and_profile` doit être modifiée pour :

1. **Identifier les clients affiliés** au coach à supprimer
2. **Mettre à jour le `coach_id` à NULL** pour tous les clients affiliés (les rendant indépendants)
3. **Créer des notifications** pour informer chaque client que leur coach n'est plus présent sur la plateforme
4. **Supprimer les données du coach** (programmes, exercices, templates créés par le coach)
5. **Préserver toutes les données des clients** (performances, programmes assignés, séances, etc.)
6. **Supprimer le profil et l'authentification du coach**

## Recommandations

### Option 1 : Modifier la contrainte de clé étrangère (recommandé)

Changer la règle `ON DELETE NO ACTION` en `ON DELETE SET NULL` pour la colonne `coach_id` :

```sql
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_coach_id_fkey;

ALTER TABLE clients 
ADD CONSTRAINT clients_coach_id_fkey 
FOREIGN KEY (coach_id) 
REFERENCES clients(id) 
ON DELETE SET NULL;
```

### Option 2 : Modifier la fonction RPC

Ajouter une logique dans la fonction `delete_user_and_profile` pour gérer manuellement les clients affiliés avant la suppression.

## Prochaines étapes

1. Implémenter la solution choisie
2. Ajouter la logique de notification des clients
3. Tester la suppression d'un coach avec des clients affiliés
4. Vérifier que les données des clients sont préservées
