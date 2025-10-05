# Guide de Commit Git après la Migration Supabase

## ⚠️ ATTENTION : Fichiers Sensibles

Avant de commiter, il est **crucial** de vérifier que les fichiers contenant des informations sensibles ne soient pas inclus dans Git.

### Fichiers à NE JAMAIS commiter

❌ **Fichiers contenant des secrets** :
- `deploy_schema.py` - Contient le token d'accès Supabase
- `fix_rls.py` - Contient le token d'accès Supabase
- `fix_signup_policy.py` - Contient le token d'accès Supabase
- `reset_rls.py` - Contient le token d'accès Supabase
- `check_tables.py` - Contient le token d'accès Supabase
- `.env` - Contient les clés API (déjà dans .gitignore normalement)

❌ **Scripts de test temporaires** :
- `test-auth.js` - Contient les clés en dur
- `test-supabase-connection.js` - Contient les clés en dur
- `deploy-schema.js` - Contient les clés en dur

---

## ✅ Fichiers à Commiter

### 1. Documentation (IMPORTANT)
✅ `GUIDE_MIGRATION_SUPABASE.md` - Guide complet de la migration
✅ `PROCHAINES_ETAPES.md` - Étapes post-migration
✅ `SCRIPTS_UTILITAIRES.md` - Documentation des scripts
✅ `GUIDE_COMMIT_GIT.md` - Ce fichier

### 2. Code Source Modifié
✅ `src/context/AuthContext.tsx` - Contexte d'authentification migré
✅ `src/services/authService.ts` - Service d'authentification Supabase
✅ `src/services/supabase.ts` - Configuration Supabase
✅ `src/services/dataService.ts` - Service de données générique
✅ `src/services/typeMappers.ts` - Mappers de types

### 3. Types et Schéma
✅ `src/types/database.ts` - Types TypeScript générés
✅ `supabase/schema.sql` - Schéma de la base de données
✅ `supabase/fix-rls-policies.sql` - Politiques RLS corrigées

### 4. Configuration
✅ `.env.example` - Exemple de configuration (SANS les vraies clés)
✅ `package.json` - Dépendances mises à jour
✅ `package-lock.json` - Lock file

### 5. Script Utilitaire Sécurisé
✅ `create-admin.js` - Script de création d'admin (contient les clés mais c'est un script utilitaire documenté)

### 6. Fichiers à Supprimer
✅ Supprimer les anciens fichiers Firebase :
- `src/services/firebase.ts`
- `firestore.rules`
- `firestore.indexes.json`
- `DEPLOIEMENT_FIRESTORE_RULES.md`
- `pages/ClientProfile.tsx` (doublon)

---

## 📝 Procédure de Commit Recommandée

### Étape 1 : Mettre à jour .gitignore

Assurez-vous que `.gitignore` contient bien ces lignes :

```bash
# Environment variables
.env
.env.local

# Scripts avec secrets
*_schema.py
*_rls.py
check_tables.py
test-*.js
deploy-schema.js
```

### Étape 2 : Ajouter .gitignore au dépôt

```bash
cd /home/ubuntu/virtus
git add .gitignore
git commit -m "chore: mise à jour .gitignore pour exclure les fichiers sensibles"
```

### Étape 3 : Commiter la documentation

```bash
git add GUIDE_MIGRATION_SUPABASE.md PROCHAINES_ETAPES.md SCRIPTS_UTILITAIRES.md GUIDE_COMMIT_GIT.md
git commit -m "docs: ajout de la documentation de migration Supabase"
```

### Étape 4 : Commiter le schéma et les types

```bash
git add supabase/ src/types/database.ts
git commit -m "feat: ajout du schéma PostgreSQL et des types Supabase"
```

### Étape 5 : Commiter les nouveaux services

```bash
git add src/services/supabase.ts src/services/dataService.ts src/services/typeMappers.ts
git commit -m "feat: ajout des services Supabase"
```

### Étape 6 : Commiter les modifications des services existants

```bash
git add src/services/authService.ts src/context/AuthContext.tsx
git commit -m "feat: migration de l'authentification vers Supabase"
```

### Étape 7 : Commiter les modifications de configuration

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: mise à jour des dépendances pour Supabase"
```

### Étape 8 : Supprimer les anciens fichiers Firebase

```bash
git rm src/services/firebase.ts firestore.rules firestore.indexes.json DEPLOIEMENT_FIRESTORE_RULES.md pages/ClientProfile.tsx
git commit -m "chore: suppression des fichiers Firebase obsolètes"
```

### Étape 9 : Ajouter le script utilitaire

```bash
git add create-admin.js
git commit -m "feat: ajout du script de création d'administrateur"
```

### Étape 10 : Pousser vers GitHub

```bash
git push origin main
```

---

## 🔒 Sécurité : Que Faire si Vous Avez Déjà Commité des Secrets ?

Si vous avez accidentellement commité des fichiers contenant des secrets (tokens, clés API), suivez ces étapes :

### 1. Révoquer immédiatement les secrets compromis

- Allez sur Supabase et générez un nouveau token d'accès
- Supprimez l'ancien token

### 2. Nettoyer l'historique Git (si nécessaire)

```bash
# Supprimer un fichier de l'historique Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch deploy_schema.py" \
  --prune-empty --tag-name-filter cat -- --all

# Forcer le push
git push origin --force --all
```

⚠️ **Attention** : Cette opération réécrit l'historique Git et peut causer des problèmes si d'autres personnes ont déjà cloné le dépôt.

---

## ✅ Checklist Finale

Avant de pousser vers GitHub, vérifiez :

- [ ] Le fichier `.env` n'est PAS dans le commit
- [ ] Les scripts Python avec tokens ne sont PAS dans le commit
- [ ] Le fichier `.env.example` ne contient PAS de vraies clés
- [ ] Tous les fichiers de documentation sont inclus
- [ ] Les nouveaux services Supabase sont inclus
- [ ] Les anciens fichiers Firebase sont supprimés
- [ ] Le `.gitignore` est à jour

---

## 📌 Résumé

**À COMMITER** : Code source, documentation, schéma SQL, types TypeScript, configuration exemple
**À NE PAS COMMITER** : Fichiers .env, scripts avec tokens en dur, fichiers de test avec clés

En cas de doute, demandez-moi de vérifier avant de pousser vers GitHub !
