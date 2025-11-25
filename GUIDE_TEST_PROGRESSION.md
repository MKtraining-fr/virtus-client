# 🧪 Guide de test : Code couleur de progression

## 🎯 Objectif

Valider que le système de **code couleur de progression** fonctionne correctement avec la **priorité coach > semaine précédente**.

---

## 📋 Logique implémentée

### 1. Priorité des placeholders

**Priorité 1 : Valeurs du coach** (si configurées pour la semaine actuelle)
- Si le coach a configuré S1=35kg pour la semaine 2 → placeholder="35"

**Priorité 2 : Valeurs de la semaine précédente** (si pas de valeur coach)
- Si le client a fait S1=30kg en semaine 1 → placeholder="30"

**Priorité 3 : Valeur par défaut**
- Si aucune donnée → placeholder="0"

### 2. Code couleur de progression

Quand le client **saisit une valeur** :
- 🟢 **Vert** : Valeur > semaine précédente (progression)
- 🔴 **Rouge** : Valeur < semaine précédente (régression)
- ⚫ **Noir** : Valeur = semaine précédente (maintien)

**IMPORTANT** : Le code couleur compare avec la **semaine précédente**, PAS avec les valeurs du coach !

---

## ✅ Pré-requis

1. ✅ PR #209 mergée (support des détails par série)
2. ✅ Code déployé (branche `feat/progression-color-coding`)
3. ✅ Accès coach et accès client
4. ✅ Programme avec au moins 2 semaines

---

## 🧪 Test 1 : Priorité coach > semaine précédente

### Objectif
Vérifier que les valeurs du coach sont **prioritaires** sur les valeurs de la semaine précédente.

### Étapes

**Semaine 1** (coach configure S1=30kg) :
1. Coach crée un programme avec S1: 12 reps, 30 kg
2. Assigne au client
3. Client se connecte et fait la séance
4. Client saisit : S1 = 12 reps, 32 kg (progression !)
5. Client termine la séance

**Semaine 2** (coach configure S1=40kg pour la semaine 2) :
1. Coach modifie le programme pour la semaine 2
2. Coach configure S1: 12 reps, **40 kg** (nouvelle cible)
3. Client se connecte et va sur "Programme en cours"

### Résultat attendu

**Affichage semaine 2** :
```
S1: [Répétition: placeholder="12"] [Charge: placeholder="40"]
```

**Validation** :
- ✅ Le placeholder est "40" (valeur du coach), PAS "32" (semaine précédente)
- ✅ Le coach est prioritaire ✅

**Client saisit 42 kg** :
```
S1: [Répétition: 12] [Charge: 42 en VERT] ← Progression par rapport à la semaine 1 (32 kg)
```

**Validation** :
- ✅ La couleur verte compare avec la semaine 1 (32 kg), pas avec le coach (40 kg)
- ✅ 42 > 32 → VERT ✅

---

## 🧪 Test 2 : Semaine précédente sans valeur coach

### Objectif
Vérifier que les valeurs de la semaine précédente s'affichent quand le coach n'a pas configuré de valeur spécifique.

### Étapes

**Semaine 1** (client fait la séance) :
1. Coach crée un programme SANS configurer de charges spécifiques (ou avec "0")
2. Assigne au client
3. Client se connecte et fait la séance
4. Client saisit : S1 = 12 reps, 30 kg
5. Client termine la séance

**Semaine 2** (pas de valeur coach) :
1. Client se connecte et va sur "Programme en cours"

### Résultat attendu

**Affichage semaine 2** :
```
S1: [Répétition: placeholder="12"] [Charge: placeholder="30"]
```

**Validation** :
- ✅ Le placeholder est "30" (valeur de la semaine 1)
- ✅ Pas de valeur coach → utilise la semaine précédente ✅

**Client saisit 32 kg** :
```
S1: [Répétition: 12] [Charge: 32 en VERT] ← Progression !
```

**Validation** :
- ✅ 32 > 30 → VERT ✅

---

## 🧪 Test 3 : Code couleur de progression

### Objectif
Vérifier que les 3 couleurs (vert, rouge, noir) fonctionnent correctement.

### Étapes

**Semaine 1** (client fait la séance) :
1. Client saisit : S1 = 12 reps, 30 kg
2. Client termine la séance

**Semaine 2** (test des 3 couleurs) :
1. Client se connecte et va sur "Programme en cours"

### Résultat attendu

**Scénario A : Progression (VERT)** 🟢
```
Client saisit: S1 = 12 reps, 35 kg
Affichage: [Charge: 35 en VERT]
Validation: 35 > 30 → VERT ✅
```

