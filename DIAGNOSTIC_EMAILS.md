# Diagnostic : Les Emails N'Arrivent Pas

## ✅ Ce qui fonctionne
- Le message de confirmation s'affiche dans l'application
- Aucune erreur 500 dans la console
- L'appel à Supabase réussit

## ❌ Problème
- L'email n'arrive pas dans la boîte de réception

---

## 🔍 Étapes de Diagnostic

### Étape 1 : Vérifier les Spams
**Temps : 30 secondes**

1. Ouvrez votre boîte mail
2. Allez dans le dossier **Spam / Courrier indésirable**
3. Recherchez un email de `noreply@mktraining.fr` ou `Virtus`

---

### Étape 2 : Vérifier les Logs Supabase
**Temps : 2 minutes**

C'est l'étape la plus importante pour comprendre ce qui se passe.

1. Allez sur [https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/logs/auth-logs](https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/logs/auth-logs)
2. Recherchez les logs récents (dernières minutes)
3. Cherchez des entrées avec :
   - `recover` (réinitialisation de mot de passe)
   - `email` 
   - L'adresse email testée

**Ce que vous devriez voir :**

✅ **Si l'email a été envoyé** :
```
✓ Email sent to user@example.com
✓ Recovery email sent
```

❌ **Si l'email n'a pas été envoyé** :
```
✗ SMTP error
✗ Authentication failed
✗ Connection refused
```

---

### Étape 3 : Vérifier l'Email Expéditeur dans Brevo
**Temps : 2 minutes**

L'email expéditeur doit être **validé** dans Brevo.

1. Allez sur [https://app.brevo.com](https://app.brevo.com)
2. Menu : **Settings** → **Senders**
3. Cherchez `noreply@mktraining.fr`
4. Vérifiez qu'il y a une **icône verte ✓** à côté

**Si l'email n'est pas validé** :
1. Cliquez sur **"Verify"**
2. Suivez les instructions (vous recevrez un email de validation)
3. Cliquez sur le lien dans l'email
4. Retestez l'envoi

---

### Étape 4 : Vérifier que l'Utilisateur Existe dans Auth
**Temps : 1 minute**

L'email de réinitialisation ne peut être envoyé que si l'utilisateur existe dans **Supabase Auth**.

1. Allez sur [https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/auth/users](https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/auth/users)
2. Recherchez l'adresse email testée
3. Vérifiez qu'elle apparaît dans la liste

**Si l'email n'apparaît pas** :
- L'utilisateur n'a pas de compte Auth
- C'est normal si c'est un prospect archivé qui n'a jamais été validé
- Solution : Créez d'abord le compte via "Nouveau Bilan" → "Valider le Bilan"

---

### Étape 5 : Tester avec un Script
**Temps : 2 minutes**

Utilisez le script de test pour diagnostiquer :

```bash
cd /home/ubuntu/virtus
node test-email-flow.cjs
```

Suivez les instructions et entrez l'adresse email à tester.

---

## 🔧 Solutions aux Problèmes Courants

### Problème 1 : L'email expéditeur n'est pas validé dans Brevo

**Symptôme** : Logs Supabase montrent "Email sent" mais rien n'arrive

**Solution** :
1. Validez l'email expéditeur dans Brevo (voir Étape 3)
2. Ou utilisez un email déjà validé

**Alternative temporaire** :
- Utilisez votre email personnel comme expéditeur (s'il est validé dans Brevo)

---

### Problème 2 : Mauvaise clé SMTP

**Symptôme** : Logs Supabase montrent "Authentication failed" ou "SMTP error"

**Solution** :
1. Retournez dans Brevo → SMTP & API → SMTP
2. **Régénérez** une nouvelle clé SMTP
3. Copiez la nouvelle clé
4. Retournez dans Supabase → Authentication → Settings → SMTP Settings
5. Remplacez l'ancien mot de passe par la nouvelle clé
6. Cliquez sur "Save"
7. Attendez 1-2 minutes et retestez

---

### Problème 3 : L'utilisateur n'existe pas dans Auth

**Symptôme** : Logs Supabase montrent "User not found"

**Solution** :
1. Vérifiez que l'utilisateur existe dans Auth (voir Étape 4)
2. Si non, créez le compte via "Nouveau Bilan" → "Valider le Bilan"
3. Ou créez manuellement dans Gestion des utilisateurs (si admin)

---

### Problème 4 : Port SMTP bloqué

**Symptôme** : Logs Supabase montrent "Connection refused" ou "Timeout"

**Solution** :
1. Dans Supabase → SMTP Settings, essayez le **port 465** au lieu de 587
2. Ou essayez **port 2525**
3. Sauvegardez et retestez

---

### Problème 5 : Limite de taux atteinte

**Symptôme** : Logs Supabase montrent "Rate limit exceeded"

**Solution** :
- Attendez 5-10 minutes avant de retester
- Brevo a des limites : 300 emails/jour (plan gratuit)

---

## 📊 Checklist de Vérification

Cochez au fur et à mesure :

- [ ] Vérifié les spams
- [ ] Consulté les logs Supabase Auth
- [ ] Vérifié que l'email expéditeur est validé dans Brevo
- [ ] Vérifié que l'utilisateur existe dans Supabase Auth
- [ ] Testé avec le script `test-email-flow.cjs`
- [ ] Vérifié la clé SMTP (pas le mot de passe Brevo)
- [ ] Attendu 1-2 minutes après la configuration
- [ ] Essayé avec un autre port (465 ou 2525)

---

## 🎯 Prochaines Étapes

Une fois que vous avez identifié le problème via les logs Supabase :

1. **Si "Email sent" apparaît dans les logs** :
   - Le problème vient de Brevo (email expéditeur non validé, limite atteinte, etc.)
   - Vérifiez dans Brevo → Statistics → Real-time

2. **Si "SMTP error" apparaît dans les logs** :
   - Le problème vient de la configuration SMTP
   - Vérifiez la clé SMTP, le port, etc.

3. **Si "User not found" apparaît dans les logs** :
   - L'utilisateur n'existe pas dans Auth
   - Créez d'abord le compte

---

## 📞 Besoin d'Aide ?

Partagez-moi :
1. Ce que vous voyez dans les **logs Supabase Auth**
2. Si l'email expéditeur est **validé dans Brevo**
3. Si l'utilisateur **existe dans Supabase Auth**

Je pourrai alors vous donner une solution précise !

---

**Créé le** : 8 octobre 2025  
**Application** : Virtus
