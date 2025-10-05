# Corrections Appliquées : Mécaniques de Création de Comptes

**Date** : 5 octobre 2025  
**Application** : Virtus  
**Statut** : ✅ Corrections appliquées - Migration Supabase requise

---

## 📋 Problèmes Identifiés et Corrigés

### ❌ Problème Principal : Colonne `status` Manquante dans Supabase

**Symptôme** : Le statut des clients (active, prospect, archived) était géré uniquement dans l'état local de l'application, jamais persisté dans la base de données.

**Impact** :
- Les prospects validés ne changeaient pas de statut dans Supabase
- Les statuts étaient perdus après rafraîchissement
- Incohérence entre l'interface et la base de données

---

## ✅ Corrections Appliquées

### 1. Ajout de la Colonne `status` dans le Schéma Supabase

**Fichier créé** : `supabase/add_status_column.sql`

**Contenu** :
```sql
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'prospect', 'archived'));

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_coach_status ON clients(coach_id, status);
```

**⚠️ ACTION REQUISE** : Exécuter ce SQL dans le dashboard Supabase

**Instructions** :
1. Aller sur : https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql
2. Copier le contenu de `supabase/add_status_column.sql`
3. Coller dans le SQL Editor
4. Cliquer sur "Run"

---

### 2. Mise à Jour des Mappers TypeScript

**Fichier modifié** : `src/services/typeMappers.ts`

**Changements** :

#### `mapSupabaseClientToClient()`
```typescript
// AVANT
export function mapSupabaseClientToClient(supabaseClient: SupabaseClient): Client {
  return {
    id: supabaseClient.id,
    email: supabaseClient.email,
    // ...
    coachId: supabaseClient.coach_id || undefined,
    createdAt: supabaseClient.created_at,
    // ...
  } as Client;
}

// APRÈS
export function mapSupabaseClientToClient(supabaseClient: SupabaseClient): Client {
  return {
    id: supabaseClient.id,
    email: supabaseClient.email,
    // ...
    coachId: supabaseClient.coach_id || undefined,
    status: (supabaseClient as any).status || 'active', // ✅ Ajouté
    createdAt: supabaseClient.created_at,
    // ...
  } as Client;
}
```

#### `mapClientToSupabaseClient()`
```typescript
// AVANT
export function mapClientToSupabaseClient(client: Partial<Client>): Partial<SupabaseClient> {
  const result: Partial<SupabaseClient> = {
    email: client.email,
    first_name: client.firstName,
    // ...
    coach_id: client.coachId || null,
  };
  return result;
}

// APRÈS
export function mapClientToSupabaseClient(client: Partial<Client>): Partial<SupabaseClient> {
  const result: Partial<SupabaseClient> & { status?: string } = {
    email: client.email,
    first_name: client.firstName,
    // ...
    coach_id: client.coachId || null,
    status: client.status || 'active', // ✅ Ajouté
  };
  return result;
}
```

---

### 3. Mise à Jour de `addUser()` dans AuthContext

**Fichier modifié** : `src/context/AuthContext.tsx`

**Changements** :
```typescript
// AVANT
const addUser = useCallback(async (userData: Partial<Client>): Promise<Client> => {
  const { user: authUser, error } = await signUp(signUpData);
  
  if (error) throw error;
  if (!authUser) throw new Error('Échec de la création de l\'utilisateur');

  // Récupérer le profil créé
  const { data: clientData } = await supabase
    .from('clients')
    .select('*')
    .eq('id', authUser.id)
    .single();
  
  // ...
}, []);

// APRÈS
const addUser = useCallback(async (userData: Partial<Client>): Promise<Client> => {
  const { user: authUser, error } = await signUp(signUpData);
  
  if (error) throw error;
  if (!authUser) throw new Error('Échec de la création de l\'utilisateur');

  // ✅ Mettre à jour le statut dans la table clients si fourni
  if (userData.status && userData.status !== 'active') {
    await supabase
      .from('clients')
      .update({ status: userData.status })
      .eq('id', authUser.id);
  }

  // Récupérer le profil créé
  const { data: clientData } = await supabase
    .from('clients')
    .select('*')
    .eq('id', authUser.id)
    .single();
  
  // ...
}, []);
```

---

