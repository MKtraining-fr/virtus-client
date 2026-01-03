# Analyse des Formules Métaboliques - Application Virtus

## Formules actuellement utilisées dans le code

### Localisation
**Fichier** : `src/pages/ClientProfile.tsx`  
**Lignes** : 528-548

### Code actuel

```typescript
const baseMetabolicData = useMemo(() => {
  if (
    !client ||
    !client.weight ||
    !client.height ||
    !client.age ||
    !client.sex ||
    !client.energyExpenditureLevel
  )
    return null;

  const isMale = client.sex === 'Homme' || client.sex === 'male';
  const bmr = isMale
    ? 88.362 + 13.397 * client.weight + 4.799 * client.height - 5.677 * client.age
    : 447.593 + 9.247 * client.weight + 3.098 * client.height - 4.33 * client.age;

  const multiplier = activityMultipliers[client.energyExpenditureLevel] || 1.55;
  const baseTdee = bmr * multiplier;

  return { bmr: Math.round(bmr), baseTdee: Math.round(baseTdee) };
}, [client]);
```

### Multiplicateurs d'activité

```typescript
const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
  Sédentaire: 1.2,
  'Légèrement actif': 1.375,
  Actif: 1.55,
  'Très actif': 1.725,
};
```

## Identification des formules utilisées

### BMR (Basal Metabolic Rate) - Métabolisme de Base

L'application utilise la **formule de Harris-Benedict (version révisée 1984)** :

#### Pour les hommes :
```
BMR = 88.362 + (13.397 × poids en kg) + (4.799 × taille en cm) - (5.677 × âge en années)
```

#### Pour les femmes :
```
BMR = 447.593 + (9.247 × poids en kg) + (3.098 × taille en cm) - (4.33 × âge en années)
```

### TDEE (Total Daily Energy Expenditure) - Dépense Énergétique Totale

```
TDEE = BMR × Multiplicateur d'activité
```

**Multiplicateurs d'activité** :
- Sédentaire : 1.2
- Légèrement actif : 1.375
- Modérément actif : 1.55
- Très actif : 1.725
- Extrêmement actif : 1.9

## Calcul de l'objectif calorique

### Code actuel (lignes 581-603)

```typescript
const editableCalculatedData = useMemo(() => {
  if (tdee === null || !client) return null;
  const { protein, carbs, fat } = editableMacros;
  const pKcal = protein * 4,
    cKcal = carbs * 4,
    fKcal = fat * 9;
  const oCal = pKcal + cKcal + fKcal;
  return {
    objectifCalorique: oCal,
    surplusDeficit: Math.round(oCal - tdee),
    surplusDeficitPercent: tdee > 0 ? ((oCal - tdee) / tdee) * 100 : 0,
    // ...
  };
}, [tdee, editableMacros, client]);
```

### Calcul des macros par défaut (lignes 555-560)

```typescript
// Répartition standard 30/40/30 (Protéines/Glucides/Lipides)
const targetTdee = baseMetabolicData.baseTdee;
const originP = Math.round((targetTdee * 0.3) / 4);  // 30% en protéines
const originF = Math.round((targetTdee * 0.3) / 9);  // 30% en lipides
const originC = Math.round((targetTdee * 0.4) / 4);  // 40% en glucides
```

## Problème identifié : "+1 kcal"

### Cause probable

Le problème du "+1 kcal" provient d'une **erreur d'arrondi** lors du calcul des macros.

#### Exemple de calcul pour un TDEE de 2817 kcal :

1. **Protéines (30%)** :
   - Calories : 2817 × 0.3 = 845.1 kcal
   - Grammes : 845.1 / 4 = 211.275 → arrondi à **211 g**
   - Calories réelles : 211 × 4 = **844 kcal**

2. **Glucides (40%)** :
   - Calories : 2817 × 0.4 = 1126.8 kcal
   - Grammes : 1126.8 / 4 = 281.7 → arrondi à **282 g**
   - Calories réelles : 282 × 4 = **1128 kcal**

3. **Lipides (30%)** :
   - Calories : 2817 × 0.3 = 845.1 kcal
   - Grammes : 845.1 / 9 = 93.9 → arrondi à **94 g**
   - Calories réelles : 94 × 9 = **846 kcal**

4. **Total recalculé** :
   - 844 + 1128 + 846 = **2818 kcal**
   - Différence : 2818 - 2817 = **+1 kcal**

### Pourquoi cela arrive ?

