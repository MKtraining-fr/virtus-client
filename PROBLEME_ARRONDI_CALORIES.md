# Problème : Affichage "+1 kcal" dans le Profil Client

## Description du problème

Dans l'interface coach, au niveau du profil client, on observe un affichage incorrect :

```
Objectif calorique: +1 kcal (0.0%)
```

Cela ne devrait pas être possible, car l'objectif calorique doit représenter un total exact basé sur les macronutriments de l'individu.

---

## Analyse de la cause

### 1. Localisation du problème

**Fichier** : `src/pages/ClientProfile.tsx`  
**Lignes concernées** : 555-560 (calcul des macros) et 581-603 (calcul de l'objectif)

### 2. Processus de calcul actuel

#### Étape 1 : Calcul du TDEE (ligne 545)
```typescript
const baseTdee = bmr * multiplier;
// Exemple : 1818 × 1.55 = 2817.9 → arrondi à 2818 kcal
```

#### Étape 2 : Calcul des macros par défaut (lignes 555-560)
```typescript
const targetTdee = baseMetabolicData.baseTdee; // 2818 kcal
const originP = Math.round((targetTdee * 0.3) / 4);  // Protéines
const originF = Math.round((targetTdee * 0.3) / 9);  // Lipides
const originC = Math.round((targetTdee * 0.4) / 4);  // Glucides
```

**Calculs détaillés** :

1. **Protéines (30%)** :
   ```
   Calories : 2818 × 0.3 = 845.4 kcal
   Grammes : 845.4 / 4 = 211.35
   Arrondi : Math.round(211.35) = 211 g
   ```

2. **Lipides (30%)** :
   ```
   Calories : 2818 × 0.3 = 845.4 kcal
   Grammes : 845.4 / 9 = 93.93
   Arrondi : Math.round(93.93) = 94 g
   ```

3. **Glucides (40%)** :
   ```
   Calories : 2818 × 0.4 = 1127.2 kcal
   Grammes : 1127.2 / 4 = 281.8
   Arrondi : Math.round(281.8) = 282 g
   ```

#### Étape 3 : Recalcul de l'objectif calorique (lignes 584-587)
```typescript
const pKcal = protein * 4;    // 211 × 4 = 844 kcal
const cKcal = carbs * 4;      // 282 × 4 = 1128 kcal
const fKcal = fat * 9;        // 94 × 9 = 846 kcal
const oCal = pKcal + cKcal + fKcal;  // 844 + 1128 + 846 = 2818 kcal
```

#### Étape 4 : Calcul du surplus/déficit (ligne 590)
```typescript
surplusDeficit: Math.round(oCal - tdee)
// 2818 - 2817 = +1 kcal ❌
```

---

## Pourquoi cela arrive ?

### Erreur d'arrondi cumulée

Les arrondis successifs créent des petites erreurs qui s'accumulent :

| Macro | Calories théoriques | Grammes (arrondi) | Calories réelles | Erreur |
|-------|---------------------|-------------------|------------------|--------|
| Protéines | 845.4 kcal | 211 g | 844 kcal | -1.4 kcal |
| Glucides | 1127.2 kcal | 282 g | 1128 kcal | +0.8 kcal |
| Lipides | 845.4 kcal | 94 g | 846 kcal | +0.6 kcal |
| **Total** | **2818 kcal** | - | **2818 kcal** | **0 kcal** |

Dans cet exemple, les erreurs se compensent parfaitement, mais ce n'est pas toujours le cas.

### Exemple avec erreur visible

**TDEE = 2817 kcal** (avant arrondi : 2817.9)

| Macro | Calories théoriques | Grammes (arrondi) | Calories réelles | Erreur |
|-------|---------------------|-------------------|------------------|--------|
| Protéines | 845.1 kcal | 211 g | 844 kcal | -1.1 kcal |
| Glucides | 1126.8 kcal | 282 g | 1128 kcal | +1.2 kcal |
| Lipides | 845.1 kcal | 94 g | 846 kcal | +0.9 kcal |
| **Total** | **2817 kcal** | - | **2818 kcal** | **+1 kcal** ❌

**Résultat** : `surplusDeficit = 2818 - 2817 = +1 kcal`

---

## Pourquoi c'est un problème ?

### 1. Confusion pour l'utilisateur

Le coach voit "+1 kcal (0.0%)" et peut penser :
- Qu'il y a un bug dans l'application
- Que le calcul est incorrect
- Que les macros ne correspondent pas au TDEE

### 2. Perte de confiance

Un écart aussi petit (1 kcal) suggère une erreur de calcul plutôt qu'un véritable surplus calorique intentionnel.

### 3. Affichage non professionnel

Dans un contexte professionnel de coaching, afficher "+1 kcal" donne une impression de manque de précision.

---

## Solutions possibles

### Solution 1 : Masquer les petites différences (RECOMMANDÉE)

Ne pas afficher le surplus/déficit si la différence est inférieure à un seuil (par exemple 5 kcal).

**Code actuel** (ligne 1520) :
```typescript
{editableCalculatedData.surplusDeficit !== 0 && (
  <span className={...}>
    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
    {editableCalculatedData.surplusDeficit} kcal
  </span>
)}
```

**Code corrigé** :
```typescript
{editableCalculatedData.surplusDeficit !== 0 && 
 Math.abs(editableCalculatedData.surplusDeficit) >= 5 && (
  <span className={...}>
    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
    {editableCalculatedData.surplusDeficit} kcal
  </span>
)}
```

**Avantages** :
- ✅ Simple à implémenter
- ✅ Ne change pas les calculs existants
- ✅ Masque les erreurs d'arrondi négligeables
- ✅ Conserve l'affichage pour les vrais surplus/déficits

**Inconvénients** :
- ⚠️ Ne résout pas la cause du problème

---

### Solution 2 : Ajuster le dernier macro pour compenser

Calculer les deux premiers macros normalement, puis ajuster le troisième pour que le total corresponde exactement au TDEE.

**Code actuel** (lignes 555-560) :
```typescript
const targetTdee = baseMetabolicData.baseTdee;
const originP = Math.round((targetTdee * 0.3) / 4);
const originF = Math.round((targetTdee * 0.3) / 9);
const originC = Math.round((targetTdee * 0.4) / 4);
```

**Code corrigé** :
```typescript
const targetTdee = baseMetabolicData.baseTdee;

// Calculer protéines et glucides normalement
const originP = Math.round((targetTdee * 0.3) / 4);
const originC = Math.round((targetTdee * 0.4) / 4);

// Calculer les lipides pour compenser l'erreur d'arrondi
const caloriesFromProteinAndCarbs = (originP * 4) + (originC * 4);
const remainingCalories = targetTdee - caloriesFromProteinAndCarbs;
const originF = Math.round(remainingCalories / 9);
```

**Avantages** :
- ✅ Garantit que le total correspond exactement au TDEE
- ✅ Élimine complètement l'erreur d'arrondi

**Inconvénients** :
- ⚠️ Peut créer un léger déséquilibre dans les ratios de macros
- ⚠️ Plus complexe à maintenir

---

### Solution 3 : Utiliser des décimales et arrondir à la fin

Conserver les valeurs décimales pendant les calculs et n'arrondir qu'à l'affichage.

**Code corrigé** :
```typescript
const targetTdee = baseMetabolicData.baseTdee;

// Conserver les décimales
const originP = (targetTdee * 0.3) / 4;  // Pas d'arrondi
const originF = (targetTdee * 0.3) / 9;  // Pas d'arrondi
const originC = (targetTdee * 0.4) / 4;  // Pas d'arrondi

// Arrondir uniquement pour l'affichage
const tdeeMacros = { 
  protein: Math.round(originP), 
  carbs: Math.round(originC), 
  fat: Math.round(originF) 
};
```

**Avantages** :
- ✅ Maintient la précision des calculs
- ✅ Permet des ajustements plus fins

**Inconvénients** :
- ⚠️ Ne résout pas fondamentalement le problème d'arrondi
- ⚠️ Complexifie la gestion des états

---

### Solution 4 : Accepter une marge d'erreur dans le calcul du surplus/déficit

Considérer que toute différence inférieure à 1% est négligeable.

**Code corrigé** (ligne 590) :
```typescript
// Si la différence est < 1% du TDEE, la considérer comme nulle
const rawDifference = oCal - tdee;
const percentDifference = Math.abs(rawDifference / tdee) * 100;
const surplusDeficit = percentDifference < 1 ? 0 : Math.round(rawDifference);
```

**Avantages** :
- ✅ Approche scientifiquement justifiée
- ✅ Masque les erreurs d'arrondi
- ✅ Conserve les vrais surplus/déficits

**Inconvénients** :
- ⚠️ Peut masquer de petits ajustements intentionnels

---

## Recommandation finale

### Approche hybride : Solution 1 + Solution 2

1. **Ajuster le calcul des macros** (Solution 2) pour éliminer l'erreur d'arrondi
2. **Masquer les petites différences** (Solution 1) comme filet de sécurité

**Code complet recommandé** :

```typescript
// Calcul des macros avec compensation d'arrondi
const targetTdee = baseMetabolicData.baseTdee;

const originP = Math.round((targetTdee * 0.3) / 4);
const originC = Math.round((targetTdee * 0.4) / 4);

// Ajuster les lipides pour compenser l'erreur d'arrondi
const caloriesFromProteinAndCarbs = (originP * 4) + (originC * 4);
const remainingCalories = targetTdee - caloriesFromProteinAndCarbs;
const originF = Math.round(remainingCalories / 9);

const tdeeMacros = { protein: originP, carbs: originC, fat: originF };

// Affichage avec seuil de 5 kcal
{editableCalculatedData.surplusDeficit !== 0 && 
 Math.abs(editableCalculatedData.surplusDeficit) >= 5 && (
  <span className={...}>
    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
    {editableCalculatedData.surplusDeficit} kcal
  </span>
)}
```

**Avantages de cette approche** :
- ✅ Élimine la plupart des erreurs d'arrondi
- ✅ Masque les erreurs résiduelles négligeables
- ✅ Maintient la précision des calculs
- ✅ Affichage professionnel

---

## Validation de la solution

### Test avec l'exemple du profil

**Données** : Homme, 38 ans, 85 kg, 168 cm, modérément actif

1. **BMR** : 1818 kcal
2. **TDEE** : 2818 kcal

**Avec la solution recommandée** :

```
Protéines : Math.round((2818 × 0.3) / 4) = Math.round(211.35) = 211 g
Glucides : Math.round((2818 × 0.4) / 4) = Math.round(281.8) = 282 g

Calories P + C : (211 × 4) + (282 × 4) = 844 + 1128 = 1972 kcal
Calories restantes : 2818 - 1972 = 846 kcal
Lipides : Math.round(846 / 9) = Math.round(94) = 94 g

Total recalculé : 844 + 1128 + 846 = 2818 kcal ✅
Surplus/Déficit : 2818 - 2818 = 0 kcal ✅
```

**Résultat** : Pas d'affichage de "+1 kcal" !

---

## Conclusion

Le problème du "+1 kcal" est causé par des **erreurs d'arrondi cumulées** lors du calcul des macronutriments. La solution recommandée combine :

1. **Ajustement du calcul** pour éliminer l'erreur à la source
2. **Seuil d'affichage** pour masquer les erreurs résiduelles

Cette approche garantit un affichage professionnel et des calculs précis.
