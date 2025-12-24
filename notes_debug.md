# Notes de débogage - Problème Messagerie Client

## Problème identifié
Le client `mickael.roncin@gmail.com` voit "Vous n'êtes assigné à aucun coach" dans la messagerie alors qu'il est bien rattaché au coach `mickaelrcnpro@gmail.com`.

## Analyse du code

### ClientMessaging.tsx (ligne 28-31)
```tsx
const coach = useMemo(() => {
  if (!user || !user.coachId) return null;
  return clients.find((c) => c.id === user.coachId);
}, [user, clients]);
```

Le problème est que :
1. Le client a bien un `coachId` (sinon il ne serait pas visible côté coach)
2. Mais `clients.find()` ne trouve pas le coach dans la liste `clients`

### Cause probable
Avec les anciennes politiques RLS, un client ne pouvait voir que son propre profil.
Maintenant avec les nouvelles politiques, un client peut voir :
- Son propre profil
- Le profil de son coach (via `clients_can_view_own_and_coach`)

La nouvelle politique devrait résoudre ce problème automatiquement.

## Solution
La migration SQL appliquée devrait corriger ce problème car elle inclut :
```sql
CREATE POLICY "clients_can_view_own_and_coach" ON public.clients
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR id = (SELECT coach_id FROM public.clients WHERE id = auth.uid())
);
```

## Test nécessaire
Demander à l'utilisateur de rafraîchir la page et vérifier si le problème persiste.
