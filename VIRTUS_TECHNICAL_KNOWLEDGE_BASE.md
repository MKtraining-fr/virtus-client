# Base de Connaissance Technique - Projet Virtus

**Auteur:** Manus AI  
**Dernière mise à jour:** 16 décembre 2025  
**Version:** 1.3

---

## 📋 Objectif de ce Document

Ce document constitue le **journal technique central** du projet Virtus. Il sert de référence exhaustive pour comprendre l'architecture, l'historique des interventions, et l'état actuel du système. À chaque nouvelle intervention significative, une nouvelle section sera ajoutée en haut de la partie "Historique des Interventions", permettant de maintenir un contexte complet et à jour pour toutes les futures collaborations.

---

# HISTORIQUE DES INTERVENTIONS

## Intervention #4 - Correction Urgente des RLS Policies (Décembre 2025)

**Date:** 16 décembre 2025  
**Type:** Intervention d'urgence  
**Statut:** ✅ Résolu et déployé

### Contexte

Après le déploiement de l'Intervention #3, l'application est devenue **complètement inaccessible** avec des erreurs 500 (Internal Server Error) empêchant toute connexion. Les logs Supabase ont révélé une **récursion infinie** dans les Row Level Security (RLS) policies de la table `clients`.

### Problème Critique Identifié

**Symptôme:** `ERROR: infinite recursion detected in policy for relation "clients"`

**Cause racine:** Les policies RLS vérifiaient le rôle de l'utilisateur en faisant un `SELECT` sur la table `clients`, ce qui déclenchait à nouveau les policies RLS, créant une boucle infinie.

**Policies problématiques:**
```sql
-- Exemple de policy avec récursion
CREATE POLICY "admins_can_view_all_profiles" ON clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients clients_1 
    WHERE clients_1.id = auth.uid() 
    AND clients_1.role = 'admin'
  )
);
```

**Pourquoi c'est récursif:**
1. L'utilisateur tente un `SELECT` sur `clients`
2. PostgreSQL vérifie la policy `admins_can_view_all_profiles`
3. La policy fait un `SELECT` sur `clients` pour vérifier le rôle
4. PostgreSQL vérifie à nouveau la policy... → **Boucle infinie** 🔄

### Fonctions RPC Affectées

Deux fonctions RPC créées dans l'Intervention #3 aggravaient le problème en accédant à la table `clients` avec `SECURITY DEFINER`:

**1. `assign_bilan_atomic`**
```sql
-- Ligne problématique
SELECT first_name || ' ' || last_name INTO v_coach_name 
FROM clients 
WHERE id = p_coach_id;
```

**2. `complete_bilan_atomic`**
```sql
-- Ligne problématique
SELECT first_name || ' ' || last_name INTO v_client_name 
FROM clients 
WHERE id = v_assignment.client_id;
```

### Solution Appliquée

#### Étape 1: Désactivation Temporaire de RLS (Urgence)

```sql
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
```

**Résultat:** Restauration immédiate de l'accès à l'application.

#### Étape 2: Correction des Fonctions RPC

Suppression des requêtes `SELECT` sur `clients` dans les fonctions:

**`assign_bilan_atomic` corrigée:**
```sql
CREATE OR REPLACE FUNCTION assign_bilan_atomic(...) 
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_assignment_id UUID;
  v_template_data JSONB;
  v_template_name TEXT;
  -- v_coach_name TEXT; ← Supprimé
  v_result JSON;
BEGIN
  -- SELECT ... FROM clients ... ← Supprimé
  
  -- Message de notification simplifié
  INSERT INTO notifications (...)
  VALUES (..., 'Vous avez reçu un nouveau bilan : ' || v_template_name, ...);
  
  RETURN v_result;
END;
$$;
```

**`complete_bilan_atomic` corrigée:**
```sql
CREATE OR REPLACE FUNCTION complete_bilan_atomic(...) 
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  -- v_client_name TEXT; ← Supprimé
BEGIN
  -- SELECT ... FROM clients ... ← Supprimé
  
  -- Message de notification simplifié
  INSERT INTO notifications (...)
  VALUES (..., 'Un client a complété le bilan : ' || v_template_name, ...);
  
  RETURN v_result;
END;
$$;
```

#### Étape 3: Refonte Complète des RLS Policies

**Suppression de toutes les anciennes policies:**
```sql
DROP POLICY IF EXISTS admins_can_insert_clients ON clients;
DROP POLICY IF EXISTS admins_can_update_all_profiles ON clients;
DROP POLICY IF EXISTS admins_can_view_all_profiles ON clients;
DROP POLICY IF EXISTS coaches_can_insert_clients ON clients;
DROP POLICY IF EXISTS coaches_can_update_their_clients ON clients;
DROP POLICY IF EXISTS coaches_can_view_their_clients ON clients;
DROP POLICY IF EXISTS only_admins_can_delete ON clients;
DROP POLICY IF EXISTS users_can_update_own_profile ON clients;
DROP POLICY IF EXISTS users_can_view_own_profile ON clients;
```

**Création de nouvelles policies simplifiées (sans récursion):**

```sql
-- SELECT: Utilisateurs voient leur propre profil
CREATE POLICY "Users can view own profile" ON clients FOR SELECT
USING (auth.uid() = id);

-- SELECT: Coaches voient leurs clients
CREATE POLICY "Coaches can view their clients" ON clients FOR SELECT
USING (auth.uid() = coach_id OR auth.uid() = id);

-- UPDATE: Utilisateurs modifient leur propre profil
CREATE POLICY "Users can update own profile" ON clients FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Coaches modifient leurs clients
CREATE POLICY "Coaches can update their clients" ON clients FOR UPDATE
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

-- INSERT: Utilisateurs authentifiés peuvent créer des profils
CREATE POLICY "Authenticated users can insert" ON clients FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

**Principe clé:** Utiliser uniquement les colonnes de la ligne actuelle (`id`, `coach_id`) et `auth.uid()`, **jamais de sous-requête SELECT**.

#### Étape 4: Réactivation de RLS

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
```

### Résultat Final

✅ **Application accessible** : Connexion restaurée pour tous les utilisateurs  
✅ **Pas de récursion** : Policies simplifiées sans sous-requêtes  
✅ **Sécurité maintenue** : Utilisateurs voient uniquement leurs données  
✅ **Fonctions RPC corrigées** : Plus d'accès à la table `clients`  

⚠️ **Limitation connue** : Les privilèges admin spéciaux ont été temporairement supprimés. Les admins sont traités comme des coaches.

### Leçons Apprises

1. **RLS Policies et Récursion**
   - ❌ Ne JAMAIS faire de `SELECT` sur la table elle-même dans une policy
   - ✅ Utiliser uniquement les colonnes de la ligne courante et `auth.uid()`
   - ✅ Pour les vérifications de rôle, stocker le rôle dans `auth.jwt()` metadata

2. **Fonctions SECURITY DEFINER**
   - ⚠️ Avec `SECURITY DEFINER`, les fonctions RPC déclenchent les RLS policies
   - ✅ Minimiser les accès aux tables avec RLS dans ces fonctions
   - ✅ Privilégier les données déjà disponibles (paramètres, autres tables)

3. **Tests de Déploiement**
   - ⚠️ Tester les RLS policies avant le déploiement en production
   - ✅ Vérifier les logs Supabase immédiatement après un déploiement
   - ✅ Avoir un plan de rollback rapide (désactivation RLS)

4. **Architecture de Sécurité**
   - Pour les systèmes avec rôles complexes (admin, coach, client), considérer:
     - Stocker le rôle dans `auth.jwt()` via un trigger
     - Utiliser des vues matérialisées pour les vérifications de rôle
     - Séparer les tables par rôle si nécessaire

### Fichiers Modifiés

**Supabase (via MCP):**
- Fonction `assign_bilan_atomic` (correction)
- Fonction `complete_bilan_atomic` (correction)
- Toutes les RLS policies de la table `clients` (refonte complète)

**Aucun fichier code source modifié** (intervention uniquement en base de données)

### Prochaines Étapes Recommandées

1. **Restaurer les privilèges admin** via une approche sans récursion:
   - Option A: Stocker le rôle dans `auth.jwt()` metadata
   - Option B: Créer une table `user_roles` séparée sans RLS
   - Option C: Utiliser une fonction `SECURITY DEFINER` dédiée pour vérifier le rôle

2. **Ajouter des tests automatisés** pour les RLS policies

3. **Documenter les patterns RLS** à suivre pour les futures tables

---

## Intervention #3 - Corrections Finales du Système de Bilans (Décembre 2025)