### 4. Mise à Jour de `updateUser()` dans AuthContext

**Fichier modifié** : `src/context/AuthContext.tsx`

**Changements** :
```typescript
// AVANT
const updateUser = useCallback(async (userId: string, userData: Partial<Client>) => {
  const updateData: any = {};
  
  if (userData.firstName !== undefined) updateData.first_name = userData.firstName;
  if (userData.lastName !== undefined) updateData.last_name = userData.lastName;
  if (userData.email !== undefined) updateData.email = userData.email;
  if (userData.phone !== undefined) updateData.phone = userData.phone;
  if (userData.role !== undefined) updateData.role = userData.role;
  if (userData.coachId !== undefined) updateData.coach_id = userData.coachId;
  
  // Mettre à jour dans Supabase
  // ...
}, []);

// APRÈS
const updateUser = useCallback(async (userId: string, userData: Partial<Client>) => {
  const updateData: any = {};
  
  if (userData.firstName !== undefined) updateData.first_name = userData.firstName;
  if (userData.lastName !== undefined) updateData.last_name = userData.lastName;
  if (userData.email !== undefined) updateData.email = userData.email;
  if (userData.phone !== undefined) updateData.phone = userData.phone;
  if (userData.role !== undefined) updateData.role = userData.role;
  if (userData.coachId !== undefined) updateData.coach_id = userData.coachId;
  if (userData.status !== undefined) updateData.status = userData.status; // ✅ Ajouté
  
  // Mettre à jour dans Supabase
  // ...
}, []);
```

---

### 5. Correction de la Validation de Bilan

**Fichier modifié** : `src/pages/BilanArchive.tsx`

**Changements** :

#### Import de `updateUser`
```typescript
// AVANT
const BilanArchive: React.FC = () => {
  const { user, clients: allClients, setClients } = useAuth();
  // ...
};

// APRÈS
const BilanArchive: React.FC = () => {
  const { user, clients: allClients, setClients, updateUser } = useAuth();
  // ...
};
```

#### `handleValidateBilan()` - Validation Individuelle
```typescript
// AVANT
const handleValidateBilan = (bilanId: string) => {
  const updatedClients = allClients.map((client): Client => {
    if (client.id === bilanId) {
      return { ...client, status: 'active' as const, coachId: client.coachId || user?.id };
    }
    return client;
  });
  setClients(updatedClients); // ❌ Modification locale uniquement
  alert(`Bilan validé.`);
  closeModal();
  navigate(`/app/client/${bilanId}`);
};

// APRÈS
const handleValidateBilan = async (bilanId: string) => {
  try {
    // ✅ Mettre à jour le statut dans Supabase
    await updateUser(bilanId, { 
      status: 'active',
      coachId: selectedBilan?.coachId || user?.id 
    });
    
    alert(`Bilan de ${selectedBilan?.firstName} validé. Le prospect est maintenant un client.`);
    closeModal();
    navigate(`/app/client/${bilanId}`);
  } catch (error: any) {
    alert(`Erreur lors de la validation: ${error.message}`);
  }
};
```

#### `handleValidateSelected()` - Validation Multiple
```typescript
// AVANT
const handleValidateSelected = () => {
  if (selectedArchives.length === 0) return;
  const count = selectedArchives.length;
  if (window.confirm(`Valider ${count} bilan(s) ?`)) {
    const updatedClients = allClients.map((client): Client => {
      if (selectedArchives.includes(client.id)) {
        return { ...client, status: 'active' as const };
      }
      return client;
    });
    setClients(updatedClients); // ❌ Modification locale uniquement
    setSelectedArchives([]);
    alert(`${count} bilan(s) validé(s).`);
  }
};

// APRÈS
const handleValidateSelected = async () => {
  if (selectedArchives.length === 0) return;
  const count = selectedArchives.length;
  if (window.confirm(`Valider ${count} bilan(s) ?`)) {
    try {
      // ✅ Mettre à jour tous les prospects en parallèle
      await Promise.all(
        selectedArchives.map(bilanId => {
          const client = allClients.find(c => c.id === bilanId);
          return updateUser(bilanId, { 
            status: 'active',
            coachId: client?.coachId || user?.id 
          });
        })
      );
      
      setSelectedArchives([]);
      alert(`${count} bilan(s) validé(s) avec succès.`);
    } catch (error: any) {
      alert(`Erreur lors de la validation: ${error.message}`);
    }
  }
};
```

