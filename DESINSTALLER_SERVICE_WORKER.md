# Comment Désinstaller le Service Worker

## 🔴 Problème

L'application charge encore Firebase parce que le **Service Worker** met en cache l'ancienne version de l'application.

## ✅ Solution : Désinstaller le Service Worker

### Étape 1 : Ouvrir les Outils de Développement

1. Appuyez sur **F12** (ou clic droit → Inspecter)
2. Les outils de développement s'ouvrent en bas ou sur le côté

### Étape 2 : Aller dans l'Onglet Application

En haut des outils de développement, vous verrez plusieurs onglets :
- Console
- Sources
- Network
- **Application** ← Cliquez ici

Si vous ne voyez pas "Application", cliquez sur les **>>** (plus d'onglets) à droite.

### Étape 3 : Trouver Service Workers

Dans le menu de gauche de l'onglet Application, cherchez :

```
Application
├── Manifest
├── Service workers  ← Cliquez ici
├── Storage
└── ...
```

### Étape 4 : Désinstaller

Vous verrez une ligne avec :
- **Source** : `http://localhost:5173/sw.js`
- **Status** : Active ou Running
- Un bouton **Unregister** ou **Désinscrire**

**Cliquez sur "Unregister"**

### Étape 5 : Vider le Cache

Toujours dans l'onglet Application, dans le menu de gauche :

```
Application
├── ...
├── Storage  ← Cliquez ici
│   ├── Local Storage
│   ├── Session Storage
│   └── Cache Storage  ← Développez
```

Développez **Cache Storage**, vous verrez :
- `virtus-pwa-v1` (ancien cache)
- `virtus-pwa-v2-supabase` (nouveau cache)

**Faites un clic droit sur chaque cache** → **Delete** ou **Supprimer**

### Étape 6 : Effacer Toutes les Données

Toujours dans l'onglet Application, en haut vous verrez :

**Clear storage** ou **Effacer le stockage**

Cliquez dessus, puis :
1. Cochez **toutes les cases** (Cookies, Local Storage, Cache, etc.)
2. Cliquez sur **Clear site data** ou **Effacer les données du site**

### Étape 7 : Fermer et Rouvrir

1. **Fermez COMPLÈTEMENT le navigateur** (toutes les fenêtres)
2. Rouvrez-le
3. Allez sur `http://localhost:5173`

### Étape 8 : Vérifier

Ouvrez la console (F12 → Console) et vérifiez :
- ❌ Plus d'erreurs `firestore.googleapis.com`
- ✅ Des requêtes vers `supabase.co`

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

### Option 1 : Mode Navigation Privée

1. Ouvrez une **fenêtre de navigation privée** :
   - **Ctrl + Shift + N** (Chrome/Edge)
   - **Ctrl + Shift + P** (Firefox)
2. Allez sur `http://localhost:5173`
3. Testez l'application

Si ça fonctionne en navigation privée, c'est bien un problème de cache.

### Option 2 : Changer de Navigateur

Essayez avec un autre navigateur (Chrome, Firefox, Edge) pour voir si le problème persiste.

### Option 3 : Désactiver le Service Worker Temporairement

Dans l'onglet Application → Service workers :
- Cochez **"Bypass for network"** ou **"Contourner pour le réseau"**
- Cela désactive temporairement le Service Worker

---

## 📝 Note

Le Service Worker est utile en production pour mettre en cache l'application et la rendre disponible hors ligne. Mais en développement, il peut causer des problèmes de cache comme celui-ci.
