# Formules Métaboliques - Guide de Référence

## 1. BMR (Basal Metabolic Rate) - Métabolisme de Base

Le BMR représente la quantité d'énergie (en kcal) que le corps dépense au repos pour maintenir ses fonctions vitales (respiration, circulation sanguine, régulation de la température, etc.).

---

## 2. Formules BMR

### A. Formule de Harris-Benedict (Révisée 1984) ⭐ ACTUELLEMENT UTILISÉE

**Pour les hommes** :
```
BMR = 88.362 + (13.397 × poids en kg) + (4.799 × taille en cm) - (5.677 × âge en années)
```

**Pour les femmes** :
```
BMR = 447.593 + (9.247 × poids en kg) + (3.098 × taille en cm) - (4.33 × âge en années)
```

**Caractéristiques** :
- ✅ Largement utilisée dans l'industrie du fitness
- ✅ Bien validée scientifiquement
- ⚠️ Tend à surestimer légèrement le BMR (environ 5%)
- 📅 Basée sur des données de 1984

**Exemple** : Homme de 38 ans, 85 kg, 168 cm
```
BMR = 88.362 + (13.397 × 85) + (4.799 × 168) - (5.677 × 38)
BMR = 88.362 + 1138.745 + 806.232 - 215.726
BMR = 1817.6 ≈ 1818 kcal
```

---

### B. Formule de Mifflin-St Jeor (1990) 🏆 RECOMMANDÉE

**Pour les hommes** :
```
BMR = (10 × poids en kg) + (6.25 × taille en cm) - (5 × âge en années) + 5
```

**Pour les femmes** :
```
BMR = (10 × poids en kg) + (6.25 × taille en cm) - (5 × âge en années) - 161
```

**Caractéristiques** :
- ✅ Considérée comme la plus précise pour les populations modernes
- ✅ Recommandée par l'Academy of Nutrition and Dietetics
- ✅ Erreur moyenne de ±10%
- ✅ Moins de surestimation que Harris-Benedict
- 📅 Basée sur des données de 1990

**Exemple** : Homme de 38 ans, 85 kg, 168 cm
```
BMR = (10 × 85) + (6.25 × 168) - (5 × 38) + 5
BMR = 850 + 1050 - 190 + 5
BMR = 1715 kcal
```

**Différence avec Harris-Benedict** : Environ 100 kcal de moins (plus conservateur)

---

### C. Formule de Katch-McArdle

**Formule unique (homme et femme)** :
```
BMR = 370 + (21.6 × masse maigre en kg)
```

Où : `masse maigre = poids × (1 - % graisse corporelle / 100)`

**Caractéristiques** :
- ✅ Très précise si la composition corporelle est connue
- ⚠️ Nécessite une mesure précise du % de graisse corporelle
- 🎯 Idéale pour les athlètes et les personnes suivant leur composition corporelle

**Exemple** : Homme de 85 kg avec 20% de graisse corporelle
```
Masse maigre = 85 × (1 - 20/100) = 85 × 0.8 = 68 kg
BMR = 370 + (21.6 × 68)
BMR = 370 + 1468.8
BMR = 1838.8 ≈ 1839 kcal
```

---

### D. Formule de Harris-Benedict (Originale 1919)

**Pour les hommes** :
```
BMR = 66.5 + (13.75 × poids en kg) + (5.003 × taille en cm) - (6.755 × âge en années)
```

**Pour les femmes** :
```
BMR = 655.1 + (9.563 × poids en kg) + (1.850 × taille en cm) - (4.676 × âge en années)
```

**Caractéristiques** :
- ⚠️ Version obsolète, remplacée par la version de 1984
- ⚠️ Surestimation importante du BMR (environ 10-15%)
- 📅 Basée sur des données de 1919

---

## 3. TDEE (Total Daily Energy Expenditure) - Dépense Énergétique Totale

Le TDEE représente la quantité totale d'énergie dépensée par jour, incluant le BMR et l'activité physique.

### Formule

```
TDEE = BMR × Multiplicateur d'activité
```

### Multiplicateurs d'activité (Facteurs de Harris-Benedict)

| Niveau d'activité | Multiplicateur | Description |
|-------------------|----------------|-------------|
| **Sédentaire** | 1.2 | Peu ou pas d'exercice, travail de bureau |
| **Légèrement actif** | 1.375 | Exercice léger 1-3 jours/semaine |
| **Modérément actif** | 1.55 | Exercice modéré 3-5 jours/semaine |
| **Très actif** | 1.725 | Exercice intense 6-7 jours/semaine |
| **Extrêmement actif** | 1.9 | Exercice intense quotidien + travail physique |

### Exemple complet

**Homme de 38 ans, 85 kg, 168 cm, modérément actif**

1. **Calcul BMR (Harris-Benedict 1984)** :
   ```
   BMR = 1818 kcal
   ```

