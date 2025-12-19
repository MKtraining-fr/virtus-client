# Configuration Resend SMTP pour Supabase

**Date** : 15 décembre 2025  
**Application** : Virtus  
**Objectif** : Configurer Resend SMTP dans Supabase pour l'envoi d'emails fiables (remplacement de Brevo)

---

## 📋 Pourquoi Resend ?

| Critère | Brevo (ancien) | Resend (nouveau) |
|:---|:---|:---|
| **Plan gratuit** | 300 emails/jour | 3000 emails/mois |
| **Logo dans emails** | Oui (plan gratuit) | Non |
| **Simplicité** | Configuration SMTP classique | API moderne + SMTP |
| **Délivrabilité** | Bonne | Excellente |
| **Intégration Supabase** | Manuelle | Native (intégration officielle) |

---

## 🔑 Étape 1 : Créer un compte Resend

1. Allez sur [https://resend.com](https://resend.com)
2. Cliquez sur **"Get Started"**
3. Créez un compte avec votre email

---

## 🌐 Étape 2 : Vérifier votre domaine

**Important** : Pour envoyer des emails depuis `@mktraining.fr`, vous devez vérifier ce domaine.

### 2.1 Ajouter le domaine

1. Dans le dashboard Resend, allez dans **"Domains"** (menu de gauche)
2. Cliquez sur **"Add Domain"**
3. Entrez : `mktraining.fr`
4. Cliquez sur **"Add"**

### 2.2 Configurer les enregistrements DNS

Resend vous donnera des enregistrements DNS à ajouter chez votre hébergeur de domaine :

| Type | Nom | Valeur |
|:---|:---|:---|
| **TXT** | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3...` (clé DKIM) |
| **TXT** | `@` ou `mktraining.fr` | `v=spf1 include:amazonses.com ~all` |
| **MX** | `@` (optionnel, pour recevoir) | `feedback-smtp.eu-west-1.amazonses.com` |

### 2.3 Vérifier le domaine

1. Après avoir ajouté les enregistrements DNS, retournez dans Resend
2. Cliquez sur **"Verify"** à côté de votre domaine
3. Attendez la propagation DNS (peut prendre jusqu'à 48h, généralement 5-30 min)
4. Le statut passera de "Pending" à **"Verified"** ✓

---

## 🔐 Étape 3 : Créer une clé API

1. Dans le dashboard Resend, allez dans **"API Keys"** (menu de gauche)
2. Cliquez sur **"Create API Key"**
3. Donnez un nom : `Virtus Supabase SMTP`
4. Sélectionnez les permissions : **"Sending access"** → **"Full access"**
5. Sélectionnez le domaine : `mktraining.fr`
6. Cliquez sur **"Add"**
7. **Copiez la clé API** (elle ne sera plus visible après)

⚠️ **Important** : Conservez cette clé en lieu sûr, elle sera utilisée comme mot de passe SMTP.

---

## ⚙️ Étape 4 : Configurer Supabase

### 4.1 Accéder aux paramètres SMTP

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **Virtus**
3. Dans le menu de gauche, cliquez sur **"Project Settings"** (icône engrenage)
4. Cliquez sur l'onglet **"Authentication"**
5. Faites défiler jusqu'à la section **"SMTP Settings"**

### 4.2 Activer et configurer SMTP

1. Activez l'option **"Enable Custom SMTP"**
2. Remplissez les champs avec les valeurs suivantes :

| Champ | Valeur |
|:---|:---|
| **Sender email** | `noreply@mktraining.fr` |
| **Sender name** | `Virtus - MK Training` |
| **Host** | `smtp.resend.com` |
| **Port number** | `465` |
| **Minimum interval between emails** | `60` (secondes) |
| **Username** | `resend` |
| **Password** | `re_VOTRE_CLE_API` (la clé API copiée à l'étape 3) |

3. Cliquez sur **"Save"**

---

## 📧 Étape 5 : Personnaliser les templates d'email (optionnel)

### 5.1 Accéder aux templates

1. Dans Supabase, allez dans **"Authentication"** → **"Email Templates"**

### 5.2 Templates disponibles

| Template | Usage |
|:---|:---|
| **Confirm signup** | Email de confirmation d'inscription |
| **Invite user** | Email d'invitation (utilisé par `invite-user` Edge Function) |
| **Magic Link** | Connexion sans mot de passe |
| **Change Email Address** | Confirmation de changement d'email |
| **Reset Password** | Réinitialisation de mot de passe |

### 5.3 Exemple de template "Invite user"

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitation - Virtus</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">Virtus</h1>
    <p style="color: #666; margin: 5px 0;">Votre plateforme de coaching sportif</p>
  </div>
  
  <h2 style="color: #1f2937;">Bienvenue !</h2>
  
  <p>Vous avez été invité(e) à rejoindre Virtus par votre coach.</p>
  
  <p>Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à votre espace personnel :</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background-color: #2563eb; color: white; padding: 14px 32px; 
              text-decoration: none; border-radius: 8px; display: inline-block;
              font-weight: 600;">
      Créer mon compte
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">Ce lien expirera dans 24 heures.</p>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
  
  <p style="font-size: 12px; color: #9ca3af; text-align: center;">
    Cet email a été envoyé par Virtus - MK Training<br>
    Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
  </p>
</body>
</html>
```

---

## ✅ Étape 6 : Tester la configuration

### Test 1 : Inviter un client

1. Connectez-vous à Virtus en tant que coach
2. Allez dans **"Mes Clients"**
3. Cliquez sur **"Inviter un client"**
4. Entrez une adresse email de test
5. Vérifiez que l'email d'invitation est bien reçu

### Test 2 : Réinitialisation de mot de passe

1. Sur la page de connexion, cliquez sur **"Mot de passe oublié ?"**
2. Entrez une adresse email valide
3. Vérifiez que l'email de réinitialisation est bien reçu

### Test 3 : Vérifier les logs Resend

1. Dans le dashboard Resend, allez dans **"Emails"**
2. Vous devriez voir les emails envoyés avec leur statut (Delivered, Opened, etc.)

---

## 🐛 Dépannage

### Problème : "Domain not verified"

**Solution** :
1. Vérifiez que les enregistrements DNS sont bien configurés
2. Utilisez [https://mxtoolbox.com](https://mxtoolbox.com) pour vérifier la propagation DNS
3. Attendez jusqu'à 48h pour la propagation complète

### Problème : "Invalid API key"

**Solution** :
1. Vérifiez que vous utilisez bien la clé API complète (commence par `re_`)
2. Régénérez une nouvelle clé si nécessaire
3. Assurez-vous qu'il n'y a pas d'espaces avant/après la clé

### Problème : Les emails arrivent en spam

**Solution** :
1. Vérifiez que le domaine est bien vérifié dans Resend
2. Assurez-vous que les enregistrements SPF et DKIM sont corrects
3. Évitez les mots déclencheurs de spam dans vos templates

### Problème : "Rate limit exceeded"

**Solution** :
- Plan gratuit : 100 emails/jour, 10 emails/seconde
- Augmentez l'intervalle minimum entre emails dans Supabase (60-120 secondes)

---

## 📊 Limites Resend

### Plan Gratuit (Free)

- ✅ 3 000 emails/mois
- ✅ 100 emails/jour
- ✅ 1 domaine personnalisé
- ✅ Pas de logo Resend
- ✅ API + SMTP

### Plan Pro (20$/mois)

- ✅ 50 000 emails/mois
- ✅ Domaines illimités
- ✅ Support prioritaire
- ✅ Webhooks avancés

---

## 📝 Checklist de Configuration

- [ ] Compte Resend créé
- [ ] Domaine `mktraining.fr` ajouté dans Resend
- [ ] Enregistrements DNS (SPF, DKIM) configurés
- [ ] Domaine vérifié (statut "Verified")
- [ ] Clé API créée et copiée
- [ ] Custom SMTP activé dans Supabase
- [ ] Paramètres SMTP configurés dans Supabase
- [ ] Templates d'email personnalisés (optionnel)
- [ ] Test d'invitation client effectué
- [ ] Test de réinitialisation de mot de passe effectué

---

## 🔗 Ressources Utiles

- [Documentation Resend SMTP](https://resend.com/docs/send-with-supabase-smtp)
- [Dashboard Resend](https://resend.com/emails)
- [Intégration Supabase + Resend](https://supabase.com/partners/integrations/resend)
- [Documentation Supabase Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Préparé par** : Manus AI  
**Date** : 15 décembre 2025  
**Remplace** : CONFIGURATION_BREVO_SMTP.md
