# Guide de Test - Persistance Supabase

## 🎯 Objectif

Ce guide vous permet de tester que les données sont correctement persistées dans Supabase pour les fonctionnalités critiques.

---

## 📋 Prérequis

1. L'application doit être démarrée : `npm run dev`
2. Vous devez avoir un compte utilisateur (coach ou admin)
3. Accès à l'interface Supabase pour vérifier les données

---

## ✅ Test 1 : Programmes d'Entraînement

### Étapes

1. **Connexion**
   - Connectez-vous en tant que coach ou admin

2. **Créer un Programme**
   - Aller dans "Musculation" → "Créer un programme"
   - Remplir les informations :
     - Nom : "Test Programme Persistance"
     - Objectif : "Test"
     - Nombre de semaines : 4
   - Ajouter au moins une séance avec des exercices
   - Cliquer sur "Enregistrer"

3. **Vérifier la Persistance**
   - **Rafraîchir la page** (F5)
   - Aller dans "Musculation" → "Bibliothèque"
   - ✅ Le programme "Test Programme Persistance" doit être visible

4. **Vérifier dans Supabase**
   - Ouvrir l'interface Supabase
   - Aller dans "Table Editor" → "programs"
   - ✅ Une nouvelle ligne doit exister avec le nom "Test Programme Persistance"

5. **Modifier le Programme**
   - Cliquer sur le programme
   - Modifier le nom en "Test Programme Modifié"
   - Enregistrer
   - Rafraîchir la page
   - ✅ Le nom doit être "Test Programme Modifié"

### Résultat Attendu

- ✅ Le programme est créé dans Supabase
- ✅ Le programme persiste après rafraîchissement
- ✅ Les modifications sont sauvegardées

---

## ✅ Test 2 : Plans Nutritionnels

### Étapes

1. **Créer un Plan Nutritionnel**
   - Aller dans "Nutrition" → "Créer un plan"
   - Remplir les informations :
     - Nom : "Test Plan Nutrition"
     - Objectif : "Perte de poids"
     - Nombre de semaines : 2
   - Ajouter des aliments dans les repas
   - Cliquer sur "Enregistrer"

2. **Vérifier la Persistance**
   - **Rafraîchir la page** (F5)
   - Aller dans "Nutrition" → "Bibliothèque"
   - ✅ Le plan "Test Plan Nutrition" doit être visible

3. **Vérifier dans Supabase**
   - Ouvrir l'interface Supabase
   - Aller dans "Table Editor" → "nutrition_plans"
   - ✅ Une nouvelle ligne doit exister avec le nom "Test Plan Nutrition"

4. **Modifier le Plan**
   - Cliquer sur le plan
   - Modifier le nom en "Test Plan Modifié"
   - Enregistrer
   - Rafraîchir la page
   - ✅ Le nom doit être "Test Plan Modifié"

### Résultat Attendu

- ✅ Le plan est créé dans Supabase
- ✅ Le plan persiste après rafraîchissement
- ✅ Les modifications sont sauvegardées

---

## ✅ Test 3 : Système de Messagerie

### Étapes

1. **Envoyer un Message (Coach)**
   - Aller dans "Messagerie"
   - Sélectionner un client
   - Écrire un message : "Test message persistance"
   - Envoyer

2. **Vérifier la Persistance**
   - **Rafraîchir la page** (F5)
   - Aller dans "Messagerie"
   - Sélectionner le même client
   - ✅ Le message "Test message persistance" doit être visible

3. **Vérifier dans Supabase**
   - Ouvrir l'interface Supabase
   - Aller dans "Table Editor" → "messages"
   - ✅ Une nouvelle ligne doit exister avec le contenu "Test message persistance"

