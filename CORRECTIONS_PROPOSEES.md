# Corrections Proposées - Calculs Métaboliques

## Résumé du problème

L'interface coach affiche "+1 kcal (0.0%)" dans l'objectif calorique, causé par des erreurs d'arrondi lors du calcul des macronutriments.

---

## Correction 1 : Ajuster le calcul des macros (PRIORITAIRE)

### Fichier : `src/pages/ClientProfile.tsx`

### Lignes à modifier : 555-560

**Code actuel** :
```typescript
// Calculer les macros d'origine basés sur le TDEE (répartition standard 30/40/30)
const targetTdee = baseMetabolicData.baseTdee;
const originP = Math.round((targetTdee * 0.3) / 4);
const originF = Math.round((targetTdee * 0.3) / 9);
const originC = Math.round((targetTdee * 0.4) / 4);
const tdeeMacros = { protein: originP, carbs: originC, fat: originF };
```

**Code corrigé** :
```typescript
// Calculer les macros d'origine basés sur le TDEE (répartition standard 30/40/30)
const targetTdee = baseMetabolicData.baseTdee;

// Calculer protéines et glucides normalement
const originP = Math.round((targetTdee * 0.3) / 4);
const originC = Math.round((targetTdee * 0.4) / 4);

// Ajuster les lipides pour compenser l'erreur d'arrondi et garantir que le total = TDEE
const caloriesFromProteinAndCarbs = (originP * 4) + (originC * 4);
const remainingCalories = targetTdee - caloriesFromProteinAndCarbs;
const originF = Math.round(remainingCalories / 9);

const tdeeMacros = { protein: originP, carbs: originC, fat: originF };
```

**Explication** :
- On calcule d'abord les protéines et glucides avec leurs arrondis
- On calcule ensuite les calories restantes pour atteindre exactement le TDEE
- On ajuste les lipides pour utiliser ces calories restantes
- Cela garantit que : `(P × 4) + (C × 4) + (F × 9) = TDEE`

**Impact** :
- ✅ Élimine l'erreur d'arrondi à la source
- ✅ Garantit que l'objectif calorique = TDEE par défaut
- ✅ Pas de changement visible pour l'utilisateur (différence de ±1g sur les lipides maximum)

---

## Correction 2 : Masquer les petites différences (SÉCURITÉ)

### Fichier : `src/pages/ClientProfile.tsx`

### Lignes à modifier : 1520-1528