**Scénario B : Régression (ROUGE)** 🔴
```
Client saisit: S1 = 12 reps, 25 kg
Affichage: [Charge: 25 en ROUGE]
Validation: 25 < 30 → ROUGE ✅
```

**Scénario C : Maintien (NOIR)** ⚫
```
Client saisit: S1 = 12 reps, 30 kg
Affichage: [Charge: 30 en NOIR]
Validation: 30 = 30 → NOIR ✅
```

---

## 🧪 Test 4 : Valeurs différentes par série

### Objectif
Vérifier que le code couleur fonctionne **indépendamment pour chaque série**.

### Étapes

**Semaine 1** (client fait la séance) :
1. Client saisit :
   - S1 = 12 reps, 30 kg
   - S2 = 10 reps, 40 kg
   - S3 = 8 reps, 50 kg
2. Client termine la séance

**Semaine 2** (test des couleurs par série) :
1. Client se connecte et va sur "Programme en cours"
2. Client saisit :
   - S1 = 12 reps, **35 kg** (progression)
   - S2 = 10 reps, **38 kg** (régression)
   - S3 = 8 reps, **50 kg** (maintien)

### Résultat attendu

**Affichage** :
```
S1: [Charge: 35 en VERT] ← 35 > 30 🟢
S2: [Charge: 38 en ROUGE] ← 38 < 40 🔴
S3: [Charge: 50 en NOIR] ← 50 = 50 ⚫
```

**Validation** :
- ✅ Chaque série a sa propre couleur
- ✅ Les couleurs sont indépendantes
- ✅ La comparaison est correcte

---

## 🧪 Test 5 : Priorité coach avec code couleur

### Objectif
Vérifier que le code couleur compare avec la **semaine précédente**, même si le coach a configuré une nouvelle valeur.

### Étapes

**Semaine 1** (coach configure S1=30kg) :
1. Coach crée un programme avec S1: 12 reps, 30 kg
2. Client fait la séance et saisit : S1 = 12 reps, 32 kg
3. Client termine la séance

**Semaine 2** (coach configure S1=50kg pour la semaine 2) :
1. Coach modifie le programme pour la semaine 2
2. Coach configure S1: 12 reps, **50 kg** (nouvelle cible)
3. Client se connecte et va sur "Programme en cours"

### Résultat attendu

**Affichage semaine 2** :
```
S1: [Charge: placeholder="50"] ← Valeur du coach (priorité 1)
```

**Client saisit 48 kg** :
```
S1: [Charge: 48 en VERT] ← Progression par rapport à la semaine 1 (32 kg)
```

**Validation** :
- ✅ Placeholder = 50 (valeur du coach) ✅
- ✅ Couleur = VERT car 48 > 32 (semaine 1) ✅
- ✅ La couleur compare avec la semaine 1, PAS avec le coach ✅

---

## 🧪 Test 6 : Première semaine (pas de données précédentes)

### Objectif
Vérifier que le code couleur ne s'applique pas en semaine 1 (pas de données précédentes).

### Étapes

**Semaine 1** (première séance) :
1. Client se connecte et va sur "Programme en cours"
2. Client saisit : S1 = 12 reps, 30 kg

### Résultat attendu

**Affichage** :
```
S1: [Charge: 30 en NOIR] ← Couleur par défaut (pas de comparaison)
```

**Validation** :
- ✅ Pas de couleur verte ou rouge (pas de données précédentes)
- ✅ Couleur noire par défaut ✅

---

## 🧪 Test 7 : Répétitions avec code couleur

### Objectif
Vérifier que le code couleur fonctionne aussi pour les **répétitions**, pas seulement les charges.

### Étapes

**Semaine 1** :
1. Client saisit : S1 = 10 reps, 30 kg
2. Client termine la séance

**Semaine 2** :
1. Client saisit : S1 = **12 reps**, 30 kg

### Résultat attendu

**Affichage** :
```
S1: [Répétition: 12 en VERT] [Charge: 30 en NOIR]
```

**Validation** :
- ✅ Répétitions : 12 > 10 → VERT ✅
- ✅ Charge : 30 = 30 → NOIR ✅
- ✅ Les deux champs ont leur propre couleur ✅

---

## 🧪 Test 8 : Champ vide (pas de saisie)

### Objectif
Vérifier que les champs vides n'ont pas de couleur de progression.

### Étapes

**Semaine 2** :
1. Client laisse le champ vide (ne saisit rien)

### Résultat attendu

**Affichage** :
```
S1: [Charge: placeholder="30" grisé] ← Pas de couleur
```

**Validation** :
- ✅ Le placeholder est grisé
- ✅ Pas de couleur verte ou rouge (champ vide)
- ✅ Couleur par défaut (noir/gris) ✅

---

