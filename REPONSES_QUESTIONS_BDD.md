# Réponses aux Questions de Clarification - Base de Données Virtus

## A. STRUCTURE DES MOUVEMENTS

**Q1.** Les 3 bases de mouvements (Musculation, Mobilité, Échauffement) :
- **Réponse :** Ne sait pas ce qui est le mieux, sachant qu'il pourrait potentiellement mettre de la mobilité avec de la musculation, etc.
- **Recommandation à faire :** 1 seule table avec un champ "type" pour plus de flexibilité

**Q2.** Mouvements personnalisés du coach :
- ✅ Le coach doit choisir le type
- ✅ Modifiable après création
- ✅ Peut être supprimé

**Q3.** Alternatives de mouvements :
- ✅ Deux alternatives max
- ✅ Peut renvoyer vers un autre lien (mouvement)

---

## B. SÉANCES D'ENTRAÎNEMENT

**Q4.** Structure d'une séance :
- ✅ Nom et description pour différencier les séances du même type
- ✅ Ordre précis des exercices, MAIS le client peut intervertir l'ordre (et même les séances du programme sur une semaine)
- ✅ Notes générales sur la séance

**Q5.** Tempo (code 4 chiffres) :
- ✅ Format : 3010 = 3s descente, 0s pause, 1s montée, 0s pause
- ✅ Champ structuré

**Q6.** Intensification :
- ✅ Liste de techniques (protocoles) : superset, drop set, etc.
- ✅ Le coach peut ajouter ses propres techniques d'intensification
- ✅ Système de personnalisation nécessaire (certaines techniques ajoutent une sous-série)
- **Note :** Pourrait devenir une base de données à part entière

**Q7.** Réutilisation de séances :
- ✅ Une séance = template qui peut être réutilisé / dupliqué / modifié
- ✅ Même principe pour les programmes

---

## C. PROGRAMMES D'ENTRAÎNEMENT

**Q8.** Structure d'un programme :
- ✅ Limite max : 52 semaines (pour éviter d'avoir une limite, personne ne fera jamais 52 semaines)
- ✅ Séances par semaine : minimum 2, jusqu'à 12
- ✅ Le modèle hebdomadaire peut être mis de côté (le client enchaîne les séances comme elles viennent, que ça prenne 10 ou 15 jours)
- ✅ Par défaut : suite de séances (Séance 1, 2, 3...)
- ✅ Au choix du coach : peut assigner à des jours spécifiques

**Q9.** Évolution des paramètres :
- ✅ Peut être semaine par semaine
- ✅ Ou une fois toutes les 4 semaines
- ✅ Cycles possibles

**Q10.** Assignation aux clients :
- ✅ Peut être assigné à plusieurs clients en même temps
- ⚠️ Les clients ne doivent pas savoir qu'ils ont le même programme
- ✅ Fonction "Modifier avant assignation" nécessaire
- ✅ Historique disponible dans le profil client :
  - Historique des programmes
  - Historique des performances

---

## D. SUIVI DES PERFORMANCES

**Q11.** Enregistrement des performances :
- ✅ Exercice par exercice
- ✅ Si le client change l'ordre des exercices ou séances, cela doit être enregistré
- ✅ Toutes les infos demandées en fin de séance

**Q12.** Données enregistrées :
- ✅ Chaque donnée est unique par série (reps, charge, etc.)
- ✅ Exemple : Série 1 = 10 reps à 50kg, Série 2 = 8 reps à 50kg

---

## E. NUTRITION - ALIMENTS ET RECETTES

**Q13-Q17** : En attente de réponse

---

## F. PLANS ALIMENTAIRES

**Q18-Q20** : En attente de réponse

---

## G. SUIVI NUTRITIONNEL

**Q21-Q22** : En attente de réponse

---

## H. GESTION MULTI-CLIENTS

**Q23-Q24** : En attente de réponse

---

## I. PERMISSIONS ET VISIBILITÉ

**Q25-Q26** : En attente de réponse
