# Modifications du Template "Bilan Initial" - Récapitulatif

**Date :** 5 octobre 2025  
**Commit :** b5f131e  
**Statut :** ✅ Déployé sur GitHub, en cours de déploiement sur Netlify

---

## 📋 Résumé des Modifications

Ce document récapitule les modifications apportées au template "Bilan Initial" de l'application Virtus pour améliorer la collecte d'informations sur les allergies alimentaires et optimiser l'organisation des champs.

---

## 🎯 Objectifs Atteints

### 1. Déplacement du Champ "Niveau d'Activité Physique"

**Avant :**
- Le champ "Niveau d'activité physique" se trouvait dans la section "Vie Quotidienne"

**Après :**
- Le champ a été déplacé vers la section "Informations Générales"
- La section "Vie Quotidienne" ne contient maintenant que le champ "Profession"

**Justification :**
- Meilleure cohérence logique : le niveau d'activité physique est une information générale importante
- Regroupement des informations de base du client dans une seule section

---

### 2. Remplacement du Champ Allergies par une Liste Structurée

**Avant :**
- Champ texte libre (textarea) pour les allergies alimentaires
- Pas de standardisation des réponses
- Difficile à analyser et à traiter

**Après :**
- Liste de cases à cocher (checkbox) avec les 14 allergènes officiels de l'Union Européenne
- Option "Autre" avec champ conditionnel pour préciser
- Données structurées et standardisées

**Liste des 14 Allergènes (Réglementation UE - INCO) :**

1. Céréales contenant du gluten (blé, seigle, orge, avoine)
2. Crustacés
3. Œufs
4. Poisson
5. Arachides (cacahuètes)
6. Soja
7. Lait et produits laitiers
8. Fruits à coque (amandes, noisettes, noix, cajou, etc.)
9. Céleri
10. Moutarde
11. Graines de sésame
12. Sulfites
13. Lupin
14. Mollusques
15. **Autre** (avec champ texte conditionnel)

---

### 3. Ajout d'un Champ Conditionnel

**Fonctionnalité :**
- Lorsque l'utilisateur coche "Autre" dans les allergies
- Un champ texte "Précisez autre allergie" apparaît automatiquement
- Le champ disparaît si "Autre" est décoché

**Implémentation :**
- Propriétés ajoutées au type `BilanField` : `conditionalOn`, `conditionalValue`, `hasOther`, `otherFieldId`
- Logique de rendu conditionnel dans `NewBilan.tsx`

---

## 🔧 Modifications Techniques

### Fichiers Modifiés

#### 1. `src/types.ts`
```typescript
export interface BilanField {
    id: string;
    label: string;
    type: BilanFieldType;
    placeholder?: string;
    options?: string[];
    hasOther?: boolean;           // ✨ NOUVEAU
    otherFieldId?: string;        // ✨ NOUVEAU
    conditionalOn?: string;       // ✨ NOUVEAU
    conditionalValue?: string;    // ✨ NOUVEAU
}
```

#### 2. `src/pages/NewBilan.tsx`
- Ajout de la logique de rendu conditionnel pour les champs
- Vérification de `conditionalOn` et `conditionalValue` avant d'afficher un champ
- Support des valeurs multiples (tableaux) pour les checkboxes

```typescript
// Gérer les champs conditionnels
if (field.conditionalOn && field.conditionalValue) {
    const parentValue = answers[field.conditionalOn];
    const shouldShow = Array.isArray(parentValue) 
        ? parentValue.includes(field.conditionalValue)
        : parentValue === field.conditionalValue;
    
    if (!shouldShow) {
        return null;
    }
}
```

#### 3. Base de Données Supabase (`bilan_templates`)
- Mise à jour de la structure JSON du template "Bilan Initial"
- Utilisation de la clé `service_role` pour bypasser les politiques RLS

---

## 📊 Structure du Template Mise à Jour

### Section 1 : Informations Générales (9 champs)
- Prénom
- Nom
- Date de naissance
- Sexe
- Taille (cm)
- Poids actuel (kg)
- Email
- Téléphone
- **Niveau d'activité physique** ⬅️ DÉPLACÉ ICI

### Section 2 : Objectif (3 champs)
- Objectif principal
- Poids souhaité (kg)
- Délai souhaité

### Section 3 : Vie Quotidienne (1 champ)
- Profession

### Section 4 : Alimentation (4 champs)
- **Allergies alimentaires** (checkbox avec 15 options) ⬅️ MODIFIÉ
- **Précisez autre allergie** (conditionnel) ⬅️ NOUVEAU
- Aliments que vous n'aimez pas
- Habitudes alimentaires actuelles

---

