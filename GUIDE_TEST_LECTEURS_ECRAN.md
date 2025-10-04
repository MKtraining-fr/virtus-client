# Guide de Test avec les Lecteurs d'Écran

## 📱 Lecteurs d'Écran Disponibles

### Windows

**NVDA (NonVisual Desktop Access)**
- **Prix** : Gratuit et open source
- **Téléchargement** : https://www.nvaccess.org/
- **Raccourci principal** : NVDA + N (ouvre le menu)
- **Recommandation** : Excellent pour les tests, très utilisé

**JAWS (Job Access With Speech)**
- **Prix** : Payant (~1000€)
- **Téléchargement** : https://www.freedomscientific.com/
- **Version d'essai** : 40 minutes par session
- **Recommandation** : Le plus utilisé professionnellement

### macOS

**VoiceOver**
- **Prix** : Gratuit, intégré à macOS
- **Activation** : Cmd + F5
- **Recommandation** : Excellent pour les tests sur Mac

### iOS

**VoiceOver**
- **Prix** : Gratuit, intégré à iOS
- **Activation** : Réglages > Accessibilité > VoiceOver
- **Recommandation** : Essentiel pour tester sur iPhone/iPad

### Android

**TalkBack**
- **Prix** : Gratuit, intégré à Android
- **Activation** : Réglages > Accessibilité > TalkBack
- **Recommandation** : Essentiel pour tester sur Android

---

## 🧪 Checklist de Test NVDA (Windows)

### Installation et Configuration

1. Téléchargez et installez NVDA depuis https://www.nvaccess.org/
2. Lancez NVDA (Ctrl + Alt + N)
3. Ouvrez l'application Virtus dans Chrome ou Firefox

### Commandes de Base NVDA

| Commande | Action |
|----------|--------|
| NVDA + Q | Quitter NVDA |
| NVDA + N | Ouvrir le menu NVDA |
| Flèche bas/haut | Lire ligne suivante/précédente |
| Tab / Shift+Tab | Naviguer entre les éléments interactifs |
| Enter / Espace | Activer un élément |
| H / Shift+H | Naviguer entre les titres |
| B / Shift+B | Naviguer entre les boutons |
| F / Shift+F | Naviguer entre les champs de formulaire |
| K / Shift+K | Naviguer entre les liens |

### Tests à Effectuer

**1. Navigation Globale**
- [ ] Tous les éléments interactifs sont annoncés
- [ ] L'ordre de lecture est logique
- [ ] Les titres sont correctement annoncés (h1, h2, etc.)
- [ ] Les liens sont distinguables du texte normal

**2. Formulaires**
- [ ] Tous les champs ont un label annoncé
- [ ] Les erreurs de validation sont annoncées
- [ ] Les messages de succès sont annoncés
- [ ] Les champs obligatoires sont indiqués

**3. Boutons et Actions**
- [ ] Tous les boutons ont un label clair
- [ ] Les icônes seules ont un texte alternatif
- [ ] L'état des boutons est annoncé (activé/désactivé)
- [ ] Les boutons de chargement sont annoncés

**4. Tableaux**
- [ ] Les en-têtes de colonnes sont annoncés
- [ ] La navigation dans le tableau est fluide
- [ ] Le nombre de lignes/colonnes est annoncé

**5. Modales**
- [ ] L'ouverture de la modale est annoncée
- [ ] Le focus est piégé dans la modale
- [ ] Le titre de la modale est annoncé
- [ ] La fermeture de la modale est annoncée

**6. Messages Dynamiques**
- [ ] Les messages de succès sont annoncés automatiquement
- [ ] Les messages d'erreur sont annoncés automatiquement
- [ ] Les changements de contenu sont annoncés

---

## 🧪 Checklist de Test VoiceOver (macOS)

### Activation et Configuration

1. Appuyez sur Cmd + F5 pour activer VoiceOver
2. Ouvrez l'application Virtus dans Safari ou Chrome

### Commandes de Base VoiceOver

| Commande | Action |
|----------|--------|
| Cmd + F5 | Activer/Désactiver VoiceOver |
| VO + Flèches | Naviguer (VO = Ctrl + Alt) |
| VO + Espace | Activer un élément |
| VO + A | Lire tout |
| VO + H | Naviguer entre les titres |
| VO + J | Naviguer entre les champs de formulaire |
| VO + Cmd + H | Naviguer entre les liens |

### Tests à Effectuer

Utilisez la même checklist que pour NVDA ci-dessus.

---

## 🧪 Checklist de Test Mobile

### iOS VoiceOver

**Activation**
1. Réglages > Accessibilité > VoiceOver > Activer
2. Ou triple-clic sur le bouton latéral (si configuré)

**Gestes de Base**
- **Toucher** : Lire l'élément
- **Double-tap** : Activer l'élément
- **Balayer à droite/gauche** : Élément suivant/précédent
- **Balayer à haut/bas** : Ajuster le rotor
- **Pincer à 2 doigts** : Arrêter la lecture

**Tests Spécifiques Mobile**
- [ ] La navigation tactile est fluide
- [ ] Les boutons ont une taille tactile suffisante
- [ ] Les gestes sont bien interprétés
- [ ] L'orientation portrait/paysage fonctionne

### Android TalkBack

**Activation**
1. Réglages > Accessibilité > TalkBack > Activer
2. Ou maintenir les deux boutons de volume enfoncés

**Gestes de Base**
- **Toucher** : Lire l'élément
- **Double-tap** : Activer l'élément
- **Balayer à droite/gauche** : Élément suivant/précédent
- **Balayer à bas puis droite** : Menu contextuel

**Tests Spécifiques Mobile**
- Utilisez la même checklist que pour iOS ci-dessus

---

## 🐛 Problèmes Courants et Solutions

### Problème : Les boutons avec icônes ne sont pas annoncés

**Solution** : Ajouter un `aria-label` ou utiliser le composant `VisuallyHidden`.

```tsx
// Avant
<button><IconTrash /></button>

// Après
<button aria-label="Supprimer">
  <IconTrash />
</button>

// Ou
<button>
  <IconTrash />
  <VisuallyHidden>Supprimer</VisuallyHidden>
</button>
```

### Problème : Les messages d'erreur ne sont pas annoncés

**Solution** : Utiliser le composant `LiveRegion` avec `role="alert"`.

```tsx
{error && (
  <LiveRegion politeness="assertive" role="alert">
    {error}
  </LiveRegion>
)}
```

### Problème : Le focus n'est pas visible

**Solution** : Ajouter un style de focus clair.

```css
:focus {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}
```

### Problème : Les champs de formulaire n'ont pas de label

**Solution** : Associer un label avec l'attribut `for`.

```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

---

## ✅ Validation Finale

Une fois tous les tests effectués, validez que :

1. ✅ Toute l'application est navigable au clavier
2. ✅ Tous les éléments interactifs sont annoncés clairement
3. ✅ Les formulaires sont utilisables avec un lecteur d'écran
4. ✅ Les messages d'erreur et de succès sont annoncés
5. ✅ Les modales gèrent correctement le focus
6. ✅ Les tableaux sont navigables et compréhensibles
7. ✅ L'ordre de lecture est logique
8. ✅ Les images ont un texte alternatif approprié

---

**Date de création :** 4 octobre 2025  
**Auteur :** Manus AI