**Date:** 15 décembre 2025  
**Pull Request:**
- [PR #296](https://github.com/MKtraining-fr/virtus/pull/296) - `feature/bilan-assignment-delete` ⏳ En attente de merge

**Statut:** Prêt pour déploiement.

### Contexte

Suite à l'implémentation du système de bilans (Intervention #2), plusieurs problèmes critiques ont été identifiés lors des tests utilisateurs :
1. Impossibilité d'assigner le même template plusieurs fois (contrainte d'unicité trop stricte)
2. Absence de fonctionnalité de suppression d'assignation
3. Date planifiée non visible dans l'interface
4. Absence de rafraîchissement automatique après les actions

Ces limitations empêchaient l'utilisation normale du système pour des cas d'usage récurrents (ex: bilan mensuel).

### Problèmes Résolus

#### Problème 1: Contrainte d'Unicité Trop Stricte

**Description:** La contrainte `UNIQUE (client_id, bilan_template_id)` empêchait d'assigner le même template plusieurs fois au même client, même avec des dates différentes.

**Impact:** Impossible de créer des bilans récurrents (ex: "Bilan mensuel" assigné chaque mois).

**Diagnostic:**
```sql
-- Ancienne contrainte
ALTER TABLE bilan_assignments 
ADD CONSTRAINT bilan_assignments_client_id_bilan_template_id_key 
UNIQUE (client_id, bilan_template_id);
```

**Solution:**
```sql
-- Suppression de l'ancienne contrainte
ALTER TABLE bilan_assignments 
DROP CONSTRAINT IF EXISTS bilan_assignments_client_id_bilan_template_id_key;

-- Création d'un index unique partiel incluant la date
CREATE UNIQUE INDEX bilan_assignments_active_unique 
ON bilan_assignments (client_id, bilan_template_id, scheduled_date) 
WHERE status IN ('assigned', 'in_progress');
```

**Avantages:**
- ✅ Permet plusieurs assignations du même template avec des dates différentes
- ✅ Empêche les doublons pour la même date (protection contre les erreurs)
- ✅ Permet de réassigner un template après complétion
- ✅ Conserve l'historique des bilans complétés

#### Problème 2: Génération d'UUID dans assign_bilan_atomic

**Description:** La fonction RPC utilisait `RETURNING id INTO v_assignment_id` sans générer explicitement l'UUID, causant des conflits de clé primaire.

**Erreur:** `duplicate key value violates unique constraint "bilan_assignments_pkey"`

**Solution:**
```sql
CREATE OR REPLACE FUNCTION assign_bilan_atomic(...)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
  ...
BEGIN
  -- Génération explicite de l'UUID
  v_assignment_id := gen_random_uuid();
  
  INSERT INTO bilan_assignments (
    id,  -- UUID généré explicitement
    coach_id,
    client_id,
    ...
  ) VALUES (
    v_assignment_id,
    p_coach_id,
    p_client_id,
    ...
  );
  ...
END;
$$;
```

#### Problème 3: Absence de Fonctionnalité de Suppression

**Description:** Aucun moyen pour le coach de supprimer une assignation erronée ou obsolète.

**Impact:** Accumulation d'assignations non désirées, impossibilité de corriger les erreurs.

**Solution Complète:**

**1. Fonction RPC Supabase avec vérification d'autorisation:**
```sql
CREATE OR REPLACE FUNCTION delete_bilan_assignment(
  p_assignment_id UUID,
  p_coach_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_record RECORD;
  v_result JSON;
BEGIN
  -- Vérification de l'existence et récupération des infos
  SELECT id, coach_id, client_id, status INTO v_assignment_record
  FROM bilan_assignments
  WHERE id = p_assignment_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Assignment not found'
    );
  END IF;

  -- Vérification d'autorisation
  IF v_assignment_record.coach_id != p_coach_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: You can only delete your own assignments'
    );
  END IF;

  -- Suppression de l'assignation
  DELETE FROM bilan_assignments WHERE id = p_assignment_id;
  
  -- Suppression des notifications associées
  DELETE FROM notifications
  WHERE type = 'assignment'
    AND user_id = v_assignment_record.client_id
    AND message LIKE '%bilan%';

  RETURN json_build_object(
    'success', true,
    'message', 'Assignment deleted successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Error deleting assignment'
    );
END;
$$;
```

**2. Service TypeScript:**
```typescript
export interface DeleteBilanAssignmentParams {
  assignmentId: string;
  coachId: string;
}

export interface DeleteBilanAssignmentResult {
  success: boolean;
  error?: string;
  message?: string;
}

export const deleteBilanAssignment = async (
  params: DeleteBilanAssignmentParams
): Promise<DeleteBilanAssignmentResult> => {
  const { data, error } = await supabase.rpc('delete_bilan_assignment', {
    p_assignment_id: params.assignmentId,
    p_coach_id: params.coachId,
  });
  
  if (error || !data?.success) {
    console.error('[deleteBilanAssignment] Error:', error || data?.error);
    return { success: false, error: data?.error || error.message };
  }
  
  return data as DeleteBilanAssignmentResult;
};
```

**3. Hook React:**
```typescript
const deleteAssignment = useCallback(
  async (params: DeleteBilanAssignmentParams): Promise<boolean> => {
    const result = await deleteBilanAssignment(params);
    if (result.success) {
      await loadAssignments(); // Rechargement automatique
      return true;
    }
    setError(result.error || 'Erreur lors de la suppression');
    return false;
  },
  [loadAssignments]
);
```

**4. Interface utilisateur (ClientBilanHistory.tsx):**
```tsx
const handleDeleteAssignment = async (assignmentId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette assignation ?')) {
    return;
  }

  setIsDeleting(assignmentId);

  const result = await deleteBilanAssignment({
    assignmentId,
    coachId,
  });

  setIsDeleting(null);

  if (result.success) {
    alert('Assignation supprimée avec succès.');
    await loadAssignments();
  } else {
    alert(`Erreur lors de la suppression : ${result.error}`);
  }
};

// Dans le rendu
<Button
  size="sm"
  variant="danger"
  onClick={() => handleDeleteAssignment(bilan.id)}
  disabled={isDeleting === bilan.id}
>
  {isDeleting === bilan.id ? 'Suppression...' : 'Supprimer'}
</Button>
```

#### Problème 4: Date Planifiée Non Affichée

**Description:** L'interface affichait uniquement `assigned_at` (date de création), pas `scheduled_date` (date planifiée par le coach).

**Impact:** Confusion sur la date à laquelle le bilan doit être rempli.

**Solution:**
```tsx
<div className="text-sm text-gray-600 mt-1 space-y-1">
  <p>
    Assigné le: {new Date(bilan.assigned_at).toLocaleDateString('fr-FR')}
  </p>
  {bilan.scheduled_date && (
    <p>
      Date planifiée: {new Date(bilan.scheduled_date + 'T00:00:00').toLocaleDateString('fr-FR')}
    </p>
  )}
  {bilan.completed_at && (
    <p>
      Complété le: {new Date(bilan.completed_at).toLocaleDateString('fr-FR')}
    </p>
  )}
</div>
```

**Note technique:** Ajout de `'T00:00:00'` pour éviter les problèmes de fuseau horaire avec les dates SQL (format `YYYY-MM-DD`).

#### Problème 5: Absence de Rafraîchissement Automatique

**Description:** Après assignation ou suppression, il fallait rafraîchir manuellement la page pour voir les changements.

**Impact:** Mauvaise expérience utilisateur, impression que l'action n'a pas fonctionné.

**Solution - Pattern Callback React:**

**1. BilanAssignmentModal - Callback de succès:**
```tsx
interface BilanAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onAssignmentSuccess?: () => void; // Nouveau callback
}

const BilanAssignmentModal: React.FC<BilanAssignmentModalProps> = ({
  isOpen,
  onClose,
  client,
  onAssignmentSuccess
}) => {
  const handleAssign = async () => {
    // ...
    if (success) {
      alert(`Bilan assigné avec succès !`);
      // Notifier le parent pour rafraîchir la liste
      if (onAssignmentSuccess) {
        onAssignmentSuccess();
      }
      onClose();
    }
  };
};
```

**2. ClientBilanHistory - Prop de rafraîchissement:**
```tsx
interface ClientBilanHistoryProps {
  clientId: string;
  coachId: string;
  clientStatus?: 'prospect' | 'active' | 'archived';
  refreshTrigger?: number; // Nouveau trigger
}

const ClientBilanHistory: React.FC<ClientBilanHistoryProps> = ({
  clientId,
  coachId,
  clientStatus,
  refreshTrigger,
}) => {
  useEffect(() => {
    loadAssignments();
  }, [clientId, refreshTrigger]); // Rechargement quand refreshTrigger change
};
```

