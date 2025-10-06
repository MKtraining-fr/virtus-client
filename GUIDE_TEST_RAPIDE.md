# Guide de Test Rapide - Modifications du Bilan Initial

## 🚀 Accès à l'Application

**URL de production :** https://virtus-coaching.netlify.app

⏱️ **Temps d'attente :** Le déploiement Netlify prend environ 2-3 minutes après le push sur GitHub.

---

## ✅ Checklist de Test

### 1. Accéder au Nouveau Bilan

1. Connectez-vous à l'application Virtus
2. Cliquez sur "Nouveau Bilan" dans le menu
3. Vérifiez que le template "Bilan Initial" est sélectionné par défaut

---

### 2. Vérifier la Section "Informations Générales"

**Ce qui doit être visible :**

- [ ] Prénom
- [ ] Nom
- [ ] Date de naissance
- [ ] Sexe
- [ ] Taille (cm)
- [ ] Poids actuel (kg)
- [ ] Email
- [ ] Téléphone
- [ ] **Niveau d'activité physique** ⬅️ **NOUVEAU ICI !**

**Options du champ "Niveau d'activité physique" :**
- Sédentaire
- Légèrement actif
- Modérément actif
- Très actif
- Extrêmement actif

---

### 3. Vérifier la Section "Vie Quotidienne"

**Ce qui doit être visible :**

- [ ] Profession (seul champ de cette section)

**Ce qui NE doit PLUS être visible :**
- ❌ Niveau d'activité physique (déplacé vers "Informations Générales")

---

### 4. Vérifier la Section "Alimentation"

#### Champ "Allergies alimentaires"

**Format attendu :** Cases à cocher (checkbox)

**Liste des 15 options :**

1. [ ] Céréales contenant du gluten (blé, seigle, orge, avoine)
2. [ ] Crustacés
3. [ ] Œufs
4. [ ] Poisson
5. [ ] Arachides (cacahuètes)
6. [ ] Soja
7. [ ] Lait et produits laitiers
8. [ ] Fruits à coque (amandes, noisettes, noix, cajou, etc.)
9. [ ] Céleri
10. [ ] Moutarde
11. [ ] Graines de sésame
12. [ ] Sulfites
13. [ ] Lupin
14. [ ] Mollusques
15. [ ] **Autre**

---

### 5. Tester le Champ Conditionnel "Autre"

**Test 1 : Affichage du champ**
1. Cochez la case "Autre" dans les allergies
2. ✅ Un nouveau champ texte "Précisez autre allergie" doit apparaître immédiatement

**Test 2 : Masquage du champ**
1. Décochez la case "Autre"
2. ✅ Le champ "Précisez autre allergie" doit disparaître

**Test 3 : Saisie de données**
1. Cochez "Autre"
2. Saisissez du texte dans "Précisez autre allergie" (ex: "Kiwi")
3. ✅ Le texte doit rester visible tant que "Autre" est coché

---

### 6. Tester la Sélection Multiple

1. Cochez plusieurs allergies (ex: Œufs, Lait, Arachides)
2. ✅ Toutes les cases cochées doivent rester cochées
3. ✅ Vous devez pouvoir cocher/décocher n'importe quelle combinaison

---

### 7. Tester la Sauvegarde

1. Remplissez tous les champs obligatoires du bilan
2. Cochez quelques allergies (incluant "Autre" avec un texte)
3. Cliquez sur "Valider le Bilan"
4. ✅ Le bilan doit être sauvegardé sans erreur
5. Allez dans le profil du client créé
6. ✅ Les allergies cochées doivent être visibles dans les informations du client

---

## 🐛 Problèmes Potentiels

### Si le champ "Niveau d'activité physique" n'apparaît pas dans "Informations Générales"

**Cause possible :** Cache du navigateur

**Solution :**
1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Rechargez la page (Ctrl+F5)
3. Ou testez en navigation privée

---

### Si les cases à cocher ne s'affichent pas

**Cause possible :** Le déploiement Netlify n'est pas encore terminé

**Solution :**
1. Attendez 2-3 minutes supplémentaires
2. Rechargez la page
3. Vérifiez l'heure du dernier commit sur GitHub (doit être récent)

---

### Si le champ "Autre" ne s'affiche pas

**Cause possible :** Problème de logique conditionnelle

**Solution :**
1. Vérifiez que vous avez bien coché la case "Autre" (dernière option)
2. Rechargez la page
3. Si le problème persiste, contactez le support

---

## 📸 Captures d'Écran Attendues

### Section "Informations Générales"
```
┌─────────────────────────────────────────┐
│ Prénom: [__________]  Nom: [__________] │
│ Date de naissance: [__________]         │
│ Sexe: [Sélectionnez ▼]                  │
│ Taille (cm): [__________]               │
│ Poids actuel (kg): [__________]         │
│ Email: [__________]                     │
│ Téléphone: [__________]                 │
│ Niveau d'activité physique: [Select ▼] │ ⬅️ NOUVEAU !
└─────────────────────────────────────────┘
```

### Section "Alimentation" - Allergies
```
┌─────────────────────────────────────────┐
│ Allergies alimentaires                  │
│ ☐ Céréales contenant du gluten         │
│ ☐ Crustacés                             │
│ ☐ Œufs                                  │
│ ☐ Poisson                               │
│ ☐ Arachides (cacahuètes)                │
│ ☐ Soja                                  │
│ ☐ Lait et produits laitiers             │
│ ☐ Fruits à coque (amandes, ...)         │
│ ☐ Céleri                                │
│ ☐ Moutarde                              │
│ ☐ Graines de sésame                     │
│ ☐ Sulfites                              │
│ ☐ Lupin                                 │
│ ☐ Mollusques                            │
│ ☑ Autre                                 │ ⬅️ Coché
│                                         │
│ Précisez autre allergie                 │ ⬅️ Apparaît !
│ [Kiwi_________________________]         │
└─────────────────────────────────────────┘
```

---

## ✅ Validation Finale

Si tous les tests passent :

- ✅ Le champ "Niveau d'activité physique" est dans "Informations Générales"
- ✅ Les 15 options d'allergies s'affichent en cases à cocher
- ✅ Le champ "Autre" apparaît/disparaît correctement
- ✅ La sauvegarde fonctionne correctement

**🎉 Les modifications sont opérationnelles !**

---

## 📞 Support

En cas de problème, vérifiez :

1. Le déploiement Netlify est terminé (https://app.netlify.com)
2. Le dernier commit sur GitHub est bien `b5f131e`
3. Le cache du navigateur est vidé

**Documentation complète :** Voir `MODIFICATIONS_BILAN_INITIAL.md`

---

**Date :** 5 octobre 2025  
**Version :** 1.0
