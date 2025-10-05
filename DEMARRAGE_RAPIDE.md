# Guide de Démarrage Rapide - Application Virtus avec Supabase

## 🚀 Démarrer l'Application en Mode Développement

### 1. Arrêter le serveur actuel (si en cours d'exécution)

Si l'application tourne déjà, arrêtez-la avec `Ctrl+C` dans le terminal.

### 2. Installer les dépendances (si ce n'est pas déjà fait)

```bash
cd /home/ubuntu/virtus
npm install
```

### 3. Vérifier le fichier .env

Assurez-vous que le fichier `.env` contient les bonnes clés Supabase :

```bash
cat .env
```

Vous devriez voir :
```
VITE_SUPABASE_URL=https://dqsbfnsicmzovlrhuoif.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Démarrer le serveur de développement

```bash
npm run dev
```

L'application devrait démarrer sur `http://localhost:5173` (ou un autre port si 5173 est occupé).

### 5. Ouvrir l'application dans le navigateur

Ouvrez votre navigateur et allez sur l'URL affichée dans le terminal (généralement `http://localhost:5173`).

---

## 🔐 Se Connecter avec le Compte Administrateur

Une fois l'application ouverte :

1. Allez sur la page de connexion
2. Entrez les identifiants :
   - **Email** : `contact@mktraining.fr`
   - **Mot de passe** : `Darsche93.`
3. Cliquez sur "Se connecter"

⚠️ **Important** : Si vous avez réactivé la confirmation par email, vous devez d'abord confirmer votre email en cliquant sur le lien reçu dans votre boîte mail.

---

## ✅ Vérifications à Effectuer

### Vérifier que Supabase est utilisé (et non Firebase)

Ouvrez la console du navigateur (F12) et vérifiez :

✅ **Bon signe** : Vous devriez voir des requêtes vers `dqsbfnsicmzovlrhuoif.supabase.co`

❌ **Mauvais signe** : Si vous voyez des requêtes vers `firestore.googleapis.com` ou `identitytoolkit.googleapis.com`, l'application utilise encore Firebase

### Si l'application utilise encore Firebase

1. Arrêtez le serveur (`Ctrl+C`)
2. Supprimez le cache :
   ```bash
   rm -rf node_modules/.vite
   ```
3. Redémarrez :
   ```bash
   npm run dev
   ```

---

## 🐛 Problèmes Courants

### Erreur : "Email not confirmed"

**Solution** : Vérifiez votre boîte mail `contact@mktraining.fr` et cliquez sur le lien de confirmation.

Ou confirmez manuellement l'email via Supabase :
1. Allez sur https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif
2. Cliquez sur **Authentication** → **Users**
3. Trouvez l'utilisateur `contact@mktraining.fr`
4. Cliquez sur les trois points → **Confirm email**

### Erreur : "Failed to load data from Firestore"

**Solution** : L'application utilise encore l'ancien code Firebase. Redémarrez le serveur de développement.

### Erreur : "Missing or insufficient permissions"

**Solution** : C'est une erreur Firebase qui apparaît car l'ancien code est encore en cache. Redémarrez le serveur.

### Le port 5173 est déjà utilisé

**Solution** : Vite utilisera automatiquement le port suivant disponible (5174, 5175, etc.). Regardez le message dans le terminal pour connaître le bon port.

---

## 📦 Build pour la Production

Une fois que tout fonctionne en développement :

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

---

## 🔄 Commandes Utiles

| Commande | Description |
|:---------|:------------|
| `npm run dev` | Démarrer le serveur de développement |
| `npm run build` | Compiler pour la production |
| `npm run preview` | Prévisualiser le build de production |
| `npm run type-check` | Vérifier les types TypeScript |
| `npm run lint` | Vérifier le code avec ESLint |

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes, vérifiez :
1. Le fichier `.env` contient bien les clés Supabase
2. Le serveur de développement a bien été redémarré
3. Votre email a été confirmé dans Supabase
4. Les dépendances sont à jour (`npm install`)

Pour plus d'informations, consultez :
- **GUIDE_MIGRATION_SUPABASE.md** : Documentation complète de la migration
- **PROCHAINES_ETAPES.md** : Étapes suivantes après la migration
- **SCRIPTS_UTILITAIRES.md** : Scripts disponibles pour la gestion