**3. ClientProfile - Orchestration:**
```tsx
const ClientProfile: React.FC = () => {
  const [bilanRefreshTrigger, setBilanRefreshTrigger] = useState(0);

  const handleBilanAssignmentSuccess = () => {
    // Incrémenter le trigger pour forcer le rafraîchissement
    setBilanRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <ClientBilanHistory 
        clientId={client.id} 
        coachId={user.id} 
        clientStatus={client.status}
        refreshTrigger={bilanRefreshTrigger}
      />

      <BilanAssignmentModal
        isOpen={showBilanAssignmentModal}
        onClose={() => setShowBilanAssignmentModal(false)}
        client={client}
        onAssignmentSuccess={handleBilanAssignmentSuccess}
      />
    </>
  );
};
```

### Fichiers Modifiés

**Base de données:**
- `supabase/migrations/20251215_fix_bilan_assignments_constraints.sql` (créé)

**Backend/Services:**
- `src/services/bilanAssignmentService.ts` (ajout de `deleteBilanAssignment`)
- `src/hooks/useBilanAssignments.ts` (ajout de `deleteAssignment`)

**Frontend/Components:**
- `src/components/coach/BilanAssignmentModal.tsx` (callback `onAssignmentSuccess`)
- `src/components/ClientBilanHistory.tsx` (affichage date planifiée, prop `refreshTrigger`, bouton supprimer)
- `src/pages/ClientProfile.tsx` (mécanisme de rafraîchissement)

### Tests Effectués

✅ Suppression de la contrainte d'unicité stricte dans Supabase  
✅ Création de l'index unique partiel avec date  
✅ Correction de `assign_bilan_atomic` avec génération UUID explicite  
✅ Création de `delete_bilan_assignment` RPC function  
✅ Test d'assignation multiple du même template avec dates différentes  
✅ Test de suppression d'assignation depuis l'interface coach  
✅ Vérification de l'affichage de la date planifiée  
✅ Validation du rafraîchissement automatique après assignation  

### Résultat Final

**Fonctionnalités opérationnelles:**
- ✅ Assignation multiple du même template avec dates différentes
- ✅ Suppression d'assignation depuis le profil client (côté coach)
- ✅ Affichage distinct de la date d'assignation et de la date planifiée
- ✅ Rafraîchissement automatique après toute action (assignation, suppression)
- ✅ Protection contre les doublons pour la même date
- ✅ Génération correcte des UUID pour éviter les conflits

**Architecture technique:**
- Index unique partiel PostgreSQL pour performance et flexibilité
- Fonction RPC sécurisée avec vérification d'autorisation
- Pattern callback React pour communication parent-enfant
- Hook personnalisé avec rechargement automatique

### Leçons Apprises

1. **Contraintes d'unicité partielles:** Les index uniques partiels avec clause `WHERE` sont très puissants pour implémenter des règles métier complexes tout en maintenant la flexibilité.

2. **Génération explicite d'UUID:** Toujours générer les UUID explicitement avec `gen_random_uuid()` dans les fonctions PL/pgSQL pour éviter les conflits.

3. **Pattern callback React:** Pour la communication parent-enfant, le pattern callback est plus simple et plus performant que les context API ou les state managers pour des cas d'usage simples.

4. **Dates SQL et fuseaux horaires:** Toujours ajouter `'T00:00:00'` lors de la conversion de dates SQL (`YYYY-MM-DD`) en objets JavaScript pour éviter les décalages de fuseau horaire.

---

## Intervention #2 - Implémentation Complète du Système de Bilans (Décembre 2025)

