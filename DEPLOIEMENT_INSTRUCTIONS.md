# 🚀 Instructions de Déploiement Rapide

## ⚡ Démarrage Rapide

Votre application Virtus est **prête à être déployée** sur Netlify avec Supabase comme backend.

---

## 📋 Checklist Pré-Déploiement

Exécutez le script de vérification :

```bash
./check-deployment-ready.sh
```

Si toutes les vérifications sont ✅, vous pouvez déployer !

---

## 🚀 Déploiement en 3 Étapes

### Étape 1 : Pousser sur GitHub

```bash
git add .
git commit -m "Prêt pour déploiement Netlify"
git push origin main
```

### Étape 2 : Créer un Site sur Netlify

1. Aller sur https://app.netlify.com
2. Cliquer sur **"Add new site"** → **"Import an existing project"**
3. Choisir **GitHub** et sélectionner le repository **virtus**
4. Netlify détectera automatiquement `netlify.toml`
5. Cliquer sur **"Deploy site"**

### Étape 3 : Configurer les Variables d'Environnement

Dans Netlify, aller dans **Site settings** → **Environment variables** :

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://dqsbfnsicmzovlrhuoif.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**💡 Astuce** : Copiez les valeurs depuis votre fichier `.env` local.

---

## ✅ Tests Post-Déploiement

Une fois déployé, testez :

1. ✅ **Connexion** : Se connecter avec un compte existant
2. ✅ **Programmes** : Créer un programme, rafraîchir → visible
3. ✅ **Nutrition** : Créer un plan, rafraîchir → visible
4. ✅ **Messages** : Envoyer un message, rafraîchir → visible

---

## 📚 Documentation Complète

Pour plus de détails, consultez :

- **DEPLOIEMENT_NETLIFY.md** : Guide complet de déploiement
- **PREPARATION_DEPLOIEMENT_COMPLETE.md** : Récapitulatif des modifications
- **PERSISTANCE_SUPABASE_IMPLEMENTEE.md** : Documentation de la persistance

---

## 🆘 Besoin d'Aide ?

### Problème : Variables d'environnement non définies

**Solution** : Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien définies dans Netlify, puis redéployez.

### Problème : Erreur 404 sur les routes

**Solution** : Vérifiez que `netlify.toml` et `public/_redirects` existent, puis redéployez.

### Problème : Données ne s'affichent pas

**Solution** : Vérifiez les politiques RLS dans Supabase (exécutez `fix_rls_final.sql`).

---

## 🎉 C'est Tout !

Votre application sera en ligne en quelques minutes.

**URL de production** : `https://votre-site.netlify.app`

---

**Préparé par** : Manus AI  
**Date** : 5 octobre 2025
