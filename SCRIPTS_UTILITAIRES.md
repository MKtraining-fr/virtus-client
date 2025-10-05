# Scripts Utilitaires pour Virtus

Ce document liste les scripts utilitaires créés pour faciliter la gestion de l'application Virtus.

## 1. Créer un Compte Administrateur

**Fichier**: `create-admin.js`

**Description**: Crée un compte utilisateur avec le rôle "admin".

**Usage**:
```bash
node create-admin.js <email> <password> [firstName] [lastName]
```

**Exemple**:
```bash
node create-admin.js admin@virtus.com MonMotDePasse123! Jean Dupont
```

**Note**: Si la confirmation par email est activée, l'utilisateur devra confirmer son email avant de pouvoir se connecter.

---

## 2. Tester la Connexion Supabase

**Fichier**: `test-supabase-connection.js`

**Description**: Vérifie que la connexion à Supabase fonctionne et que toutes les tables sont accessibles.

**Usage**:
```bash
node test-supabase-connection.js
```

---

## 3. Tester l'Authentification

**Fichier**: `test-auth.js`

**Description**: Teste le processus complet d'inscription, connexion et récupération de profil.

**Usage**:
```bash
node test-auth.js
```

**Note**: Ce script crée un utilisateur de test avec un email aléatoire.

---

## 4. Réinitialiser les Politiques RLS

**Fichier**: `reset_rls.py`

**Description**: Supprime toutes les politiques RLS existantes et les recrée avec la configuration correcte.

**Usage**:
```bash
python3.11 reset_rls.py
```

**Attention**: Ce script nécessite le token d'accès Supabase et doit être utilisé avec précaution.

---

## 5. Déployer le Schéma SQL

**Fichier**: `deploy_schema.py`

**Description**: Déploie le schéma SQL complet dans la base de données Supabase.

**Usage**:
```bash
python3.11 deploy_schema.py
```

**Note**: Ce script est utilisé lors de la migration initiale. Ne l'exécutez pas sur une base de données en production avec des données existantes.

---

## Maintenance

Ces scripts sont fournis pour faciliter la gestion de l'application. Conservez-les dans le dépôt Git pour référence future.

**Recommandations**:
- Ne commitez jamais les tokens d'accès dans Git
- Testez toujours les scripts dans un environnement de développement avant de les utiliser en production
- Documentez toute modification apportée aux scripts
