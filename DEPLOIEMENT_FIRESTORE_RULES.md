# Guide de Déploiement des Règles de Sécurité Firestore

## Prérequis

1. **Firebase CLI** installé globalement :
   ```bash
   npm install -g firebase-tools
   ```

2. **Authentification** à Firebase :
   ```bash
   firebase login
   ```

## Étapes de Déploiement

### 1. Initialiser Firebase dans le projet (si pas déjà fait)

```bash
cd /chemin/vers/virtus
firebase init firestore
```

Sélectionnez :
- Votre projet Firebase existant
- Acceptez le fichier `firestore.rules` par défaut
- Acceptez le fichier `firestore.indexes.json` par défaut

### 2. Déployer les règles de sécurité

```bash
firebase deploy --only firestore:rules
```

### 3. Vérifier le déploiement

Connectez-vous à la [Console Firebase](https://console.firebase.google.com/) :
1. Sélectionnez votre projet
2. Allez dans **Firestore Database** > **Règles**
3. Vérifiez que les règles sont bien déployées

## Structure des Règles

Les règles implémentées suivent ce modèle de sécurité :

### Rôles et Permissions

| Collection | Admin | Coach | Client |
|------------|-------|-------|--------|
| **clients** | Lecture/Écriture complète | Lecture de ses clients + son profil, Écriture limitée | Lecture/Écriture de son profil uniquement |
| **exercises** | Lecture/Écriture complète | Lecture/Écriture complète | Lecture uniquement |
| **programs** | Lecture/Écriture complète | Lecture/Écriture de ses programmes | Lecture des programmes assignés |
| **nutritionPlans** | Lecture/Écriture complète | Lecture/Écriture de ses plans | Lecture des plans assignés |
| **messages** | Lecture/Écriture complète | Lecture/Écriture de messages de ses clients | Lecture/Écriture de ses messages |
| **formations** | Lecture/Écriture complète | Lecture/Écriture de ses formations | Lecture des formations accordées |
| **notifications** | Lecture/Écriture complète | Création uniquement | Lecture/Mise à jour (marquer lu) |

### Fonctions de Sécurité Clés

1. **isSignedIn()** : Vérifie que l'utilisateur est authentifié
2. **isOwner(userId)** : Vérifie que l'utilisateur est propriétaire du document
3. **isAdmin()** : Vérifie que l'utilisateur a le rôle admin
4. **isCoach()** : Vérifie que l'utilisateur a le rôle coach
5. **coachHasAccessToClient(clientId)** : Vérifie qu'un coach a accès à un client spécifique

## Points Importants de Sécurité

### 🔒 Protection des Données Sensibles

- **Mots de passe** : Ne sont plus stockés dans Firestore (gérés par Firebase Auth)
- **Rôles** : Les utilisateurs ne peuvent pas modifier leur propre rôle
- **CoachId** : Les clients ne peuvent pas changer leur coach assigné

### 🛡️ Isolation des Données

- Les **clients** ne peuvent voir que leurs propres données
- Les **coachs** ne peuvent voir que leurs clients et leurs propres ressources
- Les **admins** ont un accès complet pour la gestion

### ✅ Validation des Opérations

- Les règles vérifient que l'utilisateur authentifié correspond à l'expéditeur lors de la création de messages
- Les modifications de profil sont limitées pour empêcher l'escalade de privilèges
- Les suppressions sont restreintes aux admins pour la plupart des collections

## Tests des Règles

### Tester dans l'émulateur local

```bash
# Démarrer l'émulateur Firestore
firebase emulators:start --only firestore

# Dans un autre terminal, lancer les tests
npm run test:firestore
```

### Tester dans la Console Firebase

1. Allez dans **Firestore Database** > **Règles**
2. Cliquez sur l'onglet **Simulateur de règles**
3. Testez différents scénarios :
   - Lecture d'un document client en tant que client
   - Tentative de modification du rôle par un client
   - Accès d'un coach aux données d'un client non assigné

## Scénarios de Test Recommandés

### Test 1 : Client accède à son profil ✅
```
Opération : get
Collection : /clients/{clientId}
Auth : uid = clientId
Résultat attendu : Autorisé
```

### Test 2 : Client tente d'accéder au profil d'un autre client ❌
```
Opération : get
Collection : /clients/{otherClientId}
Auth : uid = clientId (différent de otherClientId)
Résultat attendu : Refusé
```

### Test 3 : Coach accède aux données de son client ✅
```
Opération : get
Collection : /clients/{clientId}
Auth : uid = coachId (où client.coachId = coachId)
Résultat attendu : Autorisé
```

### Test 4 : Client tente de modifier son rôle ❌
```
Opération : update
Collection : /clients/{clientId}
Auth : uid = clientId
Données : { role: 'admin' }
Résultat attendu : Refusé
```

### Test 5 : Admin supprime un utilisateur ✅
```
Opération : delete
Collection : /clients/{clientId}
Auth : uid avec role = 'admin'
Résultat attendu : Autorisé
```

## Migration des Données Existantes

⚠️ **IMPORTANT** : Avant de déployer ces règles, vous devez :

1. **Supprimer tous les mots de passe** de la collection `clients`
2. **Migrer les utilisateurs** vers Firebase Authentication
3. **Vérifier que tous les documents** ont les champs nécessaires (role, coachId, etc.)

### Script de Migration (à exécuter avant le déploiement)

```typescript
// scripts/migrateToFirebaseAuth.ts
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const migrateUsers = async () => {
  const db = getFirestore();
  const auth = getAuth();
  
  const clientsSnapshot = await db.collection('clients').get();
  
  for (const clientDoc of clientsSnapshot.docs) {
    const client = clientDoc.data();
    
    try {
      // Créer l'utilisateur dans Firebase Auth
      const userRecord = await auth.createUser({
        uid: clientDoc.id,
        email: client.email,
        displayName: `${client.firstName} ${client.lastName}`,
        password: client.password || Math.random().toString(36).slice(-12) + 'A1!',
      });
      
      console.log(`✅ Utilisateur migré: ${client.email}`);
      
      // Supprimer le mot de passe de Firestore
      await db.collection('clients').doc(clientDoc.id).update({
        password: FieldValue.delete(),
      });
      
    } catch (error) {
      console.error(`❌ Erreur pour ${client.email}:`, error);
    }
  }
};

migrateUsers();
```

## Surveillance et Monitoring

### Activer les logs d'audit

1. Dans la Console Firebase, allez dans **Firestore Database**
2. Cliquez sur **Utilisation**
3. Activez les **Logs d'audit** pour surveiller les accès refusés

### Métriques à surveiller

- **Nombre de requêtes refusées** : Devrait être faible après la migration
- **Latence des requêtes** : Les règles complexes peuvent ajouter de la latence
- **Erreurs d'authentification** : Indicateur de tentatives d'accès non autorisées

## Dépannage

### Erreur : "Missing or insufficient permissions"

**Cause** : L'utilisateur n'a pas les permissions nécessaires

**Solution** :
1. Vérifiez que l'utilisateur est bien authentifié
2. Vérifiez que le rôle de l'utilisateur est correct dans Firestore
3. Consultez les logs Firestore pour voir quelle règle a échoué

### Erreur : "Document does not exist"

**Cause** : Le document client n'existe pas dans Firestore

**Solution** :
1. Assurez-vous que le profil client est créé lors de l'inscription
2. Vérifiez que l'UID Firebase correspond à l'ID du document client

### Les règles ne semblent pas actives

**Cause** : Les règles n'ont pas été déployées ou le cache n'est pas rafraîchi

**Solution** :
```bash
firebase deploy --only firestore:rules --force
```

## Ressources

- [Documentation Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Guide des bonnes pratiques](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Simulateur de règles](https://firebase.google.com/docs/firestore/security/test-rules-emulator)

## Support

En cas de problème avec les règles de sécurité :
1. Consultez les logs dans la Console Firebase
2. Testez avec l'émulateur local
3. Vérifiez que la structure des données correspond aux règles