Les arrondis successifs créent des petites erreurs qui s'accumulent. Quand on arrondit chaque macro individuellement, puis qu'on recalcule le total, on obtient rarement exactement le TDEE de départ.

## Autres formules BMR disponibles

### 1. Formule de Mifflin-St Jeor (1990) - RECOMMANDÉE

**Plus précise que Harris-Benedict**, considérée comme la référence actuelle.

#### Pour les hommes :
```
BMR = (10 × poids en kg) + (6.25 × taille en cm) - (5 × âge en années) + 5
```

#### Pour les femmes :
```
BMR = (10 × poids en kg) + (6.25 × taille en cm) - (5 × âge en années) - 161
```

### 2. Formule de Katch-McArdle

Basée sur la masse maigre (nécessite de connaître le % de graisse corporelle).

```
BMR = 370 + (21.6 × masse maigre en kg)
```

Où : `masse maigre = poids × (1 - % graisse corporelle / 100)`

### 3. Formule de Harris-Benedict (version originale 1919)

#### Pour les hommes :
```
BMR = 66.5 + (13.75 × poids en kg) + (5.003 × taille en cm) - (6.755 × âge en années)
```

#### Pour les femmes :
```
BMR = 655.1 + (9.563 × poids en kg) + (1.850 × taille en cm) - (4.676 × âge en années)
```

## Comparaison des formules

### Exemple : Homme de 38 ans, 85 kg, 168 cm

| Formule | BMR (kcal) |
|---------|-----------|
| Harris-Benedict (1984) - **ACTUELLE** | 88.362 + (13.397 × 85) + (4.799 × 168) - (5.677 × 38) = **1818 kcal** |
| Mifflin-St Jeor (1990) | (10 × 85) + (6.25 × 168) - (5 × 38) + 5 = **1745 kcal** |
| Harris-Benedict (1919) | 66.5 + (13.75 × 85) + (5.003 × 168) - (6.755 × 38) = **1846 kcal** |

**Différence** : Environ 70-100 kcal entre les formules.

## Recommandations

### 1. Corriger l'erreur d'arrondi

**Option A** : Ajuster le dernier macro pour compenser l'erreur d'arrondi

```typescript
const targetTdee = baseMetabolicData.baseTdee;
const proteinKcal = targetTdee * 0.3;
const carbsKcal = targetTdee * 0.4;
const fatKcal = targetTdee * 0.3;

const originP = Math.round(proteinKcal / 4);
const originC = Math.round(carbsKcal / 4);
// Calculer les lipides en dernier pour compenser l'erreur d'arrondi
const totalKcalSoFar = (originP * 4) + (originC * 4);
const remainingKcal = targetTdee - totalKcalSoFar;
const originF = Math.round(remainingKcal / 9);
```

**Option B** : Accepter une petite marge d'erreur (±5 kcal)

Ne rien afficher si la différence est inférieure à 5 kcal :

```typescript
{editableCalculatedData.surplusDeficit !== 0 && Math.abs(editableCalculatedData.surplusDeficit) >= 5 && (
  <span className={...}>
    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
    {editableCalculatedData.surplusDeficit} kcal
  </span>
)}
```

### 2. Considérer la formule de Mifflin-St Jeor

La formule de **Mifflin-St Jeor** est considérée comme plus précise et est recommandée par l'Academy of Nutrition and Dietetics.

**Avantages** :
- Plus précise pour les populations modernes
- Mieux validée scientifiquement
- Moins de surestimation du BMR

**Inconvénient** :
- Changement de formule = changement des valeurs pour tous les clients existants

### 3. Ajouter une option de formule

Permettre au coach de choisir la formule à utiliser dans les paramètres.

## Validation scientifique

### Harris-Benedict (1984)
- ✅ Largement utilisée
- ⚠️ Tend à surestimer légèrement le BMR
- 📅 Basée sur des données de 1984

### Mifflin-St Jeor (1990)
- ✅ Considérée comme la plus précise
- ✅ Recommandée par l'Academy of Nutrition and Dietetics
- ✅ Erreur moyenne de ±10%

### Katch-McArdle
- ✅ Très précise si % de graisse corporelle est connu
- ⚠️ Nécessite une mesure précise de la composition corporelle

## Conclusion

1. **Formule BMR actuelle** : Harris-Benedict (1984) - Correcte mais pas la plus récente
2. **Problème "+1 kcal"** : Erreur d'arrondi dans le calcul des macros
3. **Solution immédiate** : Masquer les différences < 5 kcal ou ajuster le calcul
4. **Amélioration future** : Passer à Mifflin-St Jeor pour plus de précision
