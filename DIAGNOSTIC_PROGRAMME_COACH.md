# 🔍 Diagnostic : Programmes invisibles côté coach

**Date** : 5 décembre 2024  
**Problème** : Les coaches ne voient pas les programmes qu'ils ont créés dans leur bibliothèque d'entraînement

---

## 📊 Situation actuelle

### Données en base

**Programme existant :**
- **ID** : `d94d1f43-fd55-4ef9-8249-b5d74d99e025`
- **Nom** : "Nouveau programme"
- **Coach ID** : `4855bd7c-9f0f-40e7-a7bf-2bd61c730683`
- **Client** : Mickael Roncin (`6e75f7d4-1b99-4adf-9246-b718b5587516`)
- **Semaines** : 4
- **Séances** : 8 séances complètes avec exercices
- **Statut côté client** : ✅ Visible et fonctionnel

**Tables impliquées :**
1. `client_created_programs` : Contient 1 programme (structure simplifiée)
2. `client_programs` : Contient le même programme (même ID)
3. `client_sessions` : 8 séances associées au programme
4. `client_session_exercises` : Exercices détaillés pour chaque séance

---

## 🏗️ Architecture du schéma

### Ancien système (avant novembre 2024)
```
client_created_programs (table hybride)
├── source_type (client_created | coach_assigned)
├── program_template_id
├── modified_by_client
└── viewed_by_coach
```

### Nouveau système (migration du 19 novembre 2024)
```
program_templates (bibliothèque coach)
    ↓
program_assignments (registre central)
    ↓
client_programs (instances client)
    ↓
client_sessions
    ↓
client_session_exercises
```

### Structure actuelle de `client_created_programs`
```sql
- id (uuid)
- assignment_id (uuid)
- client_id (uuid)
- coach_id (uuid)
- name (text)
- objective (text)
- week_count (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**⚠️ Colonnes manquantes** : `source_type`, `program_template_id`, `modified_by_client`, `viewed_by_coach`

---

## 🐛 Cause racine du bug

### 1. Migration incomplète du schéma

La migration du 19 novembre a créé les nouvelles tables mais :
- La table `client_created_programs` **existe toujours**
- Les colonnes métier (`source_type`, etc.) ont été **supprimées**
- Les deux tables (`client_created_programs` et `client_programs`) contiennent **les mêmes données**

### 2. Code frontend obsolète

**Fichier** : `src/services/coachProgramViewService.ts`

```typescript
const { data, error } = await supabase
  .from('client_created_programs')  // ❌ Table obsolète
  .select(`
    id,
    program_template_id,  // ❌ Colonne n'existe plus
    client_id,
    name,
    objective,
    week_count,
    source_type,          // ❌ Colonne n'existe plus
    created_at,
    clients!client_created_programs_client_id_fkey (
      first_name,
      last_name
    )
  `)
  .eq('coach_id', coachId)
  .order('created_at', { ascending: false });
```

**Résultat** : La requête échoue silencieusement ou retourne des données incomplètes.

### 3. Composant frontend attend des données inexistantes

**Fichier** : `src/components/coach/ClientCreatedProgramsList.tsx`

Le composant affiche des badges basés sur :
- `program.source_type` (n'existe plus)
- `program.modified_by_client` (n'existe plus)
- `program.viewed_by_coach` (n'existe plus)

---

## ✅ Pourquoi le client voit le programme

Le code côté client utilise probablement :
- La table `client_programs` (qui fonctionne correctement)
- Ou une autre logique de récupération qui ne dépend pas des colonnes supprimées

---

## 🎯 Solution proposée

### Option 1 : Utiliser `client_programs` (recommandée)

**Avantages** :
- Alignement avec la nouvelle architecture
- Pas de duplication de données
- Cohérence avec le système d'assignation

**Modifications** :
1. Mettre à jour `coachProgramViewService.ts` pour utiliser `client_programs`
2. Adapter les types TypeScript
3. Supprimer les références aux colonnes obsolètes

### Option 2 : Restaurer les colonnes dans `client_created_programs`

**Avantages** :
- Changement minimal du code frontend
- Rétrocompatibilité

**Inconvénients** :
- Duplication de données
- Maintenance de deux tables parallèles
- Risque de désynchronisation

---

## 📋 Plan de correction (Option 1 - Recommandée)

### Étape 1 : Créer un nouveau service coach

**Fichier** : `src/services/coachClientProgramService.ts` (nouveau)

Ce service récupérera les programmes depuis `client_programs` avec les bonnes jointures.

### Étape 2 : Adapter les types

**Fichier** : `src/services/coachProgramViewService.ts`

Simplifier l'interface `ClientCreatedProgramView` pour correspondre aux données disponibles.

### Étape 3 : Mettre à jour le composant

**Fichier** : `src/components/coach/ClientCreatedProgramsList.tsx`

Retirer les badges basés sur les colonnes inexistantes.

### Étape 4 : Créer une vue détaillée pour le coach

**Fichier** : `src/pages/coach/ProgramDetailView.tsx` (nouveau)

Réutiliser le composant `ProgramDetailView.tsx` existant pour afficher les séances et exercices.

### Étape 5 : Ajouter la navigation

Permettre au coach de cliquer sur un programme pour voir le détail (tableau des séances/exercices).

---

## 🧪 Scénarios de test

1. **Création d'un programme par le coach** → Vérifier qu'il apparaît dans la bibliothèque
2. **Assignation à un client** → Vérifier que le programme est visible côté client ET côté coach
3. **Accès au détail** → Vérifier que le coach peut voir le tableau des séances/exercices
4. **Modification par le client** → Vérifier que les changements sont visibles côté coach

---

## 📌 Notes importantes

- La table `client_created_programs` semble être un **alias** ou une **vue matérialisée** de `client_programs`
- Les deux tables ont **exactement la même structure** et contiennent **les mêmes données**
- Il faudra vérifier si `client_created_programs` est une vue SQL ou une vraie table dupliquée