2. **Calcul TDEE** :
   ```
   TDEE = 1818 × 1.55 (modérément actif)
   TDEE = 2817.9 ≈ 2818 kcal
   ```

---

## 4. Calcul des Macronutriments

### Répartition standard (30/40/30)

- **Protéines** : 30% des calories totales
- **Glucides** : 40% des calories totales
- **Lipides** : 30% des calories totales

### Conversion calories → grammes

- **1 g de protéines** = 4 kcal
- **1 g de glucides** = 4 kcal
- **1 g de lipides** = 9 kcal

### Exemple pour TDEE = 2818 kcal

1. **Protéines (30%)** :
   ```
   Calories : 2818 × 0.30 = 845.4 kcal
   Grammes : 845.4 / 4 = 211.35 g ≈ 211 g
   ```

2. **Glucides (40%)** :
   ```
   Calories : 2818 × 0.40 = 1127.2 kcal
   Grammes : 1127.2 / 4 = 281.8 g ≈ 282 g
   ```

3. **Lipides (30%)** :
   ```
   Calories : 2818 × 0.30 = 845.4 kcal
   Grammes : 845.4 / 9 = 93.93 g ≈ 94 g
   ```

### Vérification

```
Total = (211 × 4) + (282 × 4) + (94 × 9)
Total = 844 + 1128 + 846
Total = 2818 kcal ✅
```

---

## 5. Objectifs Caloriques selon les Objectifs

### Perte de poids (déficit calorique)

- **Modéré** : TDEE - 300 à 500 kcal (-10% à -20%)
- **Agressif** : TDEE - 500 à 750 kcal (-20% à -30%)

**Exemple** : TDEE = 2818 kcal
- Perte modérée : 2318 à 2518 kcal
- Perte aggressive : 2068 à 2318 kcal

### Prise de masse (surplus calorique)

- **Modéré** : TDEE + 200 à 400 kcal (+10% à +15%)
- **Agressif** : TDEE + 400 à 600 kcal (+15% à +25%)

**Exemple** : TDEE = 2818 kcal
- Prise modérée : 3018 à 3218 kcal
- Prise aggressive : 3218 à 3418 kcal

### Maintien

```
Objectif = TDEE
```

---

## 6. Comparaison des Formules

### Tableau comparatif (Homme 38 ans, 85 kg, 168 cm)

| Formule | BMR (kcal) | TDEE (×1.55) | Différence |
|---------|-----------|--------------|------------|
| **Harris-Benedict 1984** | 1818 | 2818 | Référence |
| **Mifflin-St Jeor 1990** | 1715 | 2658 | -160 kcal |
| **Katch-McArdle (20% BF)** | 1839 | 2850 | +32 kcal |
| **Harris-Benedict 1919** | 1846 | 2861 | +43 kcal |

### Recommandations d'utilisation

| Situation | Formule recommandée |
|-----------|---------------------|
| **Population générale** | Mifflin-St Jeor |
| **Athlètes avec composition corporelle connue** | Katch-McArdle |
| **Compatibilité avec outils existants** | Harris-Benedict 1984 |
| **Maximum de précision** | Mifflin-St Jeor |

---

## 7. Sources et Références

1. **Harris, J. A., & Benedict, F. G. (1918)**. A Biometric Study of Human Basal Metabolism. *Proceedings of the National Academy of Sciences*, 4(12), 370-373.

2. **Roza, A. M., & Shizgal, H. M. (1984)**. The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass. *The American Journal of Clinical Nutrition*, 40(1), 168-182.

3. **Mifflin, M. D., St Jeor, S. T., Hill, L. A., Scott, B. J., Daugherty, S. A., & Koh, Y. O. (1990)**. A new predictive equation for resting energy expenditure in healthy individuals. *The American Journal of Clinical Nutrition*, 51(2), 241-247.

4. **Katch, F. I., & McArdle, W. D. (1996)**. *Introduction to Nutrition, Exercise, and Health* (4th ed.). Lippincott Williams & Wilkins.

5. **Academy of Nutrition and Dietetics (2023)**. Position Paper on Energy Balance and Weight Management.

---

## 8. Notes Importantes

### Précision des formules

- Toutes les formules ont une marge d'erreur de ±10-15%
- Les variations individuelles (génétique, hormones, etc.) influencent le métabolisme
- Les formules sont des estimations, pas des mesures exactes

### Facteurs non pris en compte

- Composition corporelle détaillée
- Variations hormonales
- Historique de régimes
- Médicaments
- Conditions médicales

### Ajustements recommandés

1. Utiliser la formule comme point de départ
2. Suivre le poids et les mensurations sur 2-3 semaines
3. Ajuster les calories en fonction des résultats réels
4. Réévaluer tous les 4-6 semaines