---

## 📊 Résumé des Fichiers Modifiés

| Fichier | Lignes Modifiées | Type de Modification |
|---------|------------------|----------------------|
| `src/services/typeMappers.ts` | ~20 | Ajout gestion status |
| `src/context/AuthContext.tsx` | ~30 | Ajout gestion status |
| `src/pages/BilanArchive.tsx` | ~40 | Persistance Supabase |
| `supabase/add_status_column.sql` | ~40 | Nouveau fichier SQL |

**Total** : ~130 lignes modifiées/ajoutées

---

## ✅ Tests de Validation

### Test 1 : Création de Prospect via Bilan

**Étapes** :
1. Aller sur "Nouveau Bilan"
2. Remplir le formulaire
3. Cliquer sur "Archiver comme prospect"
4. Vérifier dans Supabase que `status = 'prospect'`

**Résultat attendu** : ✅ Le prospect est créé avec `status = 'prospect'` dans Supabase

---

### Test 2 : Validation de Prospect → Client

**Étapes** :
1. Aller sur "Bilans Archivés"
2. Sélectionner un prospect
3. Cliquer sur "Valider"
4. Vérifier dans Supabase que `status = 'active'`
5. Vérifier que le client apparaît dans "Mes Clients"

**Résultat attendu** : ✅ Le statut est mis à jour dans Supabase et persiste après rafraîchissement

---

### Test 3 : Validation Multiple

**Étapes** :
1. Aller sur "Bilans Archivés"
2. Sélectionner plusieurs prospects (checkbox)
3. Cliquer sur "Valider la sélection"
4. Vérifier dans Supabase que tous ont `status = 'active'`

**Résultat attendu** : ✅ Tous les prospects sont validés en parallèle

---

## 🚀 Déploiement

### Étape 1 : Exécuter la Migration SQL

**⚠️ OBLIGATOIRE AVANT LE DÉPLOIEMENT**

1. Aller sur : https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql
2. Copier le contenu de `supabase/add_status_column.sql`
3. Coller dans le SQL Editor
4. Cliquer sur "Run"
5. Vérifier que la colonne est créée :
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'clients' AND column_name = 'status';
   ```

---

### Étape 2 : Commit et Push

```bash
git add .
git commit -m "🔧 Correction persistance status + validation bilans

✅ Ajout colonne status dans Supabase
✅ Mise à jour mappers pour gérer status
✅ Correction addUser/updateUser pour persister status
✅ Correction validation bilans (prospect → client)
✅ Persistance dans Supabase au lieu d'état local

Fichiers modifiés:
- src/services/typeMappers.ts
- src/context/AuthContext.tsx
- src/pages/BilanArchive.tsx
- supabase/add_status_column.sql (nouveau)"

git push origin main
```

---

### Étape 3 : Déploiement Netlify

Si le déploiement automatique est activé, Netlify redéploiera automatiquement.

Sinon, déclencher manuellement dans l'interface Netlify.

---

## 📝 Notes Importantes

### Compatibilité Ascendante

Le code est compatible avec les données existantes :
- Si `status` n'existe pas dans Supabase, la valeur par défaut `'active'` est utilisée
- Les clients existants sans status seront considérés comme `'active'`

### Migration des Données Existantes

Si des clients existent déjà dans Supabase sans status, ils auront automatiquement `status = 'active'` grâce au `DEFAULT 'active'` dans le SQL.

---

## ✅ Checklist Finale

- [x] Colonne `status` ajoutée au schéma SQL
- [x] Mappers mis à jour pour gérer `status`
- [x] `addUser()` persiste le status dans Supabase
- [x] `updateUser()` persiste le status dans Supabase
- [x] Validation de bilan persiste dans Supabase
- [x] Validation multiple persiste dans Supabase
- [x] Build compile sans erreur
- [ ] Migration SQL exécutée dans Supabase (À FAIRE)
- [ ] Tests de validation effectués (À FAIRE)
- [ ] Code déployé sur Netlify (À FAIRE)

---

**Préparé par** : Manus AI  
**Date** : 5 octobre 2025
