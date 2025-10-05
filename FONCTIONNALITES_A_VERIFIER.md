# Fonctionnalités à Vérifier - Migration Supabase

## 🎯 Objectif
Vérifier que toutes les fonctionnalités de l'application utilisent correctement Supabase et persistent les données.

---

## 👤 RÔLE ADMIN

### Gestion des Utilisateurs
- [x] **Créer un utilisateur** (coach/client/pratiquant) → ✅ Testé et fonctionnel
- [x] **Modifier un utilisateur** → ✅ Corrigé avec `updateUser`
- [x] **Rattacher un client à un coach** → ✅ Corrigé avec `updateUser`
- [ ] **Transformer un pratiquant en client** (rattachement coach)
- [ ] **Supprimer un utilisateur**
- [ ] **Voir la liste de tous les utilisateurs** → ✅ Fonctionnel
- [ ] **Filtrer les utilisateurs** (par rôle, coach, etc.)

### Gestion des Formations
- [ ] **Créer une formation professionnelle** (pour coachs)
- [ ] **Créer une formation client** (pour clients/pratiquants)
- [ ] **Modifier une formation**
- [ ] **Supprimer une formation**
- [ ] **Définir le prix d'une formation**
- [ ] **Voir la liste des formations**

### Gestion de la Boutique
- [ ] **Créer un partenaire**
- [ ] **Modifier un partenaire**
- [ ] **Supprimer un partenaire**
- [ ] **Créer un produit**
- [ ] **Modifier un produit**
- [ ] **Supprimer un produit**
- [ ] **Définir la visibilité** (coach/client/les deux)
- [ ] **Définir le prix d'un produit**

### Statistiques
- [ ] **Voir le nombre total d'utilisateurs**
- [ ] **Voir le nombre de ventes**
- [ ] **Voir le nombre de formations créées**
- [ ] **Voir les statistiques globales**

### Import de Données
- [ ] **Importer des utilisateurs via CSV**
- [ ] **Importer des exercices via CSV**
- [ ] **Importer des produits via CSV**

### Gestion de la Base d'Exercices
- [ ] **Créer un exercice global** (visible par tous)
- [ ] **Modifier un exercice global**
- [ ] **Supprimer un exercice global**
- [ ] **Catégoriser les exercices**

---

## 👨‍🏫 RÔLE COACH

### Gestion des Clients
- [ ] **Voir la liste de ses clients**
- [ ] **Créer un bilan** (transformer prospect en client)
- [ ] **Voir les détails d'un client**
- [ ] **Modifier les informations d'un client**

### Gestion des Bilans
- [ ] **Créer un bilan initial**
- [ ] **Modifier un bilan**
- [ ] **Voir l'historique des bilans d'un client**
- [ ] **Supprimer un bilan**

### Gestion des Programmes d'Entraînement
- [ ] **Créer un programme pour un client**
- [ ] **Modifier un programme**
- [ ] **Dupliquer un programme**
- [ ] **Supprimer un programme**
- [ ] **Assigner un programme à un client**
- [ ] **Voir les programmes d'un client**

### Gestion des Exercices Personnels
- [ ] **Créer un exercice personnel** (visible uniquement par le coach)
- [ ] **Modifier un exercice personnel**
- [ ] **Supprimer un exercice personnel**
- [ ] **Utiliser les exercices globaux de l'admin**
- [ ] **Utiliser ses exercices personnels dans les programmes**

### Gestion de la Nutrition
- [ ] **Créer un plan nutritionnel pour un client**
- [ ] **Modifier un plan nutritionnel**
- [ ] **Supprimer un plan nutritionnel**
- [ ] **Assigner un plan nutritionnel à un client**

### Messagerie
- [ ] **Envoyer un message à un client**
- [ ] **Recevoir des messages de clients**
- [ ] **Voir l'historique des conversations**

### Permissions Client
- [ ] **Définir l'accès à la boutique** (coach/admin/les deux)
- [ ] **Définir les modules visibles par le client**

---

## 🏃 RÔLE CLIENT / PRATIQUANT

### Profil
- [ ] **Voir son profil**
- [ ] **Modifier son profil**
- [ ] **Voir son coach** (si rattaché)

### Programmes d'Entraînement
- [ ] **Voir ses programmes assignés**
- [ ] **Voir le détail d'un programme**
- [ ] **Marquer une séance comme complétée**
- [ ] **Voir l'historique des séances**

### Nutrition
- [ ] **Voir son plan nutritionnel**
- [ ] **Voir les détails du plan**
- [ ] **Suivre son alimentation**

### Bilans
- [ ] **Voir ses bilans**
- [ ] **Voir l'évolution de ses bilans**

### Messagerie
- [ ] **Envoyer un message à son coach**
- [ ] **Recevoir des messages de son coach**
- [ ] **Voir l'historique des conversations**

### Boutique
- [ ] **Voir les produits accessibles**
- [ ] **Acheter un produit**
- [ ] **Voir l'historique des achats**

### Formations
- [ ] **Voir les formations disponibles**
- [ ] **Acheter une formation**
- [ ] **Accéder aux formations achetées**

### Mode Autonome (Pratiquant)
- [ ] **Créer ses propres programmes**
- [ ] **Créer ses propres plans nutritionnels**
- [ ] **Gérer ses propres exercices**

---

## 🔄 Fonctionnalités Transversales

### Authentification
- [x] **Connexion** → ✅ Fonctionnel
- [x] **Déconnexion** → ✅ Fonctionnel
- [x] **Inscription** → ✅ Fonctionnel
- [ ] **Réinitialisation de mot de passe**
- [ ] **Confirmation par email** → ⚠️ Désactivé pour les tests

### Notifications
- [ ] **Créer une notification**
- [ ] **Marquer comme lue**
- [ ] **Supprimer une notification**

### Thème
- [ ] **Changer de thème** (clair/sombre)
- [ ] **Persister le choix du thème**

---

## 📊 Légende

- [x] ✅ **Testé et fonctionnel**
- [x] 🔧 **Corrigé**
- [ ] ⏳ **À vérifier**
- [ ] ❌ **Problème identifié**
- [ ] 🚧 **En cours de correction**

---

## 🎯 Prochaines Actions

1. Vérifier systématiquement chaque fonctionnalité
2. Identifier les problèmes de persistance Supabase
3. Corriger les fonctions qui n'utilisent pas Supabase
4. Tester chaque correction
5. Documenter les résultats
