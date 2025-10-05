# Configuration du Fichier .env

## 📝 Contenu Exact à Copier

Créez un fichier nommé `.env` à la racine de votre projet Virtus et copiez-y exactement ce contenu :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://dqsbfnsicmzovlrhuoif.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzY1MTcsImV4cCI6MjA3NTIxMjUxN30.fkhw3Uw7aJzgf_wPypd50_5ypNi4xGrINPXuBHAjuPg
```

## 📂 Emplacement du Fichier

```
virtus/
├── .env                    ← Créez ce fichier ici
├── .env.example
├── package.json
├── vite.config.ts
├── src/
└── ...
```

## ⚠️ Important

1. **Le fichier doit s'appeler exactement `.env`** (avec le point au début)
2. **Ne commitez JAMAIS ce fichier sur Git** (il est déjà dans .gitignore)
3. **Ces clés sont spécifiques à votre projet Supabase**

## 🔍 Explication des Variables

| Variable | Description |
|:---------|:------------|
| `VITE_SUPABASE_URL` | L'URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | La clé publique (anon) pour l'accès côté client |

## ✅ Vérification

Après avoir créé le fichier `.env`, vérifiez qu'il est bien présent :

**Sur Windows (PowerShell)** :
```powershell
Get-Content .env
```

**Sur Mac/Linux** :
```bash
cat .env
```

Vous devriez voir les deux lignes avec vos clés Supabase.

## 🚀 Après la Création du Fichier

1. **Redémarrez votre serveur de développement** si il est en cours d'exécution
2. Les variables seront automatiquement chargées par Vite
3. Vous pouvez maintenant lancer `npm run dev`

## 🔒 Sécurité

- ✅ La clé `ANON_KEY` est sûre pour le frontend
- ✅ Elle est protégée par les politiques RLS de Supabase
- ❌ Ne partagez JAMAIS ce fichier publiquement
- ❌ Ne le commitez JAMAIS sur Git

## 📋 Fichier .env.example

Le fichier `.env.example` dans votre projet contient déjà un modèle avec des valeurs factices. Vous pouvez le copier et le renommer :

```bash
cp .env.example .env
```

Puis remplacez les valeurs par celles ci-dessus.
