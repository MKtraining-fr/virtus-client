# Analyse de la Fonctionnalité d'Import CSV

**Date** : 8 octobre 2025  
**Application** : Virtus  
**Objectif** : Analyser le système d'import CSV et proposer des améliorations avec Supabase

---

## 📋 Vue d'Ensemble

L'application dispose d'une page **DataImport** (`src/pages/admin/DataImport.tsx`) qui permet à l'admin d'importer des données en masse via des fichiers CSV.

### Types de Données Importables

| Type | Titre | En-têtes Requis |
|------|-------|-----------------|
| **users** | Utilisateurs (Coachs & Clients) | firstName, lastName, email, password, role |
| **exercises** | Exercices (Musculation, Mobilité, Échauffement) | name, category |
| **ciqual** | Base Alimentaire (Ciqual) | name, category, calories, protein, carbs, fat |
| **products** | Produits Boutique | name, description, price, category, imageUrl, productUrl, ownerId |
| **partners** | Partenaires Boutique | name, description, logoUrl, offerUrl, ownerId |
| **intensification** | Techniques d'Intensification | name, description |

---

## 🔧 Fonctionnement Actuel

### 1. Parsing du CSV

```typescript
const parseCSV = (content: string): { header: string[], rows: string[][] } => {
    const lines = content.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim() !== '');
    const header = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(field => field.trim()));
    return { header, rows };
};
```

**Méthode** : Parser manuel basique
- Remplace les retours à la ligne Windows (`\r\n`) par Unix (`\n`)
- Sépare les lignes par `\n`
- Sépare les colonnes par `,`
- Première ligne = en-têtes
- Lignes suivantes = données

**⚠️ Limitations** :
- ❌ Ne gère pas les guillemets (`"`)
- ❌ Ne gère pas les virgules dans les valeurs (ex: "Dupont, Jean")
- ❌ Ne gère pas les sauts de ligne dans les cellules
- ❌ Ne gère pas l'encodage UTF-8 avec BOM
- ❌ Ne gère pas les champs vides correctement

---

### 2. Validation des En-têtes

```typescript
const missingHeaders = requiredHeaders.filter(rh => !header.includes(rh));
if (missingHeaders.length > 0) {
    throw new Error(`En-têtes manquants : ${missingHeaders.join(', ')}`);
}
```

**Méthode** : Vérification stricte des en-têtes requis

✅ **Avantages** :
- Empêche l'import de fichiers mal formatés
- Message d'erreur clair

---

### 3. Traitement des Données

Pour chaque type de données, le code :
1. Parse chaque ligne du CSV
2. Crée des objets JavaScript
3. Génère des IDs locaux (ex: `user-${Date.now()}-${i}`)
4. Ajoute les données au state local via `setClients()`, `setExercises()`, etc.

**Exemple pour les utilisateurs** :
```typescript
case 'users': {
    const newUsers: Client[] = [];
    rows.forEach((row, i) => {
        const userObj = header.reduce((obj, h, idx) => ({ ...obj, [h]: row[idx] }), {} as any);
        const emailExists = clients.some(c => c.email.toLowerCase() === userObj.email.toLowerCase());
        if (emailExists) return;

        newUsers.push({
            id: `user-${Date.now()}-${i}`,
            status: userObj.status || 'prospect',
            firstName: userObj.firstName,
            lastName: userObj.lastName,
            email: userObj.email,
            password: userObj.password,
            // ... autres champs
        } as Client);
        count++;
    });
    setClients([...clients, ...newUsers]);
    break;
}
```

---

## ❌ Problèmes Critiques Identifiés

### Problème 1 : **Aucune Persistance dans Supabase**

**Symptôme** : Les données importées sont seulement ajoutées au state React local.

**Impact** :
- ❌ Les données disparaissent au rechargement de la page
- ❌ Les données ne sont pas synchronisées avec la base de données
- ❌ Les autres utilisateurs ne voient pas les données importées
- ❌ Aucune sauvegarde permanente

**Cause** : Le code utilise uniquement `setClients()`, `setExercises()`, etc. qui modifient le state local, mais n'appelle jamais Supabase pour insérer les données.

**Code actuel** :
```typescript
setClients([...clients, ...newUsers]); // ❌ Seulement en mémoire
```

**Ce qui devrait être fait** :
```typescript
// ✅ Insérer dans Supabase
const { data, error } = await supabase
    .from('clients')
    .insert(newUsers);

if (!error) {
    setClients([...clients, ...newUsers]); // Mettre à jour le state local
}
```

---

### Problème 2 : **Création de Comptes Utilisateurs Incomplète**

**Symptôme** : L'import d'utilisateurs crée des entrées dans la table `clients` mais pas de comptes Auth.

