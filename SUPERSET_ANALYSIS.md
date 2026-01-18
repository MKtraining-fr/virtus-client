# Analyse de la technique Superset

## Date
18 janvier 2026

## Qu'est-ce qu'un Superset ?

Un **Superset** est une technique d'entraînement qui consiste à enchaîner **deux exercices différents** sans temps de repos entre eux.

**Exemple** :
- Exercice A : Développé couché (4 séries de 10 reps)
- Exercice B : Rowing barre (4 séries de 10 reps)
- **Superset** : Faire 1 série de A, immédiatement suivie de 1 série de B, puis repos, et répéter

---

## Classification du Superset

### ❌ Ce n'est PAS un `extra_fields`

Le Superset **ne rentre PAS** dans la catégorie `extra_fields` car :

1. **Il ne modifie pas les champs d'un exercice individuel**
   - Chaque exercice conserve ses propres champs standards (reps, load)
   - Pas de champs supplémentaires à ajouter dans la saisie de performance

2. **Il concerne la relation ENTRE exercices**
   - Le Superset est une **liaison** entre deux exercices
   - Ce n'est pas une modification de la structure interne d'un exercice

3. **Pas de données supplémentaires à enregistrer par exercice**
   - Les performances sont enregistrées normalement pour chaque exercice
   - Aucune donnée spécifique au Superset à saisir

---

## Classification correcte : `informative`

Le Superset devrait être classé comme **`informative`** car :

### 1. Affichage visuel uniquement
- Badge ou indicateur entre les deux exercices
- Exemple : "🔗 SUPERSET avec [Exercice B]"
- Indication du temps de repos (0s entre A et B, repos normal après B)

### 2. Aucun champ de saisie supplémentaire
- L'interface client reste identique pour chaque exercice
- Le client saisit ses performances normalement (reps + load)
- Pas de modification de la structure de saisie

### 3. Impact sur l'expérience utilisateur
- **Indication visuelle** : Le client sait qu'il doit enchaîner les deux exercices
- **Timer** : Éventuellement, un timer automatique qui démarre après l'exercice A pour enchaîner avec B
- **Navigation** : Après avoir validé l'exercice A, l'interface passe automatiquement à l'exercice B

---

## Implémentation recommandée

### Dans l'interface client

#### Affichage
```
┌─────────────────────────────────────┐
│ Exercice 1 : Développé couché       │
│ 4 séries × 10 reps × 80kg          │
│                                     │
│ [Champs de saisie standards]        │
│                                     │
│ 🔗 SUPERSET avec Rowing barre       │
│    ⏱️ Enchaîner sans repos          │
└─────────────────────────────────────┘
        ↓ (enchaînement automatique)
┌─────────────────────────────────────┐
│ Exercice 2 : Rowing barre           │
│ 4 séries × 10 reps × 70kg          │
│                                     │
│ [Champs de saisie standards]        │
│                                     │
│ ⏱️ Repos : 90s après cette série    │
└─────────────────────────────────────┘
```

#### Comportement
1. **Après validation de l'exercice A** :
   - Passer automatiquement à l'exercice B
   - Afficher un message : "Enchaînez immédiatement avec [Exercice B]"
   - Pas de timer de repos entre A et B

2. **Après validation de l'exercice B** :
   - Lancer le timer de repos normal (ex: 90s)
   - Retourner à l'exercice A pour la série suivante

3. **Badge visuel** :
   - Afficher un badge "🔗 SUPERSET" sur les deux exercices
   - Indiquer clairement quel exercice est lié

---

## Structure de données

### Dans la base de données

Le Superset ne devrait **pas** être stocké comme une technique d'intensité appliquée à un exercice individuel, mais plutôt comme une **relation entre exercices**.

#### Option 1 : Champ dans la table `exercises`
```sql
ALTER TABLE exercises ADD COLUMN superset_with INTEGER REFERENCES exercises(id);
```

**Exemple** :
- Exercice A (id=1) : `superset_with = 2` (lié à l'exercice B)
- Exercice B (id=2) : `superset_with = 1` (lié à l'exercice A)

#### Option 2 : Table de liaison dédiée
```sql
CREATE TABLE exercise_supersets (
  id SERIAL PRIMARY KEY,
  exercise_a_id INTEGER REFERENCES exercises(id),
  exercise_b_id INTEGER REFERENCES exercises(id),
  rest_after_b INTEGER DEFAULT 90, -- Repos après le superset (en secondes)
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Différence avec les autres techniques

### `extra_fields` (ex: Partial reps)
- **Modifie la structure de saisie** d'un exercice individuel
- **Ajoute des champs** : "Reps partielles après échec"
- **Données supplémentaires** à enregistrer pour chaque série

### `sub_series` (ex: Drop Set)
- **Ajoute des sous-séries** avec leurs propres champs
- **Structure complexe** : Série principale + paliers
- **Expand/collapse** nécessaire

### `informative` (ex: Superset)
- **Affichage visuel uniquement**
- **Aucun champ supplémentaire**
- **Relation entre exercices**, pas modification d'un exercice

---

## Autres techniques similaires au Superset

Ces techniques concernent également des **relations entre exercices** et devraient être classées comme `informative` :

1. **Triset** : Enchaînement de 3 exercices sans repos
2. **Circuit** : Enchaînement de 4+ exercices sans repos
3. **Superset antagoniste** : Superset sur des muscles opposés (ex: biceps + triceps)
4. **Superset agoniste** : Superset sur le même muscle (ex: développé couché + pompes)
5. **Pré-fatigue** : Exercice d'isolation avant exercice composé (ex: écartés avant développé couché)

---

## Conclusion

Le **Superset** ne rentre **pas** dans la catégorie `extra_fields` car il ne modifie pas la structure de saisie d'un exercice individuel.

**Classification correcte** : `informative`

**Modifications requises dans l'interface client** :
- ✅ Badge visuel "🔗 SUPERSET"
- ✅ Indication de l'exercice lié
- ✅ Navigation automatique entre exercices
- ✅ Gestion du timer de repos (0s entre A et B, repos normal après B)
- ❌ **Aucun champ de saisie supplémentaire**

**Modifications requises dans la base de données** :
- Ajouter une relation entre exercices (champ `superset_with` ou table de liaison)
- Stocker le temps de repos après le superset

---

## Recommandation

Si vous avez classé le Superset comme `extra_fields` dans votre base de données, je recommande de le **reclasser** en `informative` pour refléter correctement son comportement.

Voulez-vous que je vérifie l'implémentation actuelle du Superset dans votre application ?