**Date:** 14 décembre 2025  
**Pull Request:**
- [PR #294](https://github.com/MKtraining-fr/virtus/pull/294) - `feat/bilan-system-complete` ✅ Mergée

**Statut:** Déployé en production avec succès.

### Contexte

L'application Virtus nécessitait un système de bilans permettant aux coachs de créer des questionnaires personnalisés, de les assigner aux clients avec des fréquences récurrentes, et de collecter les réponses de manière structurée. Ce système devait s'intégrer harmonieusement avec l'architecture existante tout en respectant les principes de transaction atomique et de source de vérité unique établis lors de l'Intervention #1.

### Fonctionnalité Implémentée

Le système de Bilans est une **mécanique complète de questionnaires dynamiques** permettant :

1. **Création de templates de bilans** par les coachs avec support de 8 types de champs :
   - Texte court (`text`)
   - Texte long (`textarea`)
   - Nombre (`number`)
   - Date (`date`)
   - Liste déroulante (`select`)
   - Cases à cocher multiples (`checkbox`)
   - Oui/Non (`yesno`)
   - Échelle de 1 à 10 (`scale`)

2. **Assignation récurrente** aux clients avec 4 fréquences possibles :
   - Envoi unique (`once`)
   - Hebdomadaire (`weekly`)
   - Toutes les 2 semaines (`biweekly`)
   - Mensuel (`monthly`)

3. **Complétion côté client** avec interface intuitive et validation des réponses

4. **Visualisation des réponses** côté coach avec historique complet

5. **Gestion avancée** :
   - Badge "X clients assignés" sur chaque template
   - Suppression de templates avec cascade automatique
   - Snapshot des templates pour préserver l'historique
   - Thème clair/sombre adaptatif

### Problèmes Rencontrés

#### Problème 1: Incohérence des Noms de Tables

**Description:** Les fonctions RPC créées utilisaient `FROM profiles` pour récupérer les noms d'utilisateurs, mais la table `profiles` dans la base de données ne contient pas les colonnes `first_name`, `last_name`, `role`. Ces informations sont stockées dans la table `clients`.

**Impact:** Les assignations de bilans échouaient systématiquement avec l'erreur "column first_name does not exist".

**Solution:** Correction des fonctions RPC `assign_bilan_atomic` et `complete_bilan_atomic` pour utiliser `FROM clients` au lieu de `FROM profiles`. Mise à jour du fichier de migration pour éviter ce problème à l'avenir.

#### Problème 2: Types TypeScript Manquants

**Description:** Les types `yesno`, `scale` et `checkbox` n'étaient pas définis dans le type TypeScript `BilanFieldType`, bien que le code de rendu de ces champs soit présent.

**Impact:** Les champs Oui/Non et Échelle ne s'affichaient pas dans les formulaires de bilans.

**Solution:** Ajout des types manquants dans `src/types.ts` :
```typescript
export type BilanFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'yesno'
  | 'scale'
  | 'multiselect'
  | 'file'
```

#### Problème 3: Badge d'Assignation Non Réactif

**Description:** Le badge "X clients assignés" ne se mettait à jour qu'après un rafraîchissement complet de la page.

**Impact:** Expérience utilisateur dégradée, impression que l'assignation n'a pas fonctionné.

**Solution:** Ajout d'un rechargement automatique des compteurs d'assignations après une assignation réussie dans `BilanTemplates.tsx`.

#### Problème 4: Comptage Incorrect des Assignations

**Description:** Le code utilisait `const { data } = await supabase.from('bilan_assignments').select('id', { count: 'exact', head: true })` puis `data?.length`, mais avec `head: true`, Supabase ne retourne pas de tableau `data` mais un `count` directement.

**Impact:** Le badge affichait toujours "0 clients assignés" même avec des assignations actives.

**Solution:** Correction pour utiliser `const { count }` au lieu de `const { data }` et `count || 0` au lieu de `data?.length || 0`.

#### Problème 5: Contrainte de Clé Étrangère Trop Restrictive

**Description:** La contrainte FK sur `bilan_assignments.bilan_template_id` empêchait la suppression de templates même avec des assignations actives.

**Impact:** Impossibilité de supprimer un template une fois assigné.

**Solution:** Modification de la contrainte FK pour utiliser `ON DELETE CASCADE` via la migration `20251214_fix_bilan_template_deletion.sql`.

#### Problème 6: Squash Merge et Perte de Commits

**Description:** Lors du merge de la PR #294, GitHub a effectué un squash merge qui a regroupé tous les commits en un seul, mais avec le code de la branche au moment du merge initial, sans les corrections ultérieures.

**Impact:** Les corrections de bugs n'étaient pas présentes en production après le merge.

**Solution:** Application manuelle des migrations et corrections directement en base de données Supabase, puis mise à jour du code dans le dépôt pour synchronisation.

### Solutions Implémentées

#### Solution 1: Architecture de Base de Données

**Création de deux tables principales:**

1. **`bilan_templates`** - Stockage des modèles de bilans
   - `id` (UUID, PK)
   - `coach_id` (UUID, FK vers clients)
   - `name` (TEXT)
   - `sections` (JSONB) - Structure des sections et champs
   - `created_at`, `updated_at` (TIMESTAMP)

2. **`bilan_assignments`** - Gestion des assignations
   - `id` (UUID, PK)
   - `coach_id` (UUID, FK vers clients)
   - `client_id` (UUID, FK vers clients)
   - `bilan_template_id` (UUID, FK vers bilan_templates avec ON DELETE CASCADE)
   - `status` (TEXT) - 'assigned', 'completed', 'archived'
   - `frequency` (TEXT) - 'once', 'weekly', 'biweekly', 'monthly'
   - `scheduled_date` (DATE)
   - `assigned_at`, `completed_at` (TIMESTAMP)
   - `parent_assignment_id` (UUID, FK vers bilan_assignments) - Pour tracer les récurrences
   - `data` (JSONB) - Snapshot du template + réponses

**Fichiers:**
- `supabase/migrations/20251214_enhance_bilan_system.sql` (482 lignes)
- `supabase/migrations/20251214_fix_bilan_template_deletion.sql` (27 lignes)
- `supabase/migrations/20251214_fix_rls_policies.sql` (65 lignes)

#### Solution 2: Fonctions RPC Atomiques

**Trois fonctions PostgreSQL pour garantir l'atomicité:**

1. **`assign_bilan_atomic`** - Assignation atomique d'un bilan
   - Vérifie l'existence du template
   - Crée un snapshot du template dans `data`
   - Insère l'assignation
   - Crée une notification pour le client
   - Rollback automatique en cas d'erreur

2. **`complete_bilan_atomic`** - Complétion atomique d'un bilan
   - Vérifie l'existence de l'assignation
   - Enregistre les réponses dans `data.answers`
   - Marque le statut comme 'completed'
   - Crée une notification pour le coach
   - Gère la récurrence (crée une nouvelle assignation si nécessaire)
   - Rollback automatique en cas d'erreur

3. **`validate_initial_bilan`** - Validation du bilan initial
   - Extrait les données du bilan initial
   - Met à jour le profil client avec les informations collectées
   - Marque le client comme 'active'
   - Crée une notification de validation

**Bénéfices:**
- ✅ Cohérence garantie des données
- ✅ Réduction du nombre d'appels réseau
- ✅ Gestion automatique des erreurs avec rollback
- ✅ Traçabilité complète des opérations

#### Solution 3: Services TypeScript

**Deux services pour encapsuler la logique métier:**

1. **`bilanTemplateService.ts`** (282 lignes)
   - `createBilanTemplate()` - Création de template
   - `updateBilanTemplate()` - Mise à jour de template
   - `deleteBilanTemplate()` - Suppression de template
   - `getBilanTemplatesByCoach()` - Liste des templates d'un coach
   - `getBilanTemplateById()` - Récupération d'un template spécifique

2. **`bilanAssignmentService.ts`** (340 lignes)
   - `assignBilanToClient()` - Appelle la RPC `assign_bilan_atomic`
   - `completeBilan()` - Appelle la RPC `complete_bilan_atomic`
   - `validateInitialBilan()` - Appelle la RPC `validate_initial_bilan`
   - `getBilanAssignmentsByClient()` - Liste des bilans d'un client
   - `getBilanAssignmentsByCoach()` - Liste des bilans d'un coach

**Bénéfices:**
- ✅ Séparation claire des responsabilités
- ✅ Réutilisabilité du code
- ✅ Gestion centralisée des erreurs
- ✅ Logging détaillé pour le debugging

#### Solution 4: Hooks React Custom

**Deux hooks pour la gestion d'état:**

1. **`useBilanTemplates.ts`** (153 lignes)
   - Chargement automatique des templates
   - Méthodes CRUD (`create`, `update`, `remove`)
   - Gestion du loading et des erreurs
   - Rafraîchissement automatique après modification

2. **`useBilanAssignments.ts`** (181 lignes)
   - Chargement des assignations par client ou coach
   - Méthodes `assign`, `complete`, `validate`
   - Filtrage par statut
   - Gestion du loading et des erreurs

**Bénéfices:**
- ✅ Logique réutilisable entre composants
- ✅ État synchronisé automatiquement
- ✅ Code des composants simplifié

#### Solution 5: Composants React

**Quatre composants principaux:**

1. **`BilanSection.tsx`** (441 lignes) - Interface client
   - Affichage des bilans en attente
   - Formulaire de complétion avec tous les types de champs
   - Historique des bilans complétés
   - Thème clair/sombre adaptatif

2. **`ClientBilanHistory.tsx`** (225 lignes) - Historique coach
   - Liste des bilans complétés par un client
   - Visualisation des réponses
   - Filtrage par template

3. **`BilanTemplates.tsx`** (629 lignes) - Gestion des templates
   - Création et édition de templates
   - Ajout dynamique de sections et champs
   - Assignation aux clients avec fréquence
   - Badge "X clients assignés"
   - Suppression avec confirmation

4. **`BilanTemplatesRefactored.tsx`** (629 lignes) - Version refactorisée
   - Même fonctionnalité que BilanTemplates.tsx
   - Code optimisé et mieux structuré

**Bénéfices:**
- ✅ Interface utilisateur intuitive
- ✅ Expérience cohérente entre coach et client
- ✅ Support complet de tous les types de champs

#### Solution 6: Tests Automatisés

**Suite de tests pour la logique métier:**

**Fichier:** `src/test/logic/bilanLogic.test.ts` (376 lignes)

**13 tests implémentés:**
1. Création d'un template de bilan
2. Validation de la structure des sections
3. Assignation d'un bilan à un client
4. Assignation récurrente (weekly, biweekly, monthly)
5. Complétion d'un bilan
6. Validation des réponses
7. Gestion du snapshot de template
8. Création d'assignation récurrente après complétion
9. Archivage de bilans
10. Suppression de template avec cascade
11. Validation du bilan initial
12. Mise à jour du profil client
13. Gestion des erreurs

**Commande pour lancer les tests:**
```bash
pnpm test src/test/logic/bilanLogic.test.ts
```

**Bénéfices:**
- ✅ Validation automatique de la logique métier
- ✅ Détection précoce des régressions
- ✅ Documentation vivante du comportement attendu

### Modifications Globales du Projet

#### Nouveaux Fichiers Créés (18 fichiers)

**Migrations SQL (3):**
- `supabase/migrations/20251214_enhance_bilan_system.sql`
- `supabase/migrations/20251214_fix_bilan_template_deletion.sql`
- `supabase/migrations/20251214_fix_rls_policies.sql`

**Services (2):**
- `src/services/bilanTemplateService.ts`
- `src/services/bilanAssignmentService.ts`

**Hooks (2):**
- `src/hooks/useBilanTemplates.ts`
- `src/hooks/useBilanAssignments.ts`

**Composants (4):**
- `src/components/BilanSection.tsx`
- `src/components/BilanSection.old.tsx` (backup)
- `src/components/BilanSectionFixed.tsx` (version corrigée)
- `src/components/ClientBilanHistory.tsx`

**Pages (3):**
- `src/pages/coach/BilanTemplates.tsx` (refactorisé)
- `src/pages/coach/BilanTemplates.old.tsx` (backup)
- `src/pages/coach/BilanTemplatesRefactored.tsx`

**Tests (1):**
- `src/test/logic/bilanLogic.test.ts`

**Types (1):**
- Modifications dans `src/types.ts`

**Intégrations (2):**
- `src/pages/ClientProfile.tsx` (ajout de BilanSection)
- `src/pages/client/ClientProfile.tsx` (ajout de BilanSection)

#### Statistiques

- **+4,634 lignes** ajoutées
- **-146 lignes** supprimées
- **18 fichiers** modifiés

### Impact sur l'Architecture

#### Base de Données

**Nouvelles tables:**
- `bilan_templates` - Stockage des modèles
- `bilan_assignments` - Gestion des assignations

**Nouvelles fonctions RPC:**
- `assign_bilan_atomic`
- `complete_bilan_atomic`
- `validate_initial_bilan`

**Nouvelles politiques RLS:**
- Coachs peuvent créer/modifier/supprimer leurs templates
- Coachs peuvent assigner des bilans à leurs clients
- Clients peuvent voir et compléter leurs bilans assignés
- Coachs peuvent voir les bilans complétés de leurs clients

#### Front-end

**Nouveaux services:**
- `bilanTemplateService` - Gestion des templates
- `bilanAssignmentService` - Gestion des assignations

**Nouveaux hooks:**
- `useBilanTemplates` - État des templates
- `useBilanAssignments` - État des assignations

**Nouveaux composants:**
- `BilanSection` - Interface client
- `ClientBilanHistory` - Historique coach
- `BilanTemplates` - Gestion des templates

**Nouveaux types:**
- `BilanFieldType` - Types de champs
- `BilanField` - Structure d'un champ
- `BilanSection` - Structure d'une section
- `BilanTemplate` - Structure d'un template
- `BilanAssignment` - Structure d'une assignation

### Principes Architecturaux Respectés

1. **Transaction Atomique** - Toutes les opérations critiques utilisent des fonctions RPC avec rollback automatique
2. **Source de Vérité Unique** - Les données sont stockées dans PostgreSQL, le front-end ne fait que les afficher
3. **Snapshot pour l'Historique** - Les templates sont copiés dans `data.template_snapshot` pour préserver l'historique
4. **Cascade pour la Cohérence** - Suppression automatique des assignations lors de la suppression d'un template
5. **Séparation des Responsabilités** - Services, hooks et composants ont des rôles bien définis
6. **Tests Automatisés** - 13 tests couvrent la logique métier critique

### Bénéfices pour les Utilisateurs

**Pour les Coachs:**
- ✅ Création rapide de questionnaires personnalisés
- ✅ Assignation en masse avec récurrence automatique
- ✅ Visualisation claire des réponses clients
- ✅ Badge indiquant le nombre de clients assignés
- ✅ Historique complet des bilans complétés

**Pour les Clients:**
- ✅ Interface intuitive pour remplir les bilans
- ✅ Support de tous les types de champs (texte, nombre, date, échelle, etc.)
- ✅ Notifications lors de nouveaux bilans assignés
- ✅ Historique de leurs bilans complétés
- ✅ Thème clair/sombre adaptatif

### Leçons Apprises

1. **Vérifier la structure réelle de la base** - Ne pas supposer que les noms de tables correspondent aux conventions (profiles vs clients)
2. **Tester en production tôt** - Les environnements de preview et production peuvent avoir des différences subtiles
3. **Squash merge avec prudence** - Les squash merges peuvent perdre des commits de correction si la branche n'est pas à jour
4. **Appliquer les migrations manuellement** - Cloudflare Pages ne déploie que le front-end, les migrations SQL doivent être appliquées séparément
5. **Recharger l'état après mutation** - Les compteurs et badges doivent être rechargés après une modification pour une UX réactive

---

## Intervention #1 - Refactoring Architectural Majeur (Décembre 2025)

**Date:** 11-14 décembre 2025  
**Pull Requests:**
- [PR #289](https://github.com/MKtraining-fr/virtus/pull/289) - `feat/atomic-session-completion` ✅ Mergée
- [PR #290](https://github.com/MKtraining-fr/virtus/pull/290) - `feat/single-source-of-truth` ✅ Mergée
- [PR #291](https://github.com/MKtraining-fr/virtus/pull/291) - `feat/normalize-session-order` ✅ Mergée
- [PR #292](https://github.com/MKtraining-fr/virtus/pull/292) - `feat/automated-tests` ✅ Mergée
- [PR #293](https://github.com/MKtraining-fr/virtus/pull/293) - `feat: Améliorer l'affichage des programmes avec semaines variables` ✅ Mergée

**Statut:** Déployé en production avec succès.

### Contexte

L'application Virtus souffrait de bugs critiques de désynchronisation des données affectant la fiabilité de la plateforme coach-client. Les indicateurs de progression (œil rouge/vert, pastilles de notification) étaient peu fiables, et les données de séances pouvaient se retrouver dans des états incohérents après validation.

### Problèmes Identifiés

Une analyse approfondie a révélé **sept problèmes architecturaux majeurs** constituant la cause racine des bugs récurrents.

#### Problème 1: Absence de Transaction Atomique

La validation d'une séance client déclenchait **7 appels réseau distincts** et non coordonnés à la base de données. En cas d'échec d'un seul de ces appels, les données se retrouvaient dans un état incohérent, sans possibilité de rollback.

**Impact utilisateur:** Indicateur "œil" rouge/vert non fiable, pastilles de notification incorrectes, données de performance manquantes ou erronées.

#### Problème 2: Multiples Sources de Vérité

La progression du client (semaine et séance actuelles) était calculée et stockée à plusieurs endroits différents, à la fois côté client (front-end) et côté serveur (base de données), sans mécanisme de synchronisation garantie. Cette duplication créait des situations où le coach et le client voyaient des informations différentes.

**Impact utilisateur:** Affichage de la mauvaise séance ou semaine au client, désynchronisation entre la vue coach et la vue client.

#### Problème 3: Logique de Calcul Côté Client

Une partie importante de la logique métier, comme le calcul de la prochaine séance à effectuer, était implémentée directement dans le code front-end (React). Cette approche rendait la logique fragile, difficile à maintenir, et sujette à des incohérences entre différentes versions de l'application.

**Impact utilisateur:** Risque élevé d'incohérences entre les versions de l'application, difficulté à maintenir et à déboguer la logique.

#### Problème 4: `session_order` Non Normalisé

Les valeurs de `session_order` dans la base de données n'étaient pas consécutives (exemples observés: 1, 56, 93, 175). Cette non-normalisation compliquait et fragilisait tous les calculs de progression basés sur l'ordre des séances, notamment pour déterminer la "séance suivante".

**Impact utilisateur:** Bugs dans la navigation entre les séances "précédente" et "suivante", erreurs de calcul pour déterminer la séance actuelle.

#### Problème 5: Duplication des Données

La structure complète des programmes et des séances était dupliquée pour chaque client assigné. Cette architecture rendait les mises à jour de programmes complexes, coûteuses en ressources, et impossibles à propager rétroactivement.

**Impact utilisateur:** Lenteurs lors de l'assignation de programmes, impossibilité pour le coach de mettre à jour un programme pour tous les clients concernés en une seule fois.

#### Problème 6: Absence de Tests Automatisés

Aucune suite de tests automatisés n'existait pour valider la logique de progression, qui constitue pourtant le cœur fonctionnel du système. Chaque modification du code était donc risquée et nécessitait des tests manuels longs et fastidieux.

**Impact utilisateur:** Impossibilité de détecter les régressions avant la mise en production, chaque modification était risquée.

#### Problème 7: Dépendance à `current_week` et `current_session_order`

L'état de la progression était stocké dans les colonnes `current_week` et `current_session_order` de la table `program_assignments`. Cette méthode de stockage direct de l'état s'est avérée peu fiable et était la source principale des désynchronisations de progression.

**Impact utilisateur:** Source principale des désynchronisations de progression entre coach et client.

### Solutions Implémentées

Quatre Pull Requests majeures ont été développées et mergées pour résoudre ces problèmes de manière structurelle.

#### Solution 1: Transaction Atomique (PR #289)

**Création d'une fonction RPC PostgreSQL `complete_client_session_atomic`.**

Cette fonction encapsule les 7 opérations de mise à jour dans une **transaction unique et atomique**. Si une seule opération échoue, toutes les modifications sont annulées automatiquement (rollback), garantissant ainsi que la base de données reste toujours dans un état cohérent.

**Fichiers créés/modifiés:**
- `supabase/migrations/20251213_complete_session_atomic.sql` - Fonction RPC PostgreSQL (V4 déployée)
- `src/hooks/useSessionCompletion.ts` - Hook React custom pour appeler la fonction RPC
- `src/pages/client/workout/ClientCurrentProgram.tsx` - Composant modifié pour utiliser le nouveau hook

**Bénéfices:**
- ✅ Élimination complète des désynchronisations lors de la validation de séance
- ✅ Fiabilité à 100% de l'indicateur "œil" rouge/vert
- ✅ Pastilles de notification toujours correctes
- ✅ Réduction de 7 appels réseau à 1 seul appel

#### Solution 2: Source de Vérité Unique (PR #290)

**Création d'une vue SQL `client_program_progress`.**

Cette vue calcule automatiquement et en temps réel la progression de chaque client (semaine et séance actuelles) directement depuis la base de données, en se basant uniquement sur les séances complétées. La logique n'est plus dupliquée côté client mais centralisée et robuste côté serveur.

**Fichiers créés/modifiés:**
- `supabase/migrations/20251213_client_program_progress_view.sql` - Vue SQL calculée
- `src/services/clientProgramProgressService.ts` - Service TypeScript pour accéder à la vue
- `src/hooks/useClientProgramProgress.ts` - Hook React pour charger la progression

**Bénéfices:**
- ✅ Source de vérité unique et calculée automatiquement
- ✅ Données toujours synchronisées entre coach et client
- ✅ Simplification majeure de la logique front-end
- ✅ Élimination des calculs côté client

#### Solution 3: Normalisation des Données (PR #291)

**Exécution d'un script SQL pour normaliser les valeurs de `session_order`.**

Le script a parcouru toutes les séances de la base de données et a réattribué un `session_order` consécutif (1, 2, 3, 4, ...) pour chaque programme, simplifiant ainsi tous les futurs calculs de progression et éliminant les bugs liés aux valeurs non consécutives.

**Fichiers créés:**
- `supabase/migrations/20251213_normalize_session_order.sql` - Script de normalisation (exécuté sur Supabase)

**Bénéfices:**
- ✅ Valeurs `session_order` consécutives pour tous les programmes
- ✅ Simplification des calculs de "séance suivante"
- ✅ Prévention des bugs de navigation

#### Solution 4: Tests Automatisés (PR #292)

**Implémentation d'une suite de 9 tests automatisés avec Vitest.**

Ces tests couvrent la logique de calcul de la progression (séance suivante, semaine suivante, fin de programme) et s'assurent qu'elle fonctionne correctement dans tous les cas de figure. Ils préviennent les régressions futures et permettent de modifier le code en toute confiance.

**Fichiers créés:**
- `src/test/logic/progressionLogic.test.ts` - 9 tests automatisés (tous passent)
- `src/test/README.md` - Documentation complète des tests

**Bénéfices:**
- ✅ Détection automatique des régressions
- ✅ Sécurisation des futurs changements
- ✅ Documentation vivante de la logique métier

### Nouvelle Fonctionnalité: Navigation Intelligente pour Programmes (PR #293)

En complément des corrections architecturales, une nouvelle fonctionnalité a été implémentée pour améliorer l'expérience utilisateur des coachs lors de la consultation des programmes assignés.

#### Problème

Lorsque les semaines d'un programme étaient différentes, l'interface affichait toutes les semaines simultanément dans la modale de consultation. Pour les programmes longs (10+ semaines), cela rendait l'interface confuse, lente à charger, et difficile à naviguer.

#### Solution

Implémentation d'une navigation "intelligente" qui n'affiche par défaut que la première semaine, avec la possibilité de naviguer entre les semaines via des onglets cliquables.

**Fichiers modifiés:**
- `src/components/ProgramDetailView.tsx` - Composant de modale de consultation des programmes

**Comportement:**

**Scénario 1 - Semaines Identiques (inchangé):**
Un seul tableau est affiché avec la mention "Semaines 1 à X (identiques)".

**Scénario 2 - Semaines Différentes (nouveau):**
- Par défaut, seule la **Semaine 1** est visible
- Un bandeau bleu "Semaines variables" 🔄 indique la présence de variations
- Un bouton "Voir toutes les semaines" déplie une barre d'onglets pour naviguer
- Les onglets des semaines différentes de la Semaine 1 sont marqués d'une **pastille rouge** 🔴
- Un bouton "Masquer" permet de replier la navigation

**Bénéfices:**
- ✅ Interface plus claire et moins chargée
- ✅ Navigation intuitive entre les semaines
- ✅ Identification visuelle immédiate des semaines différentes
- ✅ Meilleure UX pour les programmes longs (10+ semaines)

### Note Importante: Incohérence Temporaire Dashboard

Une incohérence visuelle a été identifiée entre la nouvelle section "Programme Assigné" (qui utilise la nouvelle architecture) et la "modale historique de perf sur le tableau de bord" (qui utilise encore l'ancienne architecture). Cette incohérence est **attendue et normale**. Elle démontre que la nouvelle architecture est plus précise que l'ancienne. Le Dashboard n'a volontairement pas été refactorisé pendant cette phase pour privilégier la stabilisation. Cette incohérence disparaîtra lors de la future refonte du Dashboard.

### Résultats et Impact

- ✅ **Tous les bugs critiques de désynchronisation sont résolus**
- ✅ **L'application est stable et fiable**
- ✅ **Les 5 PRs sont mergées et déployées en production**
- ✅ **9 tests automatisés passent avec succès**
- ✅ **Nouvelle fonctionnalité de navigation déployée**

### Recommandations Post-Intervention

1. **Période d'observation (2-4 semaines):** Surveiller la stabilité en production avant toute nouvelle modification majeure. Ne pas introduire de nouvelles fonctionnalités pendant cette période pour ne pas biaiser l'analyse.

2. **Collecte de retours utilisateurs:** Contacter les coachs et clients pour obtenir leur feedback sur la stabilité et la nouvelle interface de navigation.

3. **Prochaine étape prioritaire (moyen terme):** Refactoriser le Dashboard pour qu'il utilise la nouvelle vue `client_program_progress`. Cela éliminera les incohérences visuelles restantes et harmonisera l'architecture de toute l'application.

---

# ARCHITECTURE TECHNIQUE DU PROJET

Cette section décrit l'état actuel de l'architecture technique après l'intervention de décembre 2025.

## Stack Technique

Le projet Virtus repose sur une stack moderne orientée performance et développement rapide.

| Catégorie | Technologie | Version | Description |
|:---|:---|:---|:---|
| **Front-end** | React | 19.2.0 | Bibliothèque d'interface utilisateur avec architecture à composants. |
| | TypeScript | 5.8.3 | Langage de programmation avec typage statique pour JavaScript. |
| | Vite | 6.4.1 | Outil de build et serveur de développement rapide avec HMR. |
| **Back-end** | Supabase | - | Plateforme BaaS (Backend-as-a-Service) fournissant base de données, authentification, et API REST/RPC. |
| | PostgreSQL | 15+ | Base de données relationnelle utilisée par Supabase. |
| **State Management** | Zustand | 5.0.8 | Gestionnaire d'état simple et performant pour React. |
| **Routing** | React Router | 7.9.6 | Bibliothèque de routage pour applications React. |
| **UI Components** | Heroicons | 2.2.0 | Bibliothèque d'icônes SVG. |
| | Lucide React | 0.552.0 | Bibliothèque d'icônes SVG alternative. |
| **Tests** | Vitest | 3.2.4 | Framework de test rapide compatible avec Vite. |
| | Testing Library | 16.3.0 | Utilitaires de test pour composants React. |
| **Déploiement** | Cloudflare Pages | - | Plateforme de déploiement continu pour applications front-end avec CDN global. |
| **Code Repository** | GitHub | - | Hébergement du code source et gestion des versions. |
| **Validation** | Zod | 4.1.12 | Bibliothèque de validation de schémas TypeScript-first. |

## Architecture de la Base de Données

L'architecture de la base de données suit un modèle relationnel classique avec une séparation claire entre les modèles de programmes (créés par les coachs) et les instances de programmes (assignées aux clients).

### Tables Principales

#### Tables de Modèles de Programmes (Créés par les Coachs)

| Table | Description | Colonnes Clés |
|:---|:---|:---|
| `programs` | Contient les modèles de programmes d'entraînement créés par les coachs. | `id`, `name`, `coach_id`, `description`, `created_at` |
| `program_weeks` | Définit les semaines d'un programme. Un programme peut avoir plusieurs semaines. | `id`, `program_id`, `week_number` |
| `program_sessions` | Définit les séances d'entraînement pour une semaine donnée. | `id`, `week_id`, `session_order`, `title`, `description` |
| `program_exercises` | Définit les exercices au sein d'une séance. | `id`, `session_id`, `exercise_id`, `sets`, `reps`, `rest_time` |

#### Tables d'Assignation et de Suivi (Instances Clients)

| Table | Description | Colonnes Clés |
|:---|:---|:---|
| `program_assignments` | Table de liaison qui assigne un programme à un client. Contient aussi `current_week` et `current_session_order` pour rétrocompatibilité (approche hybride). | `id`, `client_id`, `program_id`, `start_date`, `current_week`, `current_session_order` |
| `client_sessions` | Stocke l'état de chaque séance pour un client (complétée ou non). | `id`, `assignment_id`, `session_id`, `completed_at`, `viewed_at` |
| `client_session_exercises` | Copie des exercices d'une séance pour un client spécifique. | `id`, `client_session_id`, `exercise_id`, `sets`, `reps` |
| `client_exercise_performance` | Enregistre les performances réelles du client pour chaque exercice (poids, reps effectuées). | `id`, `client_session_id`, `exercise_id`, `set_number`, `weight`, `reps_done` |

### Vue Calculée (Source de Vérité)

| Vue | Description | Colonnes Clés |
|:---|:---|:---|
| **`client_program_progress`** | **Source de Vérité Calculée.** Détermine automatiquement la semaine et la séance actuelles pour chaque client en se basant uniquement sur les séances complétées (`client_sessions.completed_at`). | `client_id`, `assignment_id`, `program_id`, `current_week_number`, `current_session_order`, `total_weeks`, `total_sessions`, `completed_sessions` |

Cette vue est interrogée par le front-end via le service `clientProgramProgressService` et le hook `useClientProgramProgress`.

### Fonction RPC PostgreSQL

**Avant (Intervention #1 - PR #289):**

| Fonction | Description | Paramètres | Retour |
|:---|:---|:---|:---|
| `complete_client_session_atomic` | Valide une séance client de manière atomique (transaction). Marque la séance comme complétée, enregistre les performances, et met à jour la progression. | `p_client_session_id`, `p_performances` (JSON) | `success` (boolean), `message` (text) |

**Après (Intervention #2 - PR #294 - Décembre 2025):**

| Fonction | Description | Paramètres | Retour |
|:---|:---|:---|:---|
| `complete_client_session_atomic` | Valide une séance client de manière atomique (transaction). Marque la séance comme complétée, enregistre les performances, et met à jour la progression. | `p_client_session_id`, `p_performances` (JSON) | `success` (boolean), `message` (text) |
| `assign_bilan_atomic` | Assigne un bilan à un client de manière atomique. Crée un snapshot du template, insère l'assignation, et envoie une notification au client. | `p_template_id` (UUID), `p_client_id` (UUID), `p_coach_id` (UUID), `p_frequency` (TEXT), `p_scheduled_date` (DATE) | `success` (boolean), `assignment_id` (UUID), `message` (text), `error` (text) |
| `complete_bilan_atomic` | Complète un bilan de manière atomique. Enregistre les réponses, marque le bilan comme complété, crée une notification pour le coach, et gère la récurrence si nécessaire. | `p_assignment_id` (UUID), `p_answers` (JSONB) | `success` (boolean), `message` (text), `new_assignment_id` (UUID), `new_scheduled_date` (DATE), `error` (text) |
| `validate_initial_bilan` | Valide le bilan initial d'un client et met à jour son profil avec les données collectées. Marque le client comme actif. | `p_assignment_id` (UUID), `p_coach_id` (UUID) | `success` (boolean), `message` (text), `client_id` (UUID), `error` (text) |

Ces fonctions sont appelées par le front-end via les hooks `useSessionCompletion` et `useBilanAssignments`.

## Architecture Front-end

L'application front-end est organisée en une architecture à composants avec séparation claire des responsabilités.

### Structure des Répertoires

**Avant (Intervention #1 - PR #289-293):**

```
/src
├── /components
│   ├── ProgramDetailView.tsx
│   └── ...
├── /hooks
│   ├── useSessionCompletion.ts
│   ├── useClientProgramProgress.ts
│   └── ...
├── /services
│   ├── clientProgramProgressService.ts
│   └── ...
├── /test
│   ├── /logic
│   │   └── progressionLogic.test.ts (9 tests)
│   └── README.md
└── ...
```

**Après (Intervention #2 - PR #294 - Décembre 2025):**

```
/src
├── /components       # Composants React réutilisables
│   ├── ProgramDetailView.tsx     # Modale de consultation des programmes
│   ├── BilanSection.tsx          # ✅ NOUVEAU - Interface client pour les bilans
│   ├── ClientBilanHistory.tsx    # ✅ NOUVEAU - Historique des bilans côté coach
│   └── ...
├── /hooks            # Hooks React custom
│   ├── useSessionCompletion.ts       # Hook pour valider une séance
│   ├── useClientProgramProgress.ts   # Hook pour charger la progression
│   ├── useBilanTemplates.ts          # ✅ NOUVEAU - Hook pour gérer les templates de bilans
│   ├── useBilanAssignments.ts        # ✅ NOUVEAU - Hook pour gérer les assignations de bilans
│   └── ...
├── /services         # Services TypeScript pour interactions API
│   ├── clientProgramProgressService.ts  # Service pour accéder à la vue client_program_progress
│   ├── bilanTemplateService.ts          # ✅ NOUVEAU - Service pour gérer les templates de bilans
│   ├── bilanAssignmentService.ts        # ✅ NOUVEAU - Service pour gérer les assignations de bilans
│   └── ...
├── /stores           # Stores Zustand pour gestion d'état global
│   ├── useAuthStore.ts
│   ├── useDataStore.ts
│   └── ...
├── /pages            # Composants de page principaux
│   ├── /client
│   │   ├── /workout
│   │   │   └── ClientCurrentProgram.tsx
│   │   ├── ClientProfile.tsx             # 🔄 MODIFIÉ - Intègre BilanSection
│   │   └── ...
│   ├── /coach
│   │   ├── BilanTemplates.tsx            # ✅ NOUVEAU - Gestion des templates de bilans
│   │   └── ...
│   └── /admin
├── /test             # Tests automatisés
│   ├── /logic
│   │   ├── progressionLogic.test.ts  # Tests de la logique de progression (9 tests)
│   │   └── bilanLogic.test.ts        # ✅ NOUVEAU - Tests de la logique des bilans (13 tests)
│   └── README.md
└── ...
```

### Flux de Données (Post-Refactoring)

#### Validation d'une Séance Client

1. Le client clique sur "Valider la séance" dans `ClientCurrentProgram.tsx`
2. Le composant appelle le hook `useSessionCompletion`
3. Le hook invoque la fonction RPC `complete_client_session_atomic` avec les performances
4. La fonction RPC exécute une transaction atomique qui :
   - Marque la séance comme complétée
   - Enregistre les performances
   - Met à jour les indicateurs (œil, pastilles)
5. En cas de succès, le front-end rafraîchit l'interface
6. En cas d'échec, toutes les modifications sont annulées (rollback)

#### Affichage de la Progression

1. Le composant (Dashboard, ClientCurrentProgram, etc.) appelle le hook `useClientProgramProgress`
2. Le hook interroge le service `clientProgramProgressService`
3. Le service effectue une requête SQL vers la vue `client_program_progress`
4. La vue calcule automatiquement la progression en temps réel
5. Les données sont retournées au composant et affichées

#### Assignation d'un Bilan (Décembre 2025)

1. Le coach sélectionne un template et des clients dans `BilanTemplates.tsx`
2. Le composant appelle le hook `useBilanAssignments.assign()`
3. Le hook invoque le service `bilanAssignmentService.assignBilanToClient()`
4. Le service appelle la fonction RPC `assign_bilan_atomic`
5. La fonction RPC exécute une transaction atomique qui :
   - Crée un snapshot du template
   - Insère l'assignation dans `bilan_assignments`
   - Crée une notification pour le client
6. En cas de succès, le compteur d'assignations est rechargé automatiquement
7. En cas d'échec, toutes les modifications sont annulées (rollback)

#### Complétion d'un Bilan (Décembre 2025)

1. Le client remplit le formulaire dans `BilanSection.tsx`
2. Le composant appelle le hook `useBilanAssignments.complete()`
3. Le hook invoque le service `bilanAssignmentService.completeBilan()`
4. Le service appelle la fonction RPC `complete_bilan_atomic`
5. La fonction RPC exécute une transaction atomique qui :
   - Enregistre les réponses dans `data.answers`
   - Marque le statut comme 'completed'
   - Crée une notification pour le coach
   - Si récurrence active, crée une nouvelle assignation pour la prochaine échéance
6. En cas de succès, l'interface est rafraîchie
7. En cas d'échec, toutes les modifications sont annulées (rollback)

## Fonctionnalités Clés

### Complétion de Séance Client

**Composant principal:** `src/pages/client/workout/ClientCurrentProgram.tsx`

**Ancienne logique (avant décembre 2025):**
- 7 appels API successifs et non coordonnés
- Risque élevé de désynchronisation en cas d'échec partiel
- Indicateurs (œil, pastilles) peu fiables

**Nouvelle logique (après décembre 2025):**
- 1 seul appel au hook `useSessionCompletion`
- Invocation de la fonction RPC `complete_client_session_atomic`
- Transaction atomique garantissant la cohérence
- Indicateurs toujours fiables

### Calcul de la Progression

**Ancienne logique (avant décembre 2025):**
- Calculs complexes et fragiles dans le front-end
- Basés sur les colonnes `current_week` et `current_session_order` de `program_assignments`
- Multiples sources de vérité
- Désynchronisations fréquentes

**Nouvelle logique (après décembre 2025):**
- Le front-end interroge simplement la vue `client_program_progress`
- La vue calcule la progression en temps réel depuis les séances complétées
- Logique entièrement côté serveur, centralisée et robuste
- Source de vérité unique

### Affichage des Programmes Assignés (Interface Coach)

**Composant:** `src/components/ProgramDetailView.tsx`

**Logique:**
1. Le composant récupère toutes les semaines et séances d'un programme assigné
2. Une fonction compare la structure de chaque semaine (exercices, séries, reps, ordre) avec celle de la Semaine 1
3. Si toutes les semaines sont identiques, un seul tableau est affiché avec la mention "Semaines 1 à X (identiques)"
4. Si au moins une semaine est différente :
   - Par défaut, seule la Semaine 1 est affichée
   - Un bandeau bleu "Semaines variables" 🔄 est visible
   - Un bouton "Voir toutes les semaines" déplie une navigation par onglets
   - Les semaines différentes de la Semaine 1 sont marquées d'une pastille rouge 🔴
   - Un bouton "Masquer" permet de replier la navigation

**Critères de différence:** Toute différence dans les exercices, séries, reps, ordre, ou nombre de séances est détectée.

### Système de Bilans (Décembre 2025)

**Composants principaux:**
- `src/pages/coach/BilanTemplates.tsx` - Gestion des templates côté coach
- `src/components/BilanSection.tsx` - Interface client pour remplir les bilans
- `src/components/ClientBilanHistory.tsx` - Historique des bilans côté coach

**Logique:**

1. **Création de templates** - Le coach crée des questionnaires personnalisés avec 8 types de champs (texte, nombre, date, liste, checkbox, oui/non, échelle, fichier)
2. **Assignation récurrente** - Le coach assigne un template à un ou plusieurs clients avec une fréquence (once, weekly, biweekly, monthly)
3. **Snapshot du template** - Lors de l'assignation, le template est copié dans `data.template_snapshot` pour préserver l'historique
4. **Complétion côté client** - Le client remplit le formulaire, les réponses sont enregistrées dans `data.answers`
5. **Récurrence automatique** - Si fréquence active, une nouvelle assignation est créée automatiquement après complétion
6. **Visualisation des réponses** - Le coach peut consulter toutes les réponses dans l'historique du client
7. **Badge d'assignation** - Chaque template affiche le nombre de clients avec assignations actives
8. **Suppression en cascade** - La suppression d'un template supprime automatiquement toutes ses assignations

**Transactions atomiques:**
- `assign_bilan_atomic` - Garantit la cohérence lors de l'assignation
- `complete_bilan_atomic` - Garantit la cohérence lors de la complétion et gère la récurrence
- `validate_initial_bilan` - Valide le bilan initial et met à jour le profil client

## Tests Automatisés

**Framework:** Vitest 3.2.4

**Avant (Intervention #1 - PR #292):**

**Fichier:** `src/test/logic/progressionLogic.test.ts`

**Couverture:** 9 tests automatisés couvrant la logique de calcul de progression.

**Tests implémentés:**
1. Calcul de la séance suivante dans la même semaine
2. Calcul de la séance suivante lors du passage à la semaine suivante
3. Détection de la fin d'un programme
4. Gestion des programmes à semaines multiples
5. Gestion des programmes à semaine unique
6. Calcul de la progression en pourcentage
7. Détection des semaines complétées
8. Navigation entre les séances
9. Validation de la cohérence des données

**Après (Intervention #2 - PR #294 - Décembre 2025):**

**Fichiers:**
- `src/test/logic/progressionLogic.test.ts` (9 tests)
- `src/test/logic/bilanLogic.test.ts` (13 tests) ✅ NOUVEAU

**Couverture totale:** 22 tests automatisés

**Nouveaux tests pour les bilans:**
1. Création d'un template de bilan
2. Validation de la structure des sections
3. Assignation d'un bilan à un client
4. Assignation récurrente (weekly, biweekly, monthly)
5. Complétion d'un bilan
6. Validation des réponses
7. Gestion du snapshot de template
8. Création d'assignation récurrente après complétion
9. Archivage de bilans
10. Suppression de template avec cascade
11. Validation du bilan initial
12. Mise à jour du profil client
13. Gestion des erreurs

**Commande pour lancer les tests:**
```bash
pnpm test                                    # Tous les tests
pnpm test src/test/logic/progressionLogic.test.ts  # Tests de progression uniquement
pnpm test src/test/logic/bilanLogic.test.ts        # Tests de bilans uniquement
```

## Déploiement

**Plateforme:** Cloudflare Pages

**Processus:**
1. Push du code sur GitHub (branche `main` ou PR)
2. Cloudflare Pages détecte automatiquement le push
3. Build de l'application avec Vite (`pnpm run build`)
4. Déploiement automatique sur le CDN global Cloudflare
5. Pour les PRs, un environnement de preview est créé automatiquement

**Configuration:**
- Build command: `pnpm run build`
- Build output directory: `dist`
- Node version: 22.16.0
- Package manager: pnpm 10.11.1

## Décisions Architecturales Importantes

### Approche Hybride pour `program_assignments`

**Décision:** Conserver les colonnes `current_week` et `current_session_order` dans la table `program_assignments` même après la création de la vue `client_program_progress`.

**Raison:** Approche pragmatique privilégiant la stabilité. Ces colonnes sont maintenues pour rétrocompatibilité et comme filet de sécurité pendant la période de transition. Elles pourront être supprimées dans une future itération après validation complète de la nouvelle architecture.

### Refonte Progressive

**Décision:** Ne pas refactoriser le Dashboard immédiatement après les corrections architecturales.

**Raison:** Privilégier une période d'observation de 2-4 semaines pour valider la stabilité des corrections avant d'entreprendre de nouvelles modifications majeures. Cette approche réduit les risques et permet d'identifier d'éventuels effets de bord.

### Tests Automatisés Ciblés

**Décision:** Commencer par 9 tests couvrant uniquement la logique de progression.

**Raison:** Approche incrémentale. La logique de progression est le cœur du système et la source des bugs critiques. Une fois cette partie sécurisée, la couverture de tests sera étendue progressivement aux autres fonctionnalités.

---

# RECOMMANDATIONS STRATÉGIQUES

## Court Terme (Immédiat - 1 mois)

**Période d'observation de 2-4 semaines** est la priorité absolue. Pendant cette période, il est crucial de surveiller activement la plateforme en production pour confirmer que les corrections ont résolu tous les problèmes et qu'aucun effet de bord n'apparaît. Il est fortement recommandé de ne pas introduire de nouvelles fonctionnalités majeures pendant cette période pour ne pas biaiser l'analyse de stabilité.

La **collecte de retours utilisateurs** doit être organisée en contactant les coachs et clients pour obtenir leur feedback sur la stabilité, la fiabilité des indicateurs, et la nouvelle interface de navigation des programmes. Ces retours permettront de valider la pertinence des corrections et d'identifier d'éventuels points de friction mineurs.

## Moyen Terme (1-3 mois)

L'**harmonisation de l'architecture** constitue la prochaine étape prioritaire. Le Dashboard doit être refactorisé pour utiliser la nouvelle vue `client_program_progress` et les nouveaux services, éliminant ainsi les incohérences visuelles restantes et harmonisant l'architecture de toute l'application.

L'**extension de la couverture de tests** doit être poursuivie en ajoutant des tests automatisés pour les autres parties critiques de l'application (création de programme, authentification, gestion des clients). L'objectif est de réduire le risque de régressions futures et d'augmenter la confiance lors des déploiements.

La **mise en place d'une CI/CD complète** via GitHub Actions permettra de lancer automatiquement les tests à chaque PR, garantissant que seul du code de qualité est mergé dans la branche principale.

L'implémentation d'un **monitoring et alerting** avec un outil comme Sentry ou LogRocket permettra de capturer les erreurs front-end en temps réel et d'être proactif dans la détection de bugs avant qu'ils ne soient massivement reportés par les utilisateurs.

## Long Terme (3+ mois)

L'**optimisation des performances** devra être envisagée en analysant les requêtes lentes et en optimisant les vues SQL et les index PostgreSQL. L'objectif est d'améliorer la réactivité de l'application à mesure que le volume de données augmente.

Une **refonte de l'architecture de duplication** pourrait être étudiée pour éliminer la duplication des données de programmes pour chaque client, en faveur d'un système de références avec historisation des modifications. Cette évolution majeure nécessitera une analyse approfondie et une planification rigoureuse.

---

**Fin du document - Version 1.1**

*Ce document doit être maintenu à jour à chaque intervention significative sur le projet pour conserver sa valeur de référence.*
