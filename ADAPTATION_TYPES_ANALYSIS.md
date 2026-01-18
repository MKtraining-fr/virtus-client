# Analyse des Types d'Adaptation des Techniques d'Intensité

## Date
18 janvier 2026

## Vue d'ensemble

Dans votre application, les techniques d'intensité sont classées selon **3 types d'adaptation** qui déterminent comment elles affectent l'interface client :

### 1. `informative` - Affichage informatif uniquement
**Description** : La technique ne nécessite **aucun champ de saisie supplémentaire**. Elle sert uniquement d'indication visuelle pour le client.

**Exemples typiques** :
- **Tempo contrôlé** : Affiche "4-1-1-0" pour indiquer le rythme d'exécution
- **Échec musculaire** : Badge indiquant "Aller jusqu'à l'échec"
- **Amplitude partielle** : Indication "Amplitude partielle haute/basse"
- **Pré-fatigue** : Badge "Exercice de pré-fatigue"

**Modification interface client** : ❌ **NON REQUISE**
- Juste un badge ou une indication visuelle
- Pas de nouveaux champs de saisie
- Les champs standards (reps, load) suffisent

---

### 2. `extra_fields` - Champs supplémentaires
**Description** : La technique nécessite des **champs de saisie supplémentaires** dans l'interface client, mais **pas de sous-séries**.

**Exemples typiques** :
- **Partial reps** : Champ pour le nombre de reps partielles après les reps complètes
- **Forced reps** : Champ pour le nombre de reps forcées avec aide
- **Negative reps** : Champ pour le nombre de reps négatives

**Modification interface client** : ⚠️ **MODIFICATION REQUISE**
- Ajouter des champs de saisie supplémentaires
- Conserver la structure de série unique
- Pas de système expand/collapse nécessaire

---

### 3. `sub_series` - Sous-séries
**Description** : La technique ajoute des **sous-séries** (paliers, mini-séries, clusters) qui nécessitent leurs propres champs de saisie.

**Exemples typiques** :
- **Drop Set** ✅ : Paliers avec réduction de charge
- **Rest-Pause** ⚠️ : Mini-séries après micro-pauses
- **Myo-Reps** ❌ : Série d'activation + mini-séries
- **Cluster Set** ❌ : Clusters avec repos intra-série

**Modification interface client** : ✅ **MODIFICATION MAJEURE REQUISE**
- Ajouter des champs pour chaque sous-série
- Système expand/collapse recommandé
- Badge visuel distinctif
- Gestion complexe de la saisie

---

## Techniques nécessitant des modifications de l'interface client

### Type `sub_series` (Priorité haute)

#### 1. ✅ Drop Set - **IMPLÉMENTÉ**
- Badge "⚡ DROP SET"
- Série principale + paliers
- Expand/collapse fonctionnel
- **Statut** : ✅ Complet

#### 2. ⚠️ Rest-Pause - **PARTIELLEMENT IMPLÉMENTÉ**
- Structure de base existe
- **Manque** : Champs pour mini-séries, expand/collapse, badge
- **Action requise** : Compléter l'implémentation

#### 3. ❌ Myo-Reps - **NON IMPLÉMENTÉ**
- Série d'activation + mini-séries
- **Action requise** : Créer de zéro

#### 4. ❌ Cluster Set - **NON IMPLÉMENTÉ**
- Clusters avec repos intra-série
- **Action requise** : Créer de zéro

---

### Type `extra_fields` (Priorité moyenne)

Ces techniques nécessitent des champs supplémentaires mais pas de sous-séries. Plus simples à implémenter que les `sub_series`.

**Exemples possibles dans votre application** :
- Partial reps (reps partielles)
- Forced reps (reps forcées)
- Negative reps (reps négatives)
- 21s (7-7-7)

**Vérification nécessaire** : Il faut vérifier dans la base de données quelles techniques avec `adaptation_type = 'extra_fields'` existent dans votre application.

---

### Type `informative` (Aucune modification requise)

Ces techniques n'ont **aucun impact** sur l'interface client en termes de champs de saisie. Elles servent uniquement d'indication visuelle.

**Exemples** :
- Tempo contrôlé (déjà géré)
- Échec musculaire
- Amplitude partielle
- Pré-fatigue
- Superset (indication visuelle entre exercices)

**Action requise** : ❌ **AUCUNE** (sauf éventuellement améliorer l'affichage visuel)

---

## Résumé des actions requises

### Priorité 1 : Compléter les techniques `sub_series`

1. **Rest-Pause** ⚠️ (1-2h)
   - Ajouter champs pour mini-séries
   - Ajouter expand/collapse
   - Ajouter badge visuel
   - Harmoniser avec Drop Set

2. **Myo-Reps** ❌ (2-3h)
   - Créer composant complet
   - Série d'activation + mini-séries
   - Badge visuel + expand/collapse

3. **Cluster Set** ❌ (2-3h)
   - Créer composant complet
   - Clusters avec repos
   - Badge visuel + expand/collapse

### Priorité 2 : Vérifier les techniques `extra_fields`

**Action** : Lister toutes les techniques avec `adaptation_type = 'extra_fields'` dans la base de données et vérifier si elles sont implémentées dans l'interface client.

**Méthode** : Requête SQL ou vérification dans l'interface coach.

### Priorité 3 : Améliorer les techniques `informative` (optionnel)

**Action** : Améliorer l'affichage visuel des badges/indicateurs pour les techniques informatives.

---

## Prochaines étapes recommandées

1. **Vérifier la base de données** : Lister toutes les techniques existantes avec leur `adaptation_type`
2. **Compléter Rest-Pause** : Priorité immédiate car déjà commencé
3. **Implémenter Myo-Reps et Cluster Set** : Techniques `sub_series` manquantes
4. **Vérifier les techniques `extra_fields`** : S'assurer qu'elles sont toutes implémentées

---

## Question pour l'utilisateur

**Avez-vous des techniques avec `adaptation_type = 'extra_fields'` dans votre base de données ?**

Si oui, lesquelles ? Cela nous permettra de savoir si des modifications supplémentaires sont nécessaires au-delà des techniques `sub_series`.
