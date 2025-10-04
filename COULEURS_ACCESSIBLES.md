# Guide des Couleurs Accessibles

## 📊 Ratios de Contraste WCAG

Pour être conforme au niveau AA des WCAG 2.1, les ratios de contraste suivants doivent être respectés :

| Type de texte | Ratio minimum |
|---------------|---------------|
| Texte normal (< 18pt) | 4.5:1 |
| Texte large (≥ 18pt ou ≥ 14pt gras) | 3:1 |
| Composants d'interface | 3:1 |

---

## 🎨 Palette de Couleurs Recommandée

### Couleurs Principales

**Violet Principal (Primary)**
- Couleur actuelle : `#8B5CF6` (violet-500)
- Contraste sur fond blanc : 4.54:1 ✅
- Contraste sur fond noir : 4.62:1 ✅
- **Recommandation** : Acceptable pour texte large, mais utiliser une teinte plus foncée pour texte normal.

**Violet Foncé (pour texte normal)**
- Couleur recommandée : `#6D28D9` (violet-700)
- Contraste sur fond blanc : 7.04:1 ✅
- **Usage** : Texte normal, liens, éléments importants

**Violet Très Foncé (pour texte sur fond clair)**
- Couleur recommandée : `#5B21B6` (violet-800)
- Contraste sur fond blanc : 9.24:1 ✅
- **Usage** : Titres, texte important

### Couleurs de Texte

**Texte Principal**
- Couleur actuelle : `#1F2937` (gray-800)
- Contraste sur fond blanc : 12.63:1 ✅
- **Recommandation** : Excellent, à conserver.

**Texte Secondaire**
- Couleur actuelle : `#6B7280` (gray-500)
- Contraste sur fond blanc : 4.69:1 ✅
- **Recommandation** : Acceptable pour texte normal, mais limite. Préférer `#4B5563` (gray-600) pour un meilleur contraste (7.00:1).

**Texte Subtil**
- Couleur actuelle : `#9CA3AF` (gray-400)
- Contraste sur fond blanc : 2.85:1 ❌
- **Recommandation** : Non conforme. Utiliser `#6B7280` (gray-500) minimum pour texte normal.

### Couleurs d'État

**Succès (Success)**
- Couleur recommandée : `#047857` (green-700)
- Contraste sur fond blanc : 5.45:1 ✅
- **Usage** : Messages de succès, badges, indicateurs

**Erreur (Error)**
- Couleur recommandée : `#DC2626` (red-600)
- Contraste sur fond blanc : 5.94:1 ✅
- **Usage** : Messages d'erreur, bordures d'erreur

**Avertissement (Warning)**
- Couleur recommandée : `#D97706` (amber-600)
- Contraste sur fond blanc : 4.54:1 ✅
- **Usage** : Messages d'avertissement, alertes

**Information (Info)**
- Couleur recommandée : `#0284C7` (sky-600)
- Contraste sur fond blanc : 5.08:1 ✅
- **Usage** : Messages informatifs, tooltips

### Couleurs de Fond

**Fond Principal**
- Couleur : `#FFFFFF` (white)
- **Usage** : Arrière-plan principal de l'application

**Fond Secondaire**
- Couleur : `#F9FAFB` (gray-50)
- **Usage** : Sections alternées, cartes

**Fond de Sidebar**
- Couleur actuelle : `#1F2937` (gray-800)
- **Recommandation** : Excellent pour contraste avec texte blanc.

---

## 🔧 Corrections à Apporter

### 1. Texte Gris Clair

**Problème** : Utilisation de `text-gray-400` pour du texte normal.

**Solution** : Remplacer par `text-gray-600` minimum.

**Exemple** :
```tsx
// Avant
<p className="text-gray-400">Texte secondaire</p>

// Après
<p className="text-gray-600">Texte secondaire</p>
```

### 2. Liens

**Problème** : Les liens n'ont pas toujours un contraste suffisant.

**Solution** : Utiliser `text-violet-700` pour les liens sur fond clair.

**Exemple** :
```tsx
// Avant
<a href="#" className="text-primary hover:underline">Lien</a>

// Après
<a href="#" className="text-violet-700 hover:text-violet-800 hover:underline">Lien</a>
```

### 3. Badges et Étiquettes

**Problème** : Certains badges ont un contraste insuffisant.

**Solution** : Utiliser des couleurs plus foncées ou ajouter une bordure.

**Exemple** :
```tsx
// Badge succès
<span className="bg-green-100 text-green-800 border border-green-200">
  Actif
</span>

// Badge erreur
<span className="bg-red-100 text-red-800 border border-red-200">
  Inactif
</span>
```

### 4. Boutons Secondaires

**Problème** : Les boutons secondaires peuvent avoir un contraste insuffisant.

**Solution** : Assurer un contraste minimum de 3:1 pour les bordures et le texte.

**Exemple** :
```tsx
<button className="border-2 border-gray-600 text-gray-700 hover:bg-gray-100">
  Bouton secondaire
</button>
```

---

## 🧪 Outils de Vérification

### WebAIM Contrast Checker

URL : https://webaim.org/resources/contrastchecker/

Permet de vérifier rapidement le ratio de contraste entre deux couleurs.

### Chrome DevTools

1. Inspectez un élément
2. Dans le panneau "Styles", cliquez sur le carré de couleur
3. Le ratio de contraste s'affiche avec une indication de conformité

### axe DevTools

Extension qui détecte automatiquement les problèmes de contraste dans la page.

---

## ✅ Checklist de Validation

- [ ] Tous les textes normaux ont un contraste ≥ 4.5:1
- [ ] Tous les textes larges ont un contraste ≥ 3:1
- [ ] Tous les boutons ont un contraste ≥ 3:1
- [ ] Tous les liens sont distinguables du texte environnant
- [ ] Les bordures des champs de formulaire ont un contraste ≥ 3:1
- [ ] Les icônes informatives ont un contraste ≥ 3:1
- [ ] Les messages d'erreur sont clairement visibles

---

**Date de création :** 4 octobre 2025  
**Auteur :** Manus AI
