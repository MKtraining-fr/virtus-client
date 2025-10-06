# Réponses Complètes aux Questions de Clarification - Base de Données Virtus

## A. STRUCTURE DES MOUVEMENTS

### Q1. Les 3 bases de mouvements (Musculation, Mobilité, Échauffement)
**Réponse :** Ne sait pas ce qui est le mieux, sachant qu'il pourrait potentiellement mettre de la mobilité avec de la musculation, etc.

**💡 Recommandation :** 1 seule table `exercises` avec un champ `type` (ENUM: 'musculation', 'mobilite', 'echauffement') pour plus de flexibilité et permettre le mélange.

### Q2. Mouvements personnalisés du coach
- ✅ Le coach doit choisir le type lors de la création
- ✅ Modifiable après création
- ✅ Peut être supprimé

### Q3. Alternatives de mouvements
- ✅ Deux alternatives maximum par mouvement
- ✅ Renvoie vers d'autres mouvements (liens/IDs)

---

## B. SÉANCES D'ENTRAÎNEMENT

### Q4. Structure d'une séance
- ✅ Nom et description pour différencier les séances du même type (ex: plusieurs séances "Perte de poids")
- ✅ Ordre précis des exercices défini par le coach
- ✅ **MAIS** le client peut intervertir l'ordre des exercices ET des séances du programme sur une semaine
- ✅ Notes générales sur la séance (en plus des notes par exercice)

### Q5. Tempo (code 4 chiffres)
- ✅ Format structuré : `3010` = 3s descente, 0s pause, 1s montée, 0s pause
- ✅ Champ structuré (4 chiffres)

### Q6. Intensification
- ✅ Liste de techniques (protocoles) : superset, drop set, rest-pause, etc.
- ✅ Le coach peut ajouter ses propres techniques d'intensification
- ✅ Système de personnalisation nécessaire (certaines techniques ajoutent une sous-série par exemple)
- **💡 Important :** Pourrait devenir une base de données à part entière (`intensification_techniques`)

### Q7. Réutilisation de séances
- ✅ Une séance = **template** qui peut être :
  - Réutilisé dans plusieurs programmes
  - Dupliqué
  - Modifié
- ✅ Même principe pour les programmes

---

## C. PROGRAMMES D'ENTRAÎNEMENT