**Impact** :
- ❌ Les utilisateurs importés ne peuvent pas se connecter
- ❌ Pas de compte dans Supabase Auth
- ❌ Pas d'email d'invitation envoyé

**Solution** : Utiliser la fonction `addUser()` du contexte Auth qui crée à la fois le compte Auth ET l'entrée dans la table.

---

### Problème 3 : **Parser CSV Basique et Fragile**

**Symptôme** : Le parser ne gère pas les cas complexes.

**Impact** :
- ❌ Échoue avec des valeurs contenant des virgules
- ❌ Échoue avec des valeurs entre guillemets
- ❌ Échoue avec des sauts de ligne dans les cellules

**Exemples de CSV qui échoueront** :
```csv
name,description,price
"Produit A, Premium",Description avec virgule,29.99
Produit B,"Description avec
saut de ligne",19.99
```

**Solution** : Utiliser une bibliothèque CSV robuste comme **PapaParse**.

---

### Problème 4 : **Pas de Gestion des Erreurs Partielles**

**Symptôme** : Si une ligne échoue, tout l'import échoue.

**Impact** :
- ❌ Perte de temps si une seule ligne est invalide
- ❌ Pas de rapport détaillé des erreurs

**Solution** : Traiter chaque ligne individuellement et rapporter les succès/échecs.

---

### Problème 5 : **Pas de Validation des Données**

**Symptôme** : Les données ne sont pas validées avant l'insertion.

**Impact** :
- ❌ Emails invalides acceptés
- ❌ Valeurs numériques incorrectes
- ❌ Champs requis manquants

**Solution** : Utiliser les schémas de validation (Zod) existants.

---

## 🎯 Technologies CSV Recommandées

### Option 1 : **PapaParse** (Recommandé)

**Avantages** :
- ✅ Parser CSV robuste et éprouvé
- ✅ Gère les guillemets, virgules, sauts de ligne
- ✅ Détecte automatiquement les délimiteurs
- ✅ Supporte les gros fichiers (streaming)
- ✅ Conversion automatique des types
- ✅ Gestion des erreurs par ligne

**Installation** :
```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

**Exemple d'utilisation** :
```typescript
import Papa from 'papaparse';

const handleImport = (file: File) => {
    Papa.parse(file, {
        header: true, // Première ligne = en-têtes
        skipEmptyLines: true,
        dynamicTyping: true, // Convertit automatiquement les nombres
        complete: (results) => {
            console.log('Données parsées:', results.data);
            console.log('Erreurs:', results.errors);
        },
        error: (error) => {
            console.error('Erreur de parsing:', error);
        }
    });
};
```

---

### Option 2 : **csv-parse** (Alternative)

**Avantages** :
- ✅ Léger et rapide
- ✅ Supporte Node.js et navigateur
- ✅ API flexible

**Installation** :
```bash
npm install csv-parse
```

---

### Option 3 : **Import Direct dans Supabase** (Pour gros volumes)

Pour des imports massifs (>10 000 lignes), Supabase propose :

1. **Import via Dashboard** :
   - Supabase Dashboard → Table Editor → Import CSV
   - Gère automatiquement les types et la validation

2. **Import via SQL** :
   ```sql
   COPY clients(first_name, last_name, email, phone)
   FROM '/path/to/file.csv'
   DELIMITER ','
   CSV HEADER;
   ```

---

## ✅ Solution Recommandée : Refonte Complète

### Architecture Proposée

```
┌─────────────────┐
│  Fichier CSV    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PapaParse     │ ← Parser robuste
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Validation    │ ← Schémas Zod
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │ ← Insertion en BDD
│   Insert        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  State Local    │ ← Mise à jour UI
│   Update        │
└─────────────────┘
```

---

### Étapes de Refonte

#### Étape 1 : Installer PapaParse

```bash
npm install papaparse @types/papaparse
```

#### Étape 2 : Créer un Service d'Import CSV

**Fichier** : `src/services/csvImportService.ts`

```typescript
import Papa from 'papaparse';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string }>;
  total: number;
}

export const importUsersFromCSV = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const result: ImportResult = { success: 0, errors: [], total: 0 };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: async (results) => {
        result.total = results.data.length;

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as any;
          
          try {
            // Validation
            if (!row.email || !row.firstName || !row.lastName) {
              throw new Error('Champs requis manquants');
            }

            // Insertion dans Supabase
            const { error } = await supabase
              .from('clients')
              .insert({
                first_name: row.firstName,
                last_name: row.lastName,
                email: row.email,
                phone: row.phone || '',
                role: row.role || 'client',
                status: row.status || 'prospect',
              });

            if (error) throw error;
            result.success++;
          } catch (error: any) {
            result.errors.push({
              row: i + 2, // +2 car ligne 1 = en-têtes, index commence à 0
              error: error.message,
            });
            logger.error('Erreur import CSV ligne', { row: i + 2, error });
          }
        }

        resolve(result);
      },
      error: (error) => {
        logger.error('Erreur parsing CSV', { error });
        resolve({
          success: 0,
          errors: [{ row: 0, error: error.message }],
          total: 0,
        });
      },
    });
  });
};
```

#### Étape 3 : Mettre à Jour le Composant DataImport

```typescript
import { importUsersFromCSV } from '../../services/csvImportService';

