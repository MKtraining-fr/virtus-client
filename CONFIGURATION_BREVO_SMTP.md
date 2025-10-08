# Configuration Brevo SMTP pour Supabase

**Date** : 7 octobre 2025  
**Application** : Virtus  
**Objectif** : Configurer Brevo SMTP dans Supabase pour l'envoi d'emails fiables

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte Brevo (anciennement Sendinblue) actif
- ✅ Accès au dashboard Supabase de votre projet
- ✅ Les identifiants SMTP Brevo

---

## 🔑 Récupérer les Identifiants SMTP Brevo

### Étape 1 : Se connecter à Brevo

1. Allez sur [https://app.brevo.com](https://app.brevo.com)
2. Connectez-vous avec vos identifiants

### Étape 2 : Accéder aux paramètres SMTP

1. Cliquez sur votre nom en haut à droite
2. Sélectionnez **"SMTP & API"**
3. Cliquez sur l'onglet **"SMTP"**

### Étape 3 : Noter les informations

Vous devriez voir les informations suivantes :

```
Serveur SMTP : smtp-relay.brevo.com
Port : 587 (ou 465 pour SSL)
Login : votre-email@exemple.com
Mot de passe SMTP : votre-clé-smtp
```

⚠️ **Important** : Le mot de passe SMTP n'est **pas** votre mot de passe de connexion Brevo. C'est une clé spécifique générée pour SMTP.

### Étape 4 : Générer une clé SMTP (si nécessaire)

Si vous n'avez pas encore de clé SMTP :

1. Dans la section SMTP, cliquez sur **"Générer une nouvelle clé SMTP"**
2. Donnez-lui un nom (ex: "Virtus App")
3. Copiez la clé générée et conservez-la en lieu sûr

---

## ⚙️ Configuration dans Supabase

### Étape 1 : Accéder aux paramètres d'authentification

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **Virtus** (ID: `dqsbfnsicmzovlrhuoif`)
3. Dans le menu de gauche, cliquez sur **"Authentication"**
4. Cliquez sur **"Email Templates"** ou **"Settings"**

### Étape 2 : Activer Custom SMTP

1. Faites défiler jusqu'à la section **"SMTP Settings"**
2. Activez l'option **"Enable Custom SMTP"**

### Étape 3 : Remplir les paramètres SMTP

Remplissez les champs suivants avec vos identifiants Brevo :

| Champ | Valeur |
|-------|--------|
| **SMTP Host** | `smtp-relay.brevo.com` |
| **SMTP Port** | `587` (TLS) ou `465` (SSL) |
| **SMTP Username** | Votre email Brevo (ex: `contact@mktraining.fr`) |
| **SMTP Password** | Votre clé SMTP Brevo |
| **Sender Email** | L'email expéditeur (ex: `noreply@mktraining.fr`) |
| **Sender Name** | Le nom de l'expéditeur (ex: `Virtus - MK Training`) |

### Étape 4 : Tester la configuration

1. Cliquez sur **"Save"** pour enregistrer les paramètres
2. Supabase devrait afficher un message de confirmation
3. Testez l'envoi d'un email en créant un nouveau compte ou en réinitialisant un mot de passe

---

## 📧 Configuration des Templates d'Email

### Templates disponibles dans Supabase

Supabase propose plusieurs templates d'email que vous pouvez personnaliser :

1. **Confirm signup** : Email de confirmation d'inscription
2. **Invite user** : Email d'invitation d'un utilisateur
3. **Magic Link** : Email avec lien de connexion magique
4. **Change Email Address** : Email de confirmation de changement d'adresse
5. **Reset Password** : Email de réinitialisation de mot de passe

### Personnaliser les templates

Pour chaque template :

1. Allez dans **Authentication → Email Templates**
2. Sélectionnez le template à modifier
3. Personnalisez le contenu (HTML et texte brut)
4. Utilisez les variables disponibles :
   - `{{ .ConfirmationURL }}` : URL de confirmation
   - `{{ .Token }}` : Token de vérification
   - `{{ .TokenHash }}` : Hash du token
   - `{{ .SiteURL }}` : URL de votre site
   - `{{ .Email }}` : Email du destinataire

### Exemple de template personnalisé pour "Reset Password"

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Réinitialisation de mot de passe - Virtus</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Réinitialisation de mot de passe</h1>
    
    <p>Bonjour,</p>
    
    <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Virtus.</p>
    
    <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #2563eb; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 5px; display: inline-block;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    
    <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
    
    <p>Ce lien expirera dans 24 heures.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
    
    <p style="font-size: 12px; color: #666;">
      Cet email a été envoyé par Virtus - MK Training<br>
      Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
      {{ .ConfirmationURL }}
    </p>
  </div>
</body>
</html>
```

---

## 🔧 Configuration dans le Code

### Paramètres de redirection

Dans le code de l'application, les URLs de redirection sont configurées dans `authService.ts` :

```typescript
// Réinitialisation de mot de passe
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/set-password`,
  });

  if (error) {
    throw error;
  }
};
```

### Invitation de client

Dans `AuthContext.tsx`, lors de la création d'un client :

```typescript
// Envoyer un email de réinitialisation de mot de passe
try {
  await supabase.auth.resetPasswordForEmail(userData.email, {
    redirectTo: `${window.location.origin}/set-password`,
  });
  console.log('Email d\'invitation envoyé à:', userData.email);
} catch (emailError) {
  console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', emailError);
}
```

---

## ✅ Vérification de la Configuration

### Test 1 : Création d'un nouveau client

1. Connectez-vous en tant qu'admin ou coach
2. Allez dans **"Mes Clients"**
3. Créez un nouveau client avec une adresse email valide
4. Vérifiez que l'email d'invitation est bien reçu

### Test 2 : Réinitialisation de mot de passe

1. Sur la page de connexion, cliquez sur **"Mot de passe oublié ?"**
2. Entrez une adresse email valide
3. Vérifiez que l'email de réinitialisation est bien reçu
4. Cliquez sur le lien et définissez un nouveau mot de passe

### Test 3 : Renvoi d'invitation

1. Dans la liste des clients, cliquez sur **"Renvoyer l'invitation"**
2. Vérifiez que l'email est bien renvoyé

---

## 🐛 Dépannage

### Problème : Les emails ne sont pas envoyés

**Solutions possibles** :

1. **Vérifier les identifiants SMTP**
   - Assurez-vous que le login et le mot de passe sont corrects
   - Vérifiez que vous utilisez bien la clé SMTP et non votre mot de passe Brevo

2. **Vérifier le port**
   - Essayez le port 587 (TLS) au lieu de 465 (SSL) ou vice-versa

3. **Vérifier l'email expéditeur**
   - L'email expéditeur doit être vérifié dans Brevo
   - Allez dans Brevo → Settings → Senders → Vérifiez votre domaine

4. **Vérifier les logs Supabase**
   - Allez dans Supabase → Logs → Auth Logs
   - Recherchez les erreurs liées à l'envoi d'emails

### Problème : Les emails arrivent en spam

**Solutions possibles** :

1. **Configurer SPF et DKIM**
   - Allez dans Brevo → Settings → Senders
   - Suivez les instructions pour configurer SPF et DKIM pour votre domaine

2. **Utiliser un domaine vérifié**
   - Utilisez une adresse email avec un domaine que vous possédez
   - Vérifiez le domaine dans Brevo

3. **Personnaliser les templates**
   - Évitez les mots déclencheurs de spam
   - Ajoutez un lien de désinscription
   - Incluez votre adresse postale

### Problème : Le lien de réinitialisation ne fonctionne pas

**Solutions possibles** :

1. **Vérifier l'URL de redirection**
   - Assurez-vous que `${window.location.origin}/set-password` est correct
   - Vérifiez que la route `/set-password` existe dans votre application

2. **Vérifier les Redirect URLs dans Supabase**
   - Allez dans Authentication → URL Configuration
   - Ajoutez votre domaine dans "Redirect URLs"
   - Format : `https://votre-domaine.com/set-password`

---

## 📊 Limites et Quotas Brevo

### Plan Gratuit

- ✅ 300 emails/jour
- ✅ SMTP illimité
- ⚠️ Logo Brevo dans les emails

### Plan Lite (19€/mois)

- ✅ 10 000 emails/mois
- ✅ Pas de logo Brevo
- ✅ Support email

### Plan Premium (65€/mois)

- ✅ 20 000 emails/mois
- ✅ Support téléphonique
- ✅ Automatisations avancées

---

## 🎯 Recommandations

### Court Terme

1. ✅ Configurer SMTP Brevo dans Supabase
2. ✅ Tester l'envoi d'emails
3. ✅ Personnaliser les templates d'email
4. ✅ Vérifier que les emails ne tombent pas en spam

### Moyen Terme

1. 🔄 Configurer SPF et DKIM pour votre domaine
2. 🔄 Créer des templates d'email personnalisés pour chaque type d'action
3. 🔄 Mettre en place un système de tracking des emails envoyés
4. 🔄 Ajouter des logs détaillés pour le débogage

### Long Terme

1. 📈 Analyser les taux d'ouverture et de clics
2. 📈 Optimiser les templates en fonction des retours
3. 📈 Mettre en place des emails transactionnels avancés
4. 📈 Intégrer des notifications push en complément

---

## 📝 Checklist de Configuration

- [ ] Compte Brevo créé et vérifié
- [ ] Clé SMTP Brevo générée
- [ ] Custom SMTP activé dans Supabase
- [ ] Paramètres SMTP configurés dans Supabase
- [ ] Email expéditeur vérifié dans Brevo
- [ ] Templates d'email personnalisés
- [ ] Test de création de client effectué
- [ ] Test de réinitialisation de mot de passe effectué
- [ ] Test de renvoi d'invitation effectué
- [ ] SPF et DKIM configurés (optionnel mais recommandé)
- [ ] Redirect URLs configurées dans Supabase
- [ ] Logs vérifiés pour détecter les erreurs

---

## 📚 Ressources Utiles

- [Documentation Brevo SMTP](https://developers.brevo.com/docs/send-emails-with-smtp)
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuration SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
- [Templates d'email Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Préparé par** : Manus AI  
**Date** : 7 octobre 2025