## 🚀 Déploiement

### Étapes Réalisées

1. ✅ **Recherche des allergènes officiels**
   - Consultation de la réglementation européenne (INCO)
   - Validation de la liste des 14 allergènes majeurs

2. ✅ **Mise à jour de la base de données**
   - Script Node.js avec clé `service_role` Supabase
   - Mise à jour du template "Bilan Initial" (ID: cefbfd36-aa7f-401d-8231-403a858238ab)

3. ✅ **Modifications du code React**
   - Mise à jour des types TypeScript
   - Ajout de la logique conditionnelle dans NewBilan.tsx

4. ✅ **Commit et Push vers GitHub**
   - Commit: `b5f131e`
   - Message: "feat: Amélioration du template Bilan Initial avec allergènes structurés"
   - Branche: `main`

5. 🔄 **Déploiement automatique sur Netlify**
   - Détection automatique du commit par Netlify
   - Build et déploiement en cours (2-3 minutes)

---

## 🧪 Tests à Effectuer

Une fois le déploiement terminé, vérifier :

### ✓ Affichage du Template
1. Se connecter à l'application Virtus
2. Aller dans "Nouveau Bilan"
3. Sélectionner le template "Bilan Initial"

### ✓ Section Informations Générales
- [ ] Le champ "Niveau d'activité physique" est présent
- [ ] Le champ est de type select avec 5 options

### ✓ Section Vie Quotidienne
- [ ] Seul le champ "Profession" est présent
- [ ] Le champ "Niveau d'activité physique" n'est plus là

### ✓ Section Alimentation - Allergies
- [ ] Le champ "Allergies alimentaires" affiche des cases à cocher
- [ ] 15 options sont disponibles (14 allergènes + Autre)
- [ ] Possibilité de cocher plusieurs options
- [ ] Lorsqu'on coche "Autre", le champ "Précisez autre allergie" apparaît
- [ ] Lorsqu'on décoche "Autre", le champ disparaît

### ✓ Sauvegarde des Données
- [ ] Les allergies cochées sont bien sauvegardées
- [ ] Le champ "Autre" est sauvegardé si rempli
- [ ] Les données sont correctement affichées dans le profil client

---

## 📁 Fichiers Créés (Scripts Utilitaires)

Les scripts suivants ont été créés pour la mise à jour et peuvent être réutilisés :

- `get-current-template.cjs` - Récupérer le template actuel depuis Supabase
- `update-with-service-role.cjs` - Mettre à jour le template avec la clé service_role
- `update-template-allergenes.sql` - Script SQL de mise à jour (alternative)
- `fix-bilan-templates-rls.sql` - Correction des politiques RLS (si nécessaire)
- `ALLERGENES_LISTE_OFFICIELLE.md` - Documentation des allergènes officiels UE

---

## 🔐 Sécurité

**Note importante :** La clé `service_role` a été utilisée uniquement côté serveur pour la mise à jour de la base de données. Elle n'est pas incluse dans le code client et ne sera jamais exposée publiquement.

---

## 📚 Références

- **Réglementation européenne :** Règlement (UE) n° 1169/2011 (INCO)
- **Source officielle :** [EFSA - Allergènes alimentaires](https://www.efsa.europa.eu/fr/safe2eat/food-allergens)
- **Documentation :** [EUFIC - Liste des 14 allergènes](https://www.eufic.org/fr/une-vie-saine/article/liste-des-14-allergenes-alimentaires-les-plus-courants)

---

## ✅ Statut Final

| Tâche | Statut |
|-------|--------|
| Recherche des allergènes officiels | ✅ Terminé |
| Mise à jour de la base de données | ✅ Terminé |
| Modification du code React | ✅ Terminé |
| Mise à jour des types TypeScript | ✅ Terminé |
| Commit et push vers GitHub | ✅ Terminé |
| Déploiement sur Netlify | 🔄 En cours |
| Tests en production | ⏳ À effectuer |

---

## 🎉 Conclusion

Toutes les modifications demandées ont été implémentées avec succès :

1. ✅ Le champ "Niveau d'activité physique" a été déplacé vers "Informations Générales"
2. ✅ Le champ "Allergies alimentaires" a été remplacé par une liste de 14 cases à cocher (allergènes officiels UE)
3. ✅ Une option "Autre" avec champ conditionnel a été ajoutée
4. ✅ Le code a été déployé sur GitHub
5. 🔄 Le déploiement sur Netlify est en cours

**Prochaine étape :** Tester l'application en production une fois le déploiement Netlify terminé (environ 2-3 minutes).

---

**Auteur :** Manus AI  
**Date de création :** 5 octobre 2025  
**Version :** 1.0