4. **Tester en tant que Client**
   - Se connecter en tant que client (ou utiliser l'impersonation)
   - Aller dans "Messagerie"
   - ✅ Le message du coach doit être visible
   - Répondre avec "Réponse du client"
   - Rafraîchir la page
   - ✅ La réponse doit être visible

### Résultat Attendu

- ✅ Les messages sont créés dans Supabase
- ✅ Les messages persistent après rafraîchissement
- ✅ Les conversations sont visibles des deux côtés (coach et client)

---

## ✅ Test 4 : Assignation à un Client

### Étapes

1. **Assigner un Programme**
   - Créer un nouveau programme
   - Sélectionner un client dans la liste déroulante
   - Enregistrer le programme

2. **Vérifier l'Assignation**
   - Aller dans "Clients"
   - Cliquer sur le client sélectionné
   - ✅ Le programme doit apparaître dans la section "Programmes assignés"

3. **Vérifier en tant que Client**
   - Se connecter en tant que client (ou impersonation)
   - Aller dans "Mon Programme"
   - ✅ Le programme assigné doit être visible

### Résultat Attendu

- ✅ Le programme est assigné au client
- ✅ L'assignation persiste après rafraîchissement
- ✅ Le client peut voir son programme

---

## ✅ Test 5 : Assignation d'un Plan Nutritionnel

### Étapes

1. **Assigner un Plan**
   - Créer un nouveau plan nutritionnel
   - Sélectionner un client dans la liste déroulante
   - Enregistrer le plan

2. **Vérifier l'Assignation**
   - Aller dans "Clients"
   - Cliquer sur le client sélectionné
   - ✅ Le plan doit apparaître dans la section "Plans nutritionnels"

3. **Vérifier en tant que Client**
   - Se connecter en tant que client
   - Aller dans "Nutrition"
   - ✅ Le plan assigné doit être visible

### Résultat Attendu

- ✅ Le plan est assigné au client
- ✅ L'assignation persiste après rafraîchissement
- ✅ Le client peut voir son plan

---

## 🐛 Résolution de Problèmes

### Problème : Les données ne s'affichent pas après rafraîchissement

**Causes possibles** :
1. Service Worker en cache → Voir `DESINSTALLER_SERVICE_WORKER.md`
2. Erreur de connexion à Supabase → Vérifier la console du navigateur
3. Erreur RLS → Vérifier les politiques dans Supabase

**Solution** :
```bash
# 1. Vider le cache du navigateur
Ctrl + Shift + Delete

# 2. Désinstaller le Service Worker
# Suivre les instructions dans DESINSTALLER_SERVICE_WORKER.md

# 3. Vérifier les logs
# Ouvrir la console du navigateur (F12)
# Chercher les erreurs en rouge
```

### Problème : Erreur "Permission denied"

**Cause** : Politiques RLS trop restrictives

**Solution** :
```sql
-- Exécuter dans Supabase SQL Editor
-- Voir le fichier fix_rls_final.sql
```

### Problème : Les messages ne s'affichent pas

**Cause** : Changement de structure du type Message

**Solution** :
- Vérifier que les anciens messages utilisent `clientId` et `text`
- Les nouveaux messages utilisent `recipientId` et `content`
- Le code gère les deux formats pour la compatibilité

---

## 📊 Checklist de Test

Cochez chaque test réussi :

- [ ] Test 1 : Création de programme
- [ ] Test 1 : Modification de programme
- [ ] Test 1 : Persistance après rafraîchissement
- [ ] Test 2 : Création de plan nutritionnel
- [ ] Test 2 : Modification de plan
- [ ] Test 2 : Persistance après rafraîchissement
- [ ] Test 3 : Envoi de message (coach)
- [ ] Test 3 : Envoi de message (client)
- [ ] Test 3 : Persistance après rafraîchissement
- [ ] Test 4 : Assignation de programme à un client
- [ ] Test 4 : Visibilité côté client
- [ ] Test 5 : Assignation de plan nutritionnel
- [ ] Test 5 : Visibilité côté client

---

## 🎉 Succès !

Si tous les tests sont validés, la persistance Supabase fonctionne correctement !

Vous pouvez maintenant utiliser l'application en toute confiance, vos données seront sauvegardées.

---

**Dernière mise à jour** : 5 octobre 2025
