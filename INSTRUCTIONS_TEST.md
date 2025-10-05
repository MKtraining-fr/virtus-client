# Instructions pour Tester l'Application Virtus

## ✅ Étape 2 Terminée : Compte Administrateur Créé

Votre compte administrateur a été créé avec succès :
- **Email** : `contact@mktraining.fr`
- **Mot de passe** : `Darsche93.`
- **Rôle** : admin
- **Statut** : Email confirmé ✓

---

## 🚀 Comment Tester l'Application Maintenant

### Option 1 : Tester en Local sur Votre Machine (Recommandé)

1. **Clonez le dépôt GitHub** (si ce n'est pas déjà fait) :
   ```bash
   git clone https://github.com/MKtraining-fr/virtus.git
   cd virtus
   ```

2. **Installez les dépendances** :
   ```bash
   npm install
   ```

3. **Créez le fichier `.env`** à la racine du projet :
   ```
   VITE_SUPABASE_URL=https://dqsbfnsicmzovlrhuoif.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxc2JmbnNpY216b3Zscmh1b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzY1MTcsImV4cCI6MjA3NTIxMjUxN30.fkhw3Uw7aJzgf_wPypd50_5ypNi4xGrINPXuBHAjuPg
   ```

4. **Démarrez le serveur de développement** :
   ```bash
   npm run dev
   ```

5. **Ouvrez votre navigateur** sur `http://localhost:5173` (ou le port indiqué)

6. **Connectez-vous** avec :
   - Email : `contact@mktraining.fr`
   - Mot de passe : `Darsche93.`

---

### Option 2 : Utiliser le Build de Production

Si vous préférez tester la version compilée :

1. **Téléchargez le dossier `dist/`** depuis le sandbox
2. **Servez-le avec un serveur HTTP** :
   ```bash
   cd dist
   python3 -m http.server 8080
   ```
3. **Ouvrez** `http://localhost:8080` dans votre navigateur

---

## 🧪 Tests à Effectuer

### 1. Test de Connexion Administrateur

- [ ] Vous pouvez vous connecter avec `contact@mktraining.fr`
- [ ] Vous êtes redirigé vers le tableau de bord admin
- [ ] Vous voyez le menu administrateur complet

### 2. Test des Fonctionnalités Admin

- [ ] Créer un nouvel utilisateur (client ou coach)
- [ ] Voir la liste de tous les utilisateurs
- [ ] Modifier un profil utilisateur
- [ ] Créer un exercice
- [ ] Voir la liste des exercices

### 3. Test de Création d'un Coach

- [ ] Créer un compte coach
- [ ] Se connecter avec ce compte coach
- [ ] Vérifier que le coach voit son interface spécifique

### 4. Test de Création d'un Client

- [ ] Créer un compte client
- [ ] Assigner ce client à un coach
- [ ] Se connecter avec ce compte client
- [ ] Vérifier que le client voit son interface

### 5. Test des Programmes

- [ ] En tant que coach, créer un programme pour un client
- [ ] En tant que client, voir le programme assigné
- [ ] Ajouter des sessions au programme

### 6. Test de la Nutrition

- [ ] Créer un plan nutritionnel
- [ ] Ajouter des aliments
- [ ] Voir les logs nutritionnels

### 7. Test des Messages

- [ ] Envoyer un message entre coach et client
- [ ] Vérifier la réception du message

---

## ❌ Problèmes Potentiels et Solutions

### Erreur : "Failed to load data from Firestore"

**Cause** : L'application utilise encore l'ancien code Firebase en cache

**Solution** :
```bash
rm -rf node_modules/.vite
npm run dev
```

### Erreur : "Email not confirmed"

**Cause** : L'email n'a pas été confirmé dans Supabase

**Solution** : Allez dans Supabase → Authentication → Users → Confirmez l'email manuellement

### Erreur : "Missing or insufficient permissions"

**Cause** : Les politiques RLS ne sont pas correctement configurées

**Solution** : Vérifiez que toutes les politiques RLS sont bien en place dans Supabase

### L'application ne charge pas les données

**Cause** : Les clés Supabase ne sont pas correctement configurées

**Solution** : Vérifiez le fichier `.env` et redémarrez le serveur

---

## 📊 Vérifications dans Supabase

Pendant vos tests, vous pouvez vérifier dans Supabase :

1. **Authentication → Users** : Voir tous les utilisateurs créés
2. **Table Editor → clients** : Voir les profils des utilisateurs
3. **Table Editor → programs** : Voir les programmes créés
4. **Table Editor → messages** : Voir les messages échangés
5. **Logs** : Voir les requêtes SQL exécutées et les erreurs éventuelles

---

## 🎯 Prochaine Étape : Déploiement

Une fois que tous les tests sont concluants, vous pourrez passer au déploiement en production. Consultez le fichier **PROCHAINES_ETAPES.md** pour les instructions de déploiement.

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes pendant les tests, notez :
- Le message d'erreur exact
- L'action que vous tentiez d'effectuer
- Les logs de la console du navigateur (F12)

Et je pourrai vous aider à résoudre le problème !