### Q8. Structure d'un programme
- ✅ **Limite max :** 52 semaines (pour éviter d'avoir une limite technique, personne ne fera jamais 52 semaines en pratique)
- ✅ **Séances par semaine :** minimum 2, jusqu'à 12
- ✅ **Modèle flexible :** Le modèle hebdomadaire peut être mis de côté
  - Le client enchaîne les séances comme elles viennent
  - Que ça prenne 10 ou 15 jours pour compléter une "semaine"
- ✅ **Par défaut :** Suite de séances (Séance 1, 2, 3...)
- ✅ **Option :** Au choix du coach, peut assigner à des jours spécifiques (Lundi, Mardi...)

### Q9. Évolution des paramètres
- ✅ Peut être **semaine par semaine**
- ✅ Ou **par cycles** (ex: une fois toutes les 4 semaines)
- ✅ Cycles possibles et flexibles

### Q10. Assignation aux clients
- ✅ Peut être assigné à **plusieurs clients en même temps**
- ⚠️ **Important :** Les clients ne doivent **pas savoir** qu'ils ont le même programme
- ✅ Fonction **"Modifier avant assignation"** nécessaire pour personnaliser
- ✅ **Historique** disponible dans le profil client :
  - Historique des programmes assignés
  - Historique des performances

---

## D. SUIVI DES PERFORMANCES

### Q11. Enregistrement des performances
- ✅ **Exercice par exercice** pendant la séance
- ✅ Si le client change l'ordre des exercices ou séances, **cela doit être enregistré**
- ✅ Toutes les infos demandées **en fin de séance** (questionnaire)

### Q12. Données enregistrées par série
- ✅ **Chaque donnée est unique par série**
- ✅ Exemple :
  - Série 1 : 10 reps à 50kg, repos 90s
  - Série 2 : 8 reps à 50kg, repos 120s
  - Série 3 : 6 reps à 52.5kg, repos 150s

### Q13. Questionnaire de fin de séance
- ✅ Questions toujours les mêmes par défaut
- ✅ **Personnalisable par le coach**
- ✅ Ce questionnaire fait partie des **bilans disponibles** du coach
- ✅ **Bilans par défaut** :
  - Présents dans l'application
  - Non effaçables par le coach
  - Peuvent être dupliqués et modifiés (la copie)
- ✅ Le coach peut créer des bilans **de zéro**

### Q14. Historique des performances
- ✅ **Durée :** Tant que le client n'est pas définitivement supprimé de la base de données du coach
- ✅ **Accès client :** Le client a accès à ses performances dans son profil (interface client/pratiquant)
- ✅ **Accès aux anciens programmes :** Tous les anciens programmes dans une fenêtre dédiée dans son interface

---

## E. NUTRITION - ALIMENTS ET RECETTES

### Q15. Familles alimentaires
**Liste prédéfinie des familles avec valeurs nutritionnelles moyennes pour 100g :**

| Groupe alimentaire | Protéines (g) | Glucides (g) | Lipides (g) | Calories (kcal) |
|-------------------|---------------|--------------|-------------|-----------------|
| Poissons | 19.5 | 0.0 | 5.0 | 145 |
| Fruits frais | 0.8 | 12.0 | 0.3 | 52 |
| Légumes frais | 1.2 | 4.0 | 0.2 | 25 |
| Fruits secs | 3.0 | 64.0 | 0.6 | 273 |
| Féculents cuits (pâtes, riz) | 3.0 | 25.0 | 0.5 | 130 |
| Légumineuses cuites | 8.0 | 20.0 | 0.5 | 125 |
| Céréales petit-déj. | 8.0 | 75.0 | 3.0 | 370 |
| Tubercules (pomme de terre) | 2.0 | 17.0 | 0.1 | 80 |
| Viande maigre | 21.0 | 0.0 | 5.0 | 145 |
| Œufs | 12.5 | 1.0 | 10.5 | 145 |
| Produits de la mer (crustacés) | 18.0 | 0.5 | 1.5 | 90 |
| Produits laitiers (lait demi-écrémé) | 3.3 | 5.0 | 1.5 | 46 |
| Fromages (moyenne) | 20.0 | 1.5 | 28.0 | 350 |
| Matières grasses (végétales/animales) | 0.0 | 0.0 | 100.0 | 900 |
| Fruits oléagineux / graines | 15.0 | 15.0 | 55.0 | 610 |
| Produits sucrés | 2.0 | 70.0 | 10.0 | 380 |
| Produits sucrés et gras (viennoiseries) | 6.0 | 45.0 | 20.0 | 430 |

### Q16. Aliments personnalisés
- ✅ Le coach peut ajouter ses propres aliments dans la base
- ✅ Visibles uniquement par lui et ses clients (comme les mouvements)

### Q17. Recettes
- ✅ Calcul automatique des macros à partir des ingrédients
- ✅ Le coach peut créer des recettes personnalisées

---

## F. PLANS ALIMENTAIRES

### Q18. Plans par catégories vs par aliments
- ✅ Un plan peut **mixer les deux approches**
- ✅ Exemple :
  - Petit-déjeuner : par catégories (50g protéines, 60g glucides)
  - Déjeuner : par aliments précis (150g poulet, 200g riz, 100g brocolis)
  - Collation : par catégories (20g protéines)

### Q19. Structure d'un plan
- ✅ **Les deux** : organisé par jour ET par type de repas
- ✅ Au choix du coach, en fonction des besoins du client
- ✅ Flexibilité totale

### Q20. Assignation et personnalisation
- ✅ Peut être assigné à **plusieurs clients en même temps**
- ✅ **Personnalisation possible** pour chaque client
- ✅ **Dashboard coach :** Bouton prévu pour **modifier un plan en cours** (sans impacter le plan template dans la BDD)

---

## G. SUIVI NUTRITIONNEL

### Q21. Journal alimentaire
- ✅ Le client a un **journal avec tous les détails**
- ✅ Si le plan est suivi, il ne change rien
- ✅ **Mais** il peut **tout modifier** :
  - Changer les quantités
  - Remplacer un aliment
  - Ajouter des aliments non prévus

### Q22. Adhérence au plan
- ⚠️ **À définir ensemble** : Algorithme d'adhérence à valider
- ✅ **Deux indicateurs d'adhérence** à créer :
  1. Adhérence aux séances d'entraînement
  2. Adhérence au plan alimentaire
- 💡 Propositions d'algorithmes à soumettre pour validation

---

## H. GESTION MULTI-CLIENTS

### Q23. Notifications
- ✅ Quand un coach assigne un programme/plan, le client reçoit une notification **immédiatement**
- ✅ **Notification push** directement sur son téléphone

### Q24. Communication
- ✅ **Système de messagerie** en place entre coach et client
- ✅ **Système de "vu"** :
  - Disponible **uniquement pour le coach**
  - Le coach voit si le client a vu son message ou non
- ✅ **Vocaux** :
  - **Seul le coach** peut envoyer des vocaux
  - Le client ne peut pas envoyer de vocaux
- ❌ **Pas de commentaires en direct** sur les performances
  - Le coach ne peut pas commenter directement dans l'app pendant que le client fait sa séance

---

## I. PERMISSIONS ET VISIBILITÉ

### Q25. Mouvements/Aliments personnalisés du coach
- ✅ Si un coach quitte l'application (ou est supprimé), **ses bibliothèques personnelles disparaissent**
- ✅ **Ses clients n'ont plus accès** à ces mouvements/aliments personnalisés
- ✅ Les clients doivent recevoir un **message ou notification explicative**

### Q26. Partage entre coachs
- ❌ **Pas de partage** entre coachs pour le moment
- 💡 **À terme :** Un système d'équipe pourrait être mis en place, mais **ce n'est pas la priorité actuelle**
- ❌ **Pas de notion** de "bibliothèque publique" vs "bibliothèque privée" pour l'instant

---

## 💡 NOTE IMPORTANTE

**De nombreuses fonctionnalités ont été pensées dans le code existant.**  
Il faut profiter de ce qui a été créé et s'appuyer sur l'existant pour concevoir la structure de base de données.

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Analyser le code existant pour comprendre ce qui est déjà implémenté
2. ✅ Concevoir la structure de base de données optimale en s'appuyant sur l'existant
3. ✅ Proposer un schéma de base de données complet avec toutes les tables et relations
4. ✅ Valider avec vous avant implémentation
