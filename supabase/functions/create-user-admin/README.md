# Edge Function: create-user-admin

## Description

Cette Edge Function permet à un administrateur de créer un nouvel utilisateur (coach ou client) directement sans envoyer d'email de confirmation. Elle utilise l'API Admin de Supabase pour créer le compte d'authentification avec confirmation automatique.

## Fonctionnalités

- Création d'utilisateur sans envoi d'email
- Vérification que l'appelant est un administrateur
- Création simultanée du compte Auth et du profil dans la table `clients`
- Rollback automatique en cas d'erreur lors de la création du profil

## Déploiement

Pour déployer cette fonction sur Supabase :

```bash
supabase functions deploy create-user-admin
```

## Variables d'environnement requises

Les variables suivantes sont automatiquement disponibles dans l'environnement Supabase Edge Functions :

- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service pour les opérations admin
- `SUPABASE_ANON_KEY` : Clé anonyme pour les opérations client

## Utilisation

### Depuis le frontend

```typescript
const { data, error } = await supabase.functions.invoke('create-user-admin', {
  body: {
    email: 'user@example.com',
    password: 'SecurePassword123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+33612345678', // optionnel
    role: 'client', // 'admin', 'coach', ou 'client'
    coachId: 'uuid-du-coach', // optionnel, pour les clients
    affiliationCode: '123456', // optionnel, pour les coachs
    status: 'active', // 'active' ou 'prospect'
  },
});

if (data.success) {
  console.log('Utilisateur créé:', data.user);
} else {
  console.error('Erreur:', data.error);
}
```

## Sécurité

- Seuls les utilisateurs avec le rôle `admin` peuvent appeler cette fonction
- La vérification du rôle est effectuée côté serveur
- Le mot de passe est transmis de manière sécurisée via HTTPS
- L'email est automatiquement confirmé (pas besoin de validation par email)

## Réponse

### Succès (200)

```json
{
  "success": true,
  "user": {
    "id": "uuid-de-l-utilisateur",
    "email": "user@example.com",
    "profile": {
      "id": "uuid-de-l-utilisateur",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "client",
      ...
    }
  }
}
```

### Erreur (400)

```json
{
  "success": false,
  "error": "Message d'erreur détaillé"
}
```

## Erreurs possibles

- `Missing authorization header` : Aucun token d'authentification fourni
- `Unauthorized: Invalid user` : Token invalide ou expiré
- `Unauthorized: Admin access required` : L'utilisateur n'est pas administrateur
- `Missing required fields: ...` : Champs requis manquants
- `Failed to create auth user: ...` : Erreur lors de la création du compte Auth
- `Failed to create user profile: ...` : Erreur lors de la création du profil
