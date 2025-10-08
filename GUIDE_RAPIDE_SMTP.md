# Guide Rapide : Configuration SMTP Brevo dans Supabase

## ❌ Erreur Actuelle

```
POST https://dqsbfnsicmzovlrhuoif.supabase.co/auth/v1/recover 500 (Internal Server Error)
```

**Cause** : Supabase ne peut pas envoyer d'emails car le SMTP n'est pas configuré.

---

## ✅ Solution : Configurer Brevo SMTP (5 minutes)

### Étape 1 : Obtenir vos identifiants Brevo SMTP

1. Allez sur [https://app.brevo.com](https://app.brevo.com)
2. Connectez-vous à votre compte
3. Cliquez sur votre nom (en haut à droite) → **"SMTP & API"**
4. Cliquez sur l'onglet **"SMTP"**
5. Notez les informations suivantes :

```
Serveur SMTP : smtp-relay.brevo.com
Port : 587
Login : votre-email@domaine.com
Mot de passe SMTP : votre-clé-smtp (PAS votre mot de passe Brevo !)
```

⚠️ **Important** : Si vous n'avez pas de clé SMTP, cliquez sur **"Générer une nouvelle clé SMTP"**

---

### Étape 2 : Configurer SMTP dans Supabase

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **Virtus** (ID: `dqsbfnsicmzovlrhuoif`)
3. Dans le menu de gauche : **Authentication** → **Settings**
4. Faites défiler jusqu'à **"SMTP Settings"**
5. Activez **"Enable Custom SMTP"**
6. Remplissez les champs :

| Champ | Valeur |
|-------|--------|
| **Sender email** | `noreply@mktraining.fr` (ou votre email) |
| **Sender name** | `Virtus - MK Training` |
| **Host** | `smtp-relay.brevo.com` |
| **Port** | `587` |
| **Username** | Votre email Brevo |
| **Password** | Votre clé SMTP Brevo |

7. Cliquez sur **"Save"**

---

### Étape 3 : Tester

1. Retournez sur votre application : [https://virtusofficiel.netlify.app](https://virtusofficiel.netlify.app)
2. Allez dans **"Mes Clients"**
3. Cliquez sur **"Renvoyer l'invitation"** pour un client
4. Vérifiez que l'email est bien reçu

---

## 🔍 Vérification Alternative

Si vous n'avez pas encore de compte Brevo, vous pouvez temporairement utiliser le service SMTP par défaut de Supabase :

1. Dans Supabase → Authentication → Settings
2. **Désactivez** "Enable Custom SMTP"
3. Supabase utilisera son propre service d'envoi (limité mais fonctionnel pour les tests)

⚠️ **Attention** : Le service par défaut de Supabase a des limitations :
- Emails limités par jour
- Peut arriver en spam
- Pas de personnalisation de l'expéditeur

---

## 📧 Vérifier que l'email expéditeur est validé

Dans Brevo :
1. Allez dans **Settings** → **Senders**
2. Vérifiez que votre email expéditeur est **validé** (icône verte ✓)
3. Si non validé, cliquez sur **"Verify"** et suivez les instructions

---

## 🐛 Dépannage

### L'erreur 500 persiste après configuration

1. Vérifiez que vous avez bien cliqué sur **"Save"** dans Supabase
2. Attendez 1-2 minutes (propagation des paramètres)
3. Videz le cache du navigateur et rechargez

### L'email n'arrive pas

1. Vérifiez les **spams**
2. Vérifiez que l'email expéditeur est validé dans Brevo
3. Consultez les logs dans Supabase : **Logs** → **Auth Logs**

### Erreur "Authentication failed"

- Vérifiez que vous utilisez bien la **clé SMTP** et non votre mot de passe Brevo
- Régénérez une nouvelle clé SMTP dans Brevo

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **CONFIGURATION_BREVO_SMTP.md** : Guide complet avec captures d'écran
- **test-email-flow.cjs** : Script de test pour diagnostiquer les problèmes

---

## 🎯 Résumé

1. ✅ Obtenir les identifiants SMTP Brevo
2. ✅ Activer Custom SMTP dans Supabase
3. ✅ Remplir les paramètres SMTP
4. ✅ Sauvegarder et tester

**Temps estimé** : 5 minutes

---

**Besoin d'aide ?** Consultez la documentation complète ou testez avec le script `node test-email-flow.cjs`
