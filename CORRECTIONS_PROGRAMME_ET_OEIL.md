# Corrections - Erreur modification programme et icône œil

## 📋 Résumé des problèmes

### Problème 1 : Erreur lors de la modification de programme
**Symptôme** : Quand le coach clique sur "Modifier un programme", il est éjecté du site et déconnecté.

**Erreur identifiée** :
```
GET supabase-vendor-hook-5k0.js:1 - 406 (Not Acceptable)
Erreur lors de la récupération du programme
Details: "The result contains 0 rows" - Cannot coerce the result to a single JSON object
```

**Cause** : La fonction `getProgramById` dans `programService.ts` utilisait `.single()` qui lance une erreur si aucun résultat n'est trouvé (0 lignes). Cela provoquait un crash de l'application.

### Problème 2 : Icône œil qui ne devient pas verte
**Symptôme** : Après avoir consulté l'historique des performances d'un client, l'icône œil reste rouge au lieu de devenir verte.

**Cause** : Le composant `ClientHistoryModal` n'appelait jamais la fonction `markProgramAsViewedByCoach` à l'ouverture du modal.

## ✅ Corrections appliquées

### Correction 1 : programService.ts
**Fichier** : `src/services/programService.ts`
**Ligne** : 20

**Avant** :
```typescript
const { data, error } = await supabase
  .from('program_templates')
  .select('*')
  .eq('id', programId)
  .single();
```

**Après** :
```typescript
const { data, error } = await supabase
  .from('program_templates')
  .select('*')
  .eq('id', programId)
  .maybeSingle();
```

**Explication** : `.maybeSingle()` retourne `null` si aucun résultat n'est trouvé au lieu de lancer une erreur. Cela permet une gestion gracieuse des programmes inexistants.

### Correction 2 : ClientHistoryModal.tsx
**Fichier** : `src/components/ClientHistoryModal.tsx`

**Ajouts** :
1. Import de `useEffect` et `markProgramAsViewedByCoach`
2. Ajout d'un `useEffect` qui marque automatiquement tous les programmes du client comme vus à l'ouverture du modal

**Code ajouté** :
```typescript
// Marquer tous les programmes du client comme vus quand le modal s'ouvre
useEffect(() => {
  if (isOpen && !isMinimized && client?.assignedPrograms) {
    client.assignedPrograms.forEach(async (program) => {
      if (!program.viewedByCoach) {
        await markProgramAsViewedByCoach(program.id);
      }
    });
  }
}, [isOpen, isMinimized, client]);
```

**Explication** : Dès que le modal s'ouvre (et n'est pas minimisé), tous les programmes non vus sont automatiquement marqués comme vus dans la base de données. Cela met à jour le statut `viewed_by_coach` dans la table `client_programs`.

## 🧪 Tests recommandés

### Test 1 : Modification de programme
1. Connectez-vous en tant que coach
2. Essayez de modifier un programme (existant ou non)
3. **Résultat attendu** : Pas d'erreur, pas de déconnexion

### Test 2 : Icône œil
1. Connectez-vous en tant que coach
2. Identifiez un client avec l'icône œil rouge
3. Cliquez sur l'icône pour ouvrir l'historique
4. Fermez le modal
5. Rafraîchissez la page
6. **Résultat attendu** : L'icône œil est maintenant verte

## 📊 Impact

### Fichiers modifiés
- `src/services/programService.ts` (1 ligne)
- `src/components/ClientHistoryModal.tsx` (15 lignes)

### Tables affectées
- `client_programs` : Colonne `viewed_by_coach` mise à jour automatiquement

## 🔄 Prochaines étapes

1. **Tester** les corrections en production
2. **Monitorer** les logs pour vérifier qu'il n'y a plus d'erreurs
3. **Valider** que l'icône œil fonctionne correctement pour tous les clients
4. **Considérer** l'ajout d'un système de notification en temps réel pour mettre à jour l'icône sans rafraîchissement de page
