# 🧪 Guide de test : Détails par série

## 🎯 Objectif

Valider que les valeurs configurées par le coach apparaissent en **placeholder grisé** sur l'interface client, avec des valeurs **différentes par série** si configurées.

---

## ✅ Pré-requis

1. ✅ Migrations appliquées sur Supabase
2. ✅ Code déployé (branche `feat/add-exercise-details-column`)
3. ✅ Accès coach et accès client

---

## 🧪 Test 1 : Programme avec valeurs uniformes

### Objectif
Vérifier que les programmes avec des valeurs identiques pour toutes les séries fonctionnent correctement.

### Étapes

**Côté Coach** :
1. Se connecter en tant que coach
2. Aller dans "Créateur de séance"
3. Créer un nouveau programme "Test Uniforme"
4. Ajouter un exercice (ex: Développé couché)
5. Configurer :
   - Séries : 3
   - Reps : 12 (pour toutes les séries)
   - Charge : 80 kg (pour toutes les séries)
   - Tempo : 2010
   - Repos : 60s
6. Sauvegarder le programme
7. Assigner le programme à un client

**Côté Client** :
1. Se connecter en tant que client
2. Aller sur "Programme en cours"
3. Sélectionner l'exercice "Développé couché"

### Résultat attendu

**Affichage** :
```
Séries: 3   Rép: 12   Repos: 60   Tempo: 2010

Série 1: [Répétition: placeholder="12"] [Charge: placeholder="80"]
Série 2: [Répétition: placeholder="12"] [Charge: placeholder="80"]
Série 3: [Répétition: placeholder="12"] [Charge: placeholder="80"]
```

**Validation** :
- ✅ Les 3 séries ont le même placeholder
- ✅ Les placeholders sont grisés
- ✅ Pas de crash

---

## 🧪 Test 2 : Programme avec valeurs différentes par série

### Objectif
Vérifier que les programmes avec des valeurs différentes par série affichent les bons placeholders.

### Étapes

**Côté Coach** :
1. Se connecter en tant que coach
2. Aller dans "Créateur de séance"
3. Créer un nouveau programme "Test Pyramide"
4. Ajouter un exercice (ex: Squat)
5. Configurer **chaque série individuellement** :
   - **Série 1** : 12 reps, 30 kg, tempo 2010, repos 60s
   - **Série 2** : 10 reps, 40 kg, tempo 2010, repos 90s
   - **Série 3** : 8 reps, 50 kg, tempo 2010, repos 120s
6. Sauvegarder le programme
7. Assigner le programme à un client

**Côté Client** :
1. Se connecter en tant que client
2. Aller sur "Programme en cours"
3. Sélectionner l'exercice "Squat"

### Résultat attendu

**Affichage** :
```
Séries: 3   Rép: N/A   Repos: N/A   Tempo: N/A
(Ces valeurs sont N/A car elles varient par série)

Série 1: [Répétition: placeholder="12"] [Charge: placeholder="30"]
Série 2: [Répétition: placeholder="10"] [Charge: placeholder="40"]
Série 3: [Répétition: placeholder="8"] [Charge: placeholder="50"]
```

**Validation** :
- ✅ Chaque série a un placeholder différent
- ✅ S1 = 30, S2 = 40, S3 = 50
- ✅ Les placeholders sont grisés
- ✅ Pas de crash

---

## 🧪 Test 3 : Écrasabilité des placeholders

### Objectif
Vérifier que le client peut écraser les valeurs suggérées par le coach.

### Étapes

**Côté Client** :
1. Dans l'exercice "Squat" (du Test 2)
2. Cliquer sur le champ "Charge" de la Série 1
3. Saisir "35" (au lieu de 30)
4. Passer à la Série 2
5. Saisir "45" (au lieu de 40)
6. Effacer la valeur de la Série 2

### Résultat attendu

**Après saisie** :
```
Série 1: [Répétition: placeholder="12"] [Charge: value="35"]
Série 2: [Répétition: placeholder="10"] [Charge: placeholder="40"]
Série 3: [Répétition: placeholder="8"] [Charge: placeholder="50"]
```

**Validation** :
- ✅ La valeur saisie (35) remplace le placeholder (30)
- ✅ Le placeholder réapparaît si on efface la saisie
- ✅ Les autres séries gardent leurs placeholders
- ✅ Pas de crash

