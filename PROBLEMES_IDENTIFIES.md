# Problèmes Identifiés - Persistance Supabase

## 🔴 Problème Critique

**La majorité des fonctionnalités ne persistent pas les données dans Supabase !**

Les données sont stockées uniquement dans l'état local (mémoire du navigateur), ce qui signifie qu'elles disparaissent après un rafraîchissement de la page.

---

## 📊 Analyse

### ✅ Ce qui fonctionne (Supabase)

1. **Authentification** - Connexion, déconnexion, inscription
2. **Gestion des utilisateurs** - Création et modification via `addUser` et `updateUser`
3. **Chargement initial des données** - Toutes les données sont chargées depuis Supabase au démarrage

### ❌ Ce qui ne fonctionne PAS (État local uniquement)

1. **Programmes d'entraînement** - Créés avec `setPrograms()` uniquement
2. **Exercices** - Ajoutés avec `setExercises()` uniquement
3. **Plans nutritionnels** - Ajoutés avec `setNutritionPlans()` uniquement
4. **Messages** - Ajoutés avec `setMessages()` uniquement
5. **Notifications** - Ajoutées avec `setNotifications()` uniquement
6. **Bilans** - Non vérifiés mais probablement pareil
7. **Formations** - Non vérifiés mais probablement pareil
8. **Produits/Partenaires** - Non vérifiés mais probablement pareil
9. **Suppression d'utilisateurs** - Fonction inexistante

---

## 🔍 Cause du Problème

### Service dataService.ts existe mais n'est PAS utilisé

Le fichier `src/services/dataService.ts` contient toutes les fonctions CRUD nécessaires :
- `getAll()` - Récupérer tous les enregistrements
- `getById()` - Récupérer un enregistrement par ID
- `create()` - Créer un enregistrement
- `update()` - Mettre à jour un enregistrement
- `delete()` - Supprimer un enregistrement
- `getWhere()` - Récupérer avec filtre

**Mais ce service n'est utilisé nulle part dans l'application !**

### Exemple : WorkoutBuilder.tsx (ligne 544)

```typescript
// ❌ Mauvais : Mise à jour locale uniquement
setPrograms([...programs, newProgram]);

// ✅ Correct : Devrait être
const createdProgram = await dataService.create('programs', newProgram);
setPrograms([...programs, createdProgram]);
```

---

## 🎯 Solution Proposée

### Option 1 : Intégrer dataService dans AuthContext (Recommandé)

Créer des fonctions wrapper dans AuthContext qui utilisent dataService :

```typescript
const addProgram = useCallback(async (programData) => {
  const created = await dataService.create('programs', programData);
  setProgramsState(prev => [...prev, created]);
  return created;
}, []);

const updateProgram = useCallback(async (id, programData) => {
  const updated = await dataService.update('programs', id, programData);
  setProgramsState(prev => prev.map(p => p.id === id ? updated : p));
  return updated;
}, []);

const deleteProgram = useCallback(async (id) => {
  await dataService.delete('programs', id);
  setProgramsState(prev => prev.filter(p => p.id !== id));
}, []);
```

**Avantages** :
- Cohérent avec l'architecture actuelle
- Toutes les fonctions accessibles via `useAuth()`
- État local toujours synchronisé avec Supabase

### Option 2 : Utiliser dataService directement dans les pages

Importer et utiliser dataService directement dans chaque page.

**Inconvénients** :
- Nécessite de mettre à jour manuellement l'état local après chaque opération
- Risque de désynchronisation entre état local et Supabase
- Plus de code dupliqué

---

## 📋 Plan d'Action

### Phase 1 : Créer les fonctions CRUD dans AuthContext

Pour chaque type de données :
- Programmes (`addProgram`, `updateProgram`, `deleteProgram`)
- Exercices (`addExercise`, `updateExercise`, `deleteExercise`)
- Plans nutritionnels (`addNutritionPlan`, `updateNutritionPlan`, `deleteNutritionPlan`)
- Messages (`addMessage`, `deleteMessage`)
- Notifications (`addNotification`, `markNotificationAsRead`, `deleteNotification`)
- Bilans (`addBilan`, `updateBilan`, `deleteBilan`)
- Formations (`addFormation`, `updateFormation`, `deleteFormation`)
- Produits (`addProduct`, `updateProduct`, `deleteProduct`)
- Partenaires (`addPartner`, `updatePartner`, `deletePartner`)
- Utilisateurs (`deleteUser` - manquant)

### Phase 2 : Mettre à jour les pages pour utiliser les nouvelles fonctions

Remplacer tous les appels directs à `setPrograms`, `setExercises`, etc. par les nouvelles fonctions.

**Pages prioritaires** :
1. `WorkoutBuilder.tsx` - Création/modification de programmes
2. `Nutrition.tsx` - Création/modification de plans nutritionnels
3. `Messaging.tsx` - Envoi de messages
4. `NewBilan.tsx` - Création de bilans
5. `UserManagement.tsx` - Suppression d'utilisateurs
6. `ShopManagement.tsx` - Gestion produits/partenaires
7. `ClientFormationManagement.tsx` - Gestion formations clients
8. `ProFormationManagement.tsx` - Gestion formations pro

### Phase 3 : Tester chaque fonctionnalité

Vérifier que :
- Les données sont bien créées dans Supabase
- Les données persistent après rafraîchissement
- Les modifications sont bien sauvegardées
- Les suppressions fonctionnent

---

## ⏱️ Estimation

- **Phase 1** : 2-3 heures (création de ~30 fonctions)
- **Phase 2** : 4-6 heures (mise à jour de ~15 pages)
- **Phase 3** : 2-3 heures (tests complets)

**Total** : 8-12 heures de travail

---

## 🚨 Impact Utilisateur

**Actuellement** :
- ❌ Toutes les données créées disparaissent après rafraîchissement
- ❌ Les coachs perdent leurs programmes créés
- ❌ Les clients ne voient pas les programmes assignés après rafraîchissement
- ❌ Les messages ne sont pas sauvegardés
- ❌ Les bilans ne sont pas sauvegardés

**Après correction** :
- ✅ Toutes les données persistent dans Supabase
- ✅ Les utilisateurs peuvent rafraîchir sans perdre leurs données
- ✅ L'application fonctionne comme prévu

---

## 💡 Recommandation

**Commencer immédiatement par la Phase 1** en créant les fonctions CRUD les plus critiques :
1. Programmes d'entraînement (utilisé par les coachs)
2. Plans nutritionnels (utilisé par les coachs)
3. Messages (communication coach-client)
4. Bilans (conversion prospect → client)

Ces 4 fonctionnalités sont essentielles au fonctionnement de l'application.