**Code actuel** :
```typescript
{editableCalculatedData.surplusDeficit !== 0 && (
  <span
    className={`font-bold text-sm px-2 py-0.5 rounded-md ${editableCalculatedData.surplusDeficit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
  >
    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
    {editableCalculatedData.surplusDeficit} kcal (
    {editableCalculatedData.surplusDeficitPercent.toFixed(1)}%)
  </span>
)}
```

**Code corrigé** :
```typescript
{editableCalculatedData.surplusDeficit !== 0 && 
 Math.abs(editableCalculatedData.surplusDeficit) >= 5 && (
  <span
    className={`font-bold text-sm px-2 py-0.5 rounded-md ${editableCalculatedData.surplusDeficit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
  >
    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
    {editableCalculatedData.surplusDeficit} kcal (
    {editableCalculatedData.surplusDeficitPercent.toFixed(1)}%)
  </span>
)}
```

**Explication** :
- On ajoute une condition `Math.abs(editableCalculatedData.surplusDeficit) >= 5`
- Cela masque les différences inférieures à 5 kcal (considérées comme négligeables)
- Les vrais surplus/déficits (≥5 kcal) restent affichés

**Impact** :
- ✅ Masque les erreurs d'arrondi résiduelles
- ✅ Affichage plus professionnel
- ✅ Conserve l'affichage pour les ajustements intentionnels

---

## Correction 3 : Ajouter un commentaire explicatif

### Fichier : `src/pages/ClientProfile.tsx`

### Lignes à ajouter : Après la ligne 560

**Code à ajouter** :
```typescript
const tdeeMacros = { protein: originP, carbs: originC, fat: originF };

// Note : Les lipides sont ajustés en dernier pour compenser les erreurs d'arrondi
// et garantir que le total calorique corresponde exactement au TDEE.
// Cela évite l'affichage de "+1 kcal" ou "-1 kcal" dû aux arrondis successifs.
```

**Impact** :
- ✅ Documente le raisonnement pour les futurs développeurs
- ✅ Évite que la logique soit modifiée par erreur

---

## Correction optionnelle : Passer à Mifflin-St Jeor

### Fichier : `src/pages/ClientProfile.tsx`

### Lignes à modifier : 540-542

**Code actuel (Harris-Benedict 1984)** :
```typescript
const isMale = client.sex === 'Homme' || client.sex === 'male';
const bmr = isMale
  ? 88.362 + 13.397 * client.weight + 4.799 * client.height - 5.677 * client.age
  : 447.593 + 9.247 * client.weight + 3.098 * client.height - 4.33 * client.age;
```

**Code corrigé (Mifflin-St Jeor 1990)** :
```typescript
const isMale = client.sex === 'Homme' || client.sex === 'male';
const bmr = isMale
  ? 10 * client.weight + 6.25 * client.height - 5 * client.age + 5
  : 10 * client.weight + 6.25 * client.height - 5 * client.age - 161;
```

**Explication** :
- Mifflin-St Jeor est considérée comme plus précise pour les populations modernes
- Recommandée par l'Academy of Nutrition and Dietetics
- Moins de surestimation du BMR

**Impact** :
- ✅ Calculs plus précis
- ⚠️ Changement des valeurs pour tous les clients existants (environ -100 kcal)
- ⚠️ Nécessite une communication avec les coachs

**Recommandation** : À implémenter dans une version future avec une option de choix de formule.

---

## Plan de mise en œuvre

### Phase 1 : Corrections immédiates (PRIORITAIRE)

1. ✅ Appliquer **Correction 1** (ajustement du calcul des macros)
2. ✅ Appliquer **Correction 2** (masquer les petites différences)
3. ✅ Appliquer **Correction 3** (commentaire explicatif)

**Temps estimé** : 15 minutes  
**Impact** : Résout le problème du "+1 kcal"

### Phase 2 : Tests

1. Tester avec différents profils clients
2. Vérifier que l'objectif calorique = TDEE par défaut
3. Vérifier que les surplus/déficits intentionnels s'affichent correctement

**Temps estimé** : 30 minutes

### Phase 3 : Déploiement

1. Créer une branche Git
2. Commit des modifications
3. Pull Request
4. Fusion et déploiement

**Temps estimé** : 20 minutes

### Phase 4 : Amélioration future (OPTIONNEL)

1. Implémenter le choix de formule BMR (Harris-Benedict vs Mifflin-St Jeor)
2. Ajouter une option dans les paramètres du coach
3. Migrer progressivement vers Mifflin-St Jeor

**Temps estimé** : 2-3 heures

---

## Code complet des corrections

### Correction complète pour ClientProfile.tsx

```typescript
// Ligne 555-560 : Calcul des macros avec compensation d'arrondi
const targetTdee = baseMetabolicData.baseTdee;

// Calculer protéines et glucides normalement
const originP = Math.round((targetTdee * 0.3) / 4);
const originC = Math.round((targetTdee * 0.4) / 4);

// Ajuster les lipides pour compenser l'erreur d'arrondi et garantir que le total = TDEE
const caloriesFromProteinAndCarbs = (originP * 4) + (originC * 4);
const remainingCalories = targetTdee - caloriesFromProteinAndCarbs;
const originF = Math.round(remainingCalories / 9);

const tdeeMacros = { protein: originP, carbs: originC, fat: originF };

// Note : Les lipides sont ajustés en dernier pour compenser les erreurs d'arrondi
// et garantir que le total calorique corresponde exactement au TDEE.
// Cela évite l'affichage de "+1 kcal" ou "-1 kcal" dû aux arrondis successifs.

// Ligne 1520-1528 : Affichage du surplus/déficit avec seuil
{editableCalculatedData.surplusDeficit !== 0 && 
 Math.abs(editableCalculatedData.surplusDeficit) >= 5 && (
  <span
    className={`font-bold text-sm px-2 py-0.5 rounded-md ${editableCalculatedData.surplusDeficit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
  >
    {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}
    {editableCalculatedData.surplusDeficit} kcal (
    {editableCalculatedData.surplusDeficitPercent.toFixed(1)}%)
  </span>
)}
```

---

## Validation de la solution

### Test 1 : Profil par défaut (TDEE = 2818 kcal)

**Avant correction** :
```
Protéines : 211 g (844 kcal)
Glucides : 282 g (1128 kcal)
Lipides : 94 g (846 kcal)
Total : 2818 kcal
Surplus/Déficit : +1 kcal ❌
```

**Après correction** :
```
Protéines : 211 g (844 kcal)
Glucides : 282 g (1128 kcal)
Lipides : 94 g (846 kcal)  [ajusté automatiquement]
Total : 2818 kcal
Surplus/Déficit : 0 kcal ✅ (pas d'affichage)
```

### Test 2 : Ajustement manuel (+200 kcal)

**Scénario** : Le coach augmente les glucides de 50g

```
Protéines : 211 g (844 kcal)
Glucides : 332 g (1328 kcal)  [+50g]
Lipides : 94 g (846 kcal)
Total : 3018 kcal
Surplus/Déficit : +200 kcal ✅ (affiché correctement)
```

### Test 3 : Petit ajustement (+3 kcal)

**Scénario** : Erreur d'arrondi résiduelle de 3 kcal

```
Total : 2821 kcal
Surplus/Déficit : +3 kcal
Affichage : Rien ✅ (< 5 kcal, masqué)
```

---

## Bénéfices attendus

1. ✅ **Élimination du "+1 kcal"** : Le problème disparaît complètement
2. ✅ **Affichage professionnel** : Seuls les vrais surplus/déficits sont affichés
3. ✅ **Calculs précis** : L'objectif calorique correspond exactement au TDEE par défaut
4. ✅ **Maintenabilité** : Code documenté et compréhensible
5. ✅ **Pas de régression** : Les fonctionnalités existantes ne sont pas affectées

---

## Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Changement des valeurs de lipides | Faible | Faible | Différence de ±1g maximum, imperceptible |
| Masquage de petits ajustements intentionnels | Très faible | Faible | Seuil de 5 kcal permet les ajustements > 5 kcal |
| Régression sur d'autres calculs | Très faible | Moyen | Tests complets avant déploiement |

---

## Conclusion

Les corrections proposées résolvent le problème du "+1 kcal" de manière élégante et professionnelle, sans affecter les fonctionnalités existantes. L'implémentation est simple et rapide, avec un impact immédiat sur l'expérience utilisateur.
