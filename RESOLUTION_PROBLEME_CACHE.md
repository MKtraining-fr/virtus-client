# Résolution du Problème de Cache Firebase

## 🔴 Problème Identifié

Votre navigateur utilise encore l'ancienne version de l'application avec Firebase. Les erreurs suivantes le confirment :
- `Failed to load data from Firestore`
- `identitytoolkit.googleapis.com` (API Firebase Auth)

## ✅ Solution Complète

### Étape 1 : Arrêter le Serveur de Développement

1. Dans votre terminal où tourne `npm run dev`
2. Appuyez sur **Ctrl+C** pour arrêter le serveur

### Étape 2 : Nettoyer le Cache

Exécutez ces commandes dans l'ordre :

```bash
# Aller dans le dossier du projet
cd virtus

# Supprimer le cache de Vite
rm -rf node_modules/.vite

# Supprimer le dossier dist (build précédent)
rm -rf dist

# Nettoyer le cache npm (optionnel mais recommandé)
npm cache clean --force
```

**Sur Windows PowerShell** :
```powershell
cd virtus
Remove-Item -Recurse -Force node_modules\.vite
Remove-Item -Recurse -Force dist
npm cache clean --force
```

### Étape 3 : Vérifier le Fichier .env

Assurez-vous que votre fichier `.env` contient bien :

```env
VITE_SUPABASE_URL=https://dqsbfnsicmzovlrhuoif.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzY1MTcsImV4cCI6MjA3NTIxMjUxN30.fkhw3Uw7aJzgf_wPypd50_5ypNi4xGrINPXuBHAjuPg
```

### Étape 4 : Réinstaller les Dépendances (si nécessaire)

Si le problème persiste :

```bash
rm -rf node_modules
npm install
```

### Étape 5 : Redémarrer le Serveur

```bash
npm run dev
```

### Étape 6 : Vider le Cache du Navigateur

Une fois le serveur redémarré :

1. **Ouvrez les Outils de Développement** (F12)
2. **Faites un clic droit sur le bouton de rafraîchissement** du navigateur
3. **Sélectionnez "Vider le cache et actualiser de force"**

Ou utilisez le raccourci :
- **Windows/Linux** : `Ctrl + Shift + R`
- **Mac** : `Cmd + Shift + R`

### Étape 7 : Désactiver le Service Worker

Le Service Worker peut aussi mettre en cache l'ancienne version :

1. Ouvrez les **Outils de Développement** (F12)
2. Allez dans l'onglet **Application** (ou **Storage** sur Firefox)
3. Dans le menu de gauche, cliquez sur **Service Workers**
4. Cliquez sur **Unregister** pour chaque Service Worker listé
5. Rafraîchissez la page

---

## 🔍 Vérification que Supabase est Utilisé

Après avoir suivi ces étapes, vérifiez dans la console du navigateur (F12) :

### ✅ Bon Signe (Supabase)
Vous devriez voir des requêtes vers :
- `dqsbfnsicmzovlrhuoif.supabase.co`
- Aucune erreur "Firestore" ou "Firebase"

### ❌ Mauvais Signe (Firebase encore actif)
Si vous voyez encore :
- `firestore.googleapis.com`
- `identitytoolkit.googleapis.com`
- Erreurs "Failed to load data from Firestore"

→ Recommencez les étapes ci-dessus

---

## 🐛 Si le Problème Persiste

### Option 1 : Utiliser un Autre Port

Modifiez `vite.config.ts` pour changer le port :

```typescript
server: {
  port: 5173,  // Changez 3000 en 5173
  open: true,
},
```

Puis redémarrez le serveur.

### Option 2 : Utiliser le Mode Incognito

Ouvrez l'application dans une fenêtre de navigation privée pour éviter tout cache.

### Option 3 : Vérifier les Fichiers Chargés

Dans les Outils de Développement (F12) :
1. Allez dans l'onglet **Sources** (ou **Debugger**)
2. Vérifiez que les fichiers chargés sont bien les nouveaux
3. Cherchez `authService.ts` et vérifiez qu'il importe `supabase` et non `firebase`

---

## 📋 Checklist Complète

- [ ] Serveur arrêté (Ctrl+C)
- [ ] Cache Vite supprimé (`rm -rf node_modules/.vite`)
- [ ] Fichier `.env` vérifié avec les bonnes clés Supabase
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Cache navigateur vidé (Ctrl+Shift+R)
- [ ] Service Worker désactivé
- [ ] Vérification dans la console : requêtes vers Supabase uniquement

---

## 🎯 Résultat Attendu

Après ces étapes, vous devriez :
- ✅ Ne plus voir d'erreurs Firebase
- ✅ Voir des requêtes vers `supabase.co`
- ✅ Pouvoir vous connecter avec `contact@mktraining.fr`
- ✅ Accéder au tableau de bord admin

---

## 📞 Besoin d'Aide ?

Si après toutes ces étapes le problème persiste, envoyez-moi :
1. Le contenu de votre fichier `.env`
2. Les erreurs dans la console (F12)
3. La sortie de la commande `npm run dev`