---

## 🧪 Test 4 : Compatibilité avec programmes existants

### Objectif
Vérifier que les programmes créés **avant la migration** continuent de fonctionner.

### Étapes

**Côté Client** :
1. Se connecter en tant que client
2. Aller sur "Programme en cours"
3. Consulter un programme créé **avant** la migration (si disponible)
4. Sélectionner un exercice

### Résultat attendu

**Affichage** :
```
Séries: 3   Rép: 12   Repos: 60   Tempo: 2010

Série 1: [Répétition: placeholder="12"] [Charge: placeholder="80"]
Série 2: [Répétition: placeholder="12"] [Charge: placeholder="80"]
Série 3: [Répétition: placeholder="12"] [Charge: placeholder="80"]
```

**Validation** :
- ✅ Les valeurs s'affichent correctement (fallback sur ancien format)
- ✅ Toutes les séries ont les mêmes placeholders
- ✅ Pas de crash
- ✅ Pas de régression

---

## 🧪 Test 5 : Timer avec temps de repos différents

### Objectif
Vérifier que le timer utilise le bon temps de repos pour chaque série.

### Étapes

**Côté Client** :
1. Dans l'exercice "Squat" (du Test 2)
2. Compléter la Série 1
3. Cliquer sur le timer

### Résultat attendu

**Affichage du timer** :
```
Objectif: 60s  (pour la Série 1)
```

**Après avoir complété la Série 1 et passé à la Série 2** :
```
Objectif: 90s  (pour la Série 2)
```

**Validation** :
- ✅ Le timer affiche le bon temps de repos par série
- ✅ S1 = 60s, S2 = 90s, S3 = 120s
- ✅ Pas de crash

---

## 🧪 Test 6 : Unités différentes (kg, lbs, %)

### Objectif
Vérifier que les différentes unités de charge sont supportées.

### Étapes

**Côté Coach** :
1. Créer un exercice avec :
   - S1 : 80 kg
   - S2 : 175 lbs
   - S3 : 80%
2. Assigner au client

**Côté Client** :
1. Consulter l'exercice

### Résultat attendu

**Affichage** :
```
Série 1: [Charge: placeholder="80"] (unité: KG)
Série 2: [Charge: placeholder="175"] (unité: LBS)
Série 3: [Charge: placeholder="80"] (unité: %)
```

**Validation** :
- ✅ Les 3 unités sont supportées
- ✅ Les placeholders affichent les bonnes valeurs
- ✅ Pas de crash

---

## 🐛 Problèmes connus à surveiller

### 1. Parsing de `details`
- ⚠️ Si `details` est mal formaté (JSON invalide), le code doit fallback sur tableau vide
- ✅ Protection : try/catch dans `clientProgramService.ts` (ligne 31)

### 2. Nombre de séries différent
- ⚠️ Si `details.length` ≠ `sets`, que se passe-t-il ?
- ✅ Protection : Le code utilise `details[setIndex]` avec fallback sur `details[0]`

### 3. Champs manquants dans `details`
- ⚠️ Si un objet dans `details` n'a pas `load` ou `reps`
- ✅ Protection : Optional chaining `?.` partout

---

## 📊 Checklist de validation

### Fonctionnel
- [ ] Les placeholders s'affichent correctement
- [ ] Les valeurs sont différentes par série si configurées
- [ ] Les champs restent écrasables
- [ ] Le timer utilise le bon temps de repos par série

### Technique
- [ ] Pas de crash avec programmes existants
- [ ] Pas de crash avec `details` vide ou NULL
- [ ] Pas de crash avec JSON invalide
- [ ] Les 3 unités (kg, lbs, %) sont supportées

### UX
- [ ] Les placeholders sont grisés (pas trop visibles)
- [ ] Les valeurs saisies sont en gras/noir (bien visibles)
- [ ] Le comportement est intuitif
- [ ] Pas de régression visuelle

---

## 🚀 Après validation

1. ✅ Merger la PR #209
2. ✅ Déployer en production
3. ✅ Communiquer la nouvelle fonctionnalité aux coachs
4. ✅ Créer un tutoriel pour les coachs (optionnel)

---

**Durée estimée des tests** : 15-20 minutes  
**Criticité** : Haute (fonctionnalité majeure)  
**Rollback** : Facile (colonne `details` nullable, pas de breaking change)