## 🧪 Test 9 : Série sélectionnée (fond violet)

### Objectif
Vérifier que le code couleur fonctionne aussi quand la série est sélectionnée (fond violet).

### Étapes

**Semaine 2** :
1. Client clique sur la Série 1 (fond devient violet)
2. Client saisit : S1 = 35 kg (progression)

### Résultat attendu

**Affichage** :
```
S1: [Charge: 35 en BLANC] ← Texte blanc sur fond violet
```

**Validation** :
- ✅ Quand la série est sélectionnée, le texte est BLANC (pas de code couleur)
- ✅ Quand on désélectionne, la couleur VERTE apparaît ✅

---

## 📊 Tableau récapitulatif des scénarios

| Scénario | Semaine 1 | Semaine 2 (Coach) | Semaine 2 (Client saisit) | Placeholder | Couleur |
|----------|-----------|-------------------|---------------------------|-------------|---------|
| 1. Priorité coach | 32 kg | 50 kg | 48 kg | 50 | VERT (48>32) |
| 2. Pas de coach | 30 kg | - | 32 kg | 30 | VERT (32>30) |
| 3. Progression | 30 kg | - | 35 kg | 30 | VERT (35>30) |
| 4. Régression | 30 kg | - | 25 kg | 30 | ROUGE (25<30) |
| 5. Maintien | 30 kg | - | 30 kg | 30 | NOIR (30=30) |
| 6. Première semaine | - | - | 30 kg | 0 | NOIR (défaut) |
| 7. Champ vide | 30 kg | - | (vide) | 30 | Pas de couleur |

---

## 🎨 Couleurs attendues

### Mode clair
- 🟢 **Progression** : `text-green-600` (#059669)
- 🔴 **Régression** : `text-red-600` (#DC2626)
- ⚫ **Maintien** : `text-gray-900` (#111827)

### Mode sombre
- 🟢 **Progression** : `text-green-400` (#34D399)
- 🔴 **Régression** : `text-red-400` (#F87171)
- ⚫ **Maintien** : `text-client-light` (couleur du thème)

---

## 🔍 Points d'attention

### 1. Comparaison avec la semaine précédente
- ✅ Le code compare avec `log.week === previousWeek`
- ✅ Pas avec la dernière séance (qui pourrait être d'une autre semaine)

### 2. Priorité du coach
- ✅ Si `targetLoad !== '0'` → utilise la valeur du coach
- ✅ Sinon → utilise la valeur de la semaine précédente

### 3. Série sélectionnée
- ✅ Quand `isSetSelected === true` → texte blanc (pas de code couleur)
- ✅ Quand `isSetSelected === false` → code couleur appliqué

### 4. Champs vides
- ✅ Si `repValue === ''` → pas de code couleur
- ✅ Si `loadValue === ''` → pas de code couleur

---

## 🐛 Cas limites à tester

### 1. Valeurs non numériques
- Saisir "abc" → Couleur par défaut (pas de crash)

### 2. Valeurs décimales
- Semaine 1 : 30.5 kg
- Semaine 2 : 31.0 kg
- **Attendu** : VERT (31.0 > 30.5) ✅

### 3. Valeurs négatives
- Semaine 1 : -10 kg (erreur de saisie ?)
- Semaine 2 : 30 kg
- **Attendu** : VERT (30 > -10) ✅

### 4. Zéro
- Semaine 1 : 0 kg
- Semaine 2 : 30 kg
- **Attendu** : VERT (30 > 0) ✅

---

## 📊 Checklist de validation

### Fonctionnel
- [ ] Priorité coach > semaine précédente
- [ ] Code couleur vert pour progression
- [ ] Code couleur rouge pour régression
- [ ] Code couleur noir pour maintien
- [ ] Pas de couleur pour champs vides
- [ ] Fonctionne pour reps ET load

### Technique
- [ ] Pas de crash avec semaine 1 (pas de données précédentes)
- [ ] Pas de crash avec valeurs non numériques
- [ ] Pas de crash avec `details` vide ou NULL
- [ ] Les couleurs sont visibles en mode clair ET sombre

### UX
- [ ] Les couleurs sont bien visibles (pas trop pâles)
- [ ] Le vert et le rouge sont bien différenciés
- [ ] Les placeholders restent grisés
- [ ] Le comportement est intuitif

---

## 🚀 Après validation

1. ✅ Merger la PR
2. ✅ Déployer en production
3. ✅ Communiquer la nouvelle fonctionnalité aux clients
4. ✅ Recueillir les retours utilisateurs

---

**Durée estimée des tests** : 20-25 minutes  
**Criticité** : Haute (fonctionnalité de motivation)  
**Rollback** : Facile (pas de breaking change)