const handleImport = async (key: ImportableKey) => {
  const file = files[key];
  if (!file) return;

  setLoading(prev => ({ ...prev, [key]: true }));

  try {
    let result;
    
    switch (key) {
      case 'users':
        result = await importUsersFromCSV(file);
        break;
      // ... autres cas
    }

    if (result.errors.length > 0) {
      const errorMsg = `${result.success}/${result.total} importés. ${result.errors.length} erreurs.`;
      setMessages(prev => ({ ...prev, [key]: { type: 'error', text: errorMsg } }));
    } else {
      setMessages(prev => ({ ...prev, [key]: { type: 'success', text: `${result.success} lignes importées avec succès.` } }));
    }

    // Recharger les données depuis Supabase
    await reloadData();
  } catch (error: any) {
    setMessages(prev => ({ ...prev, [key]: { type: 'error', text: error.message } }));
  } finally {
    setLoading(prev => ({ ...prev, [key]: false }));
  }
};
```

---

## 📊 Comparaison : Avant / Après

| Aspect | Avant (Actuel) | Après (Proposé) |
|--------|----------------|-----------------|
| **Parsing CSV** | Manuel, fragile | PapaParse, robuste |
| **Persistance** | ❌ Aucune (state local) | ✅ Supabase |
| **Validation** | ❌ Minimale | ✅ Schémas Zod |
| **Gestion erreurs** | ❌ Tout ou rien | ✅ Par ligne |
| **Comptes Auth** | ❌ Non créés | ✅ Créés automatiquement |
| **Rapport d'import** | ❌ Basique | ✅ Détaillé |
| **Gros fichiers** | ❌ Problèmes mémoire | ✅ Streaming |
| **Virgules dans valeurs** | ❌ Échoue | ✅ Géré |
| **Guillemets** | ❌ Échoue | ✅ Géré |

---

## 📝 Exemples de Fichiers CSV

### Exemple 1 : Utilisateurs

**Fichier** : `users_import.csv`

```csv
firstName,lastName,email,phone,role,status
Jean,Dupont,jean.dupont@example.com,0612345678,client,active
Marie,Martin,marie.martin@example.com,0687654321,client,prospect
Pierre,Durand,pierre.durand@example.com,,coach,active
```

### Exemple 2 : Exercices

**Fichier** : `exercises_import.csv`

```csv
name,category,description,equipment,muscleGroups
Développé couché,Musculation,Exercice pour les pectoraux,Barre|Banc,Pectoraux|Triceps|Épaules
Squat,Musculation,Exercice pour les jambes,Barre,Quadriceps|Fessiers|Ischio-jambiers
Étirement dos,Mobilité,Étirement du dos,,Dos
```

### Exemple 3 : Aliments (Ciqual)

**Fichier** : `ciqual_import.csv`

```csv
name,category,calories,protein,carbs,fat
Poulet grillé,Viandes,165,31,0,3.6
Riz blanc cuit,Féculents,130,2.7,28,0.3
Pomme,Fruits,52,0.3,14,0.2
```

---

## 🎯 Recommandations

### Court Terme (Urgent)

1. **Ajouter la persistance Supabase** : Les données doivent être sauvegardées en base
2. **Utiliser PapaParse** : Remplacer le parser manuel
3. **Créer des comptes Auth** : Pour les utilisateurs importés

### Moyen Terme (Améliorations)

1. **Ajouter la validation** : Utiliser les schémas Zod
2. **Rapport d'erreurs détaillé** : Afficher les lignes en erreur
3. **Prévisualisation** : Montrer les données avant l'import
4. **Templates CSV** : Fournir des exemples téléchargeables

### Long Terme (Optimisations)

1. **Import par lots** : Pour les gros fichiers (>1000 lignes)
2. **Import asynchrone** : Avec barre de progression
3. **Historique des imports** : Tracer qui a importé quoi et quand
4. **Rollback** : Annuler un import en cas d'erreur

---

## 📚 Ressources

- [PapaParse Documentation](https://www.papaparse.com/docs)
- [Supabase Bulk Insert](https://supabase.com/docs/reference/javascript/insert)
- [CSV Format Specification (RFC 4180)](https://tools.ietf.org/html/rfc4180)

---

**Préparé par** : Manus AI  
**Date** : 8 octobre 2025
