# 🎨 Virtus Design System

Documentation complète du design system de l'application cliente Virtus.

---

## 📐 Principes de Design

### Vision
Créer une expérience utilisateur **moderne**, **ergonomique** et **motivante** pour les athlètes et clients de coaches sportifs.

### Valeurs
- **Clarté** : Interface lisible et intuitive
- **Performance** : Interactions rapides et fluides
- **Motivation** : Design énergique qui inspire l'action
- **Cohérence** : Expérience unifiée sur toutes les pages

---

## 🎨 Palette de Couleurs

### Couleurs Primaires

#### Brand (Violet)
```css
--brand-50:  #f5f3ff
--brand-100: #ede9fe
--brand-200: #ddd6fe
--brand-300: #c4b5fd
--brand-400: #a78bfa  /* Violet clair - secondaire */
--brand-500: #7b6df2  /* Violet principal */
--brand-600: #38338e  /* Violet foncé - primaire */
--brand-700: #2d2870
--brand-800: #231f57
--brand-900: #1a1742
```

**Utilisation** :
- `brand-600` : Couleur primaire principale (boutons, liens, éléments interactifs)
- `brand-500` : Couleur secondaire (hover, focus, accents)
- `brand-400` : Couleur tertiaire (icônes, badges)

### Couleurs Sémantiques

#### Success (Vert)
```css
--success-400: #4ade80
--success-500: #22c55e
--success-600: #16a34a
```
**Utilisation** : Validation, progression, objectifs atteints

#### Warning (Orange)
```css
--warning-400: #fb923c
--warning-500: #f97316
--warning-600: #ea580c
```
**Utilisation** : Alertes, attention, drop sets

#### Error (Rouge)
```css
--error-400: #f87171
--error-500: #ef4444
--error-600: #dc2626
```
**Utilisation** : Erreurs, échecs, suppressions

#### Info (Bleu)
```css
--info-400: #60a5fa
--info-500: #3b82f6
--info-600: #2563eb
```
**Utilisation** : Informations, nouveautés, notifications

### Couleurs de Gamification

#### Tiers
```css
--bronze:   #cd7f32
--silver:   #c0c0c0
--gold:     #ffd700
--platinum: #e5e4e2
--diamond:  #b9f2ff
```
**Utilisation** : Badges de progression, récompenses, classements

### Couleurs Neutres

#### Mode Clair
```css
--bg-primary:   #ffffff
--bg-secondary: #f9fafb
--bg-card:      #ffffff
--bg-hover:     #f3f4f6

--text-primary:   #111827
--text-secondary: #374151
--text-tertiary:  #6b7280

--border: #e5e7eb
```

#### Mode Sombre
```css
--bg-primary:   #0a0a0a
--bg-secondary: #18181b
--bg-card:      #27272a
--bg-hover:     #3f3f46

--text-primary:   #f9fafb
--text-secondary: #d1d5db
--text-tertiary:  #9ca3af

--border: #3f3f46
```

---

## 📝 Typographie

### Famille de Polices

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Échelle Typographique

#### Tailles
```css
text-xs:   0.75rem  (12px)
text-sm:   0.875rem (14px)
text-base: 1rem     (16px)
text-lg:   1.125rem (18px)
text-xl:   1.25rem  (20px)
text-2xl:  1.5rem   (24px)
text-3xl:  1.875rem (30px)
text-4xl:  2.25rem  (36px)
```

#### Poids
```css
font-light:  300
font-normal: 400
font-medium: 500
font-bold:   700
font-black:  900  /* Pour les titres et chiffres importants */
```

### Convention IronTrack

**Typographie spéciale pour les données d'entraînement** :
- `font-black` : Chiffres importants (poids, reps, calories)
- `font-mono` : Stats et métriques (tempo, durée)

**Exemple** :
```tsx
<span className="text-3xl font-black">82.5</span>
<span className="text-sm font-mono">3-0-1-0</span>
```

---

## 📏 Espacement

### Échelle d'Espacement

```css
spacing-0:  0
spacing-1:  0.25rem  (4px)
spacing-2:  0.5rem   (8px)
spacing-3:  0.75rem  (12px)
spacing-4:  1rem     (16px)
spacing-5:  1.25rem  (20px)
spacing-6:  1.5rem   (24px)
spacing-8:  2rem     (32px)
spacing-10: 2.5rem   (40px)
spacing-12: 3rem     (48px)
spacing-16: 4rem     (64px)
```

### Conventions
- **Padding de Card** : `p-4` (16px) par défaut
- **Gap entre éléments** : `gap-2` (8px) pour petits éléments, `gap-4` (16px) pour sections
- **Margin entre sections** : `space-y-4` (16px)

---

## 🎭 Ombres

### Échelle d'Ombres

```css
shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.05)
shadow:     0 1px 3px rgba(0, 0, 0, 0.1)
shadow-md:  0 4px 6px rgba(0, 0, 0, 0.1)
shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.1)
shadow-xl:  0 20px 25px rgba(0, 0, 0, 0.1)
shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25)
```

### Ombres Colorées

**Pour les boutons primaires** :
```css
shadow-[0_10px_40px_rgba(123,109,242,0.25)]
```

**Pour les éléments de succès** :
```css
shadow-[0_10px_60px_rgba(34,197,94,0.5)]
```

---

## 🎬 Animations

### Transitions

```css
transition-all:    all 150ms cubic-bezier(0.4, 0, 0.2, 1)
transition-colors: color, background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)
transition-transform: transform 150ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Animations Personnalisées

#### Fade In
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
```

#### Scale In
```css
@keyframes scale-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-scale-in {
  animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### Slide Up
```css
@keyframes slide-up {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

### Interactions

**Hover** :
```css
hover:scale-105
hover:bg-brand-700
```

**Active** :
```css
active:scale-95
active:translate-y-1
```

---

## 🧩 Composants

### Button

**Variants** :
- `primary` : Bouton principal (brand-600)
- `secondary` : Bouton secondaire (brand-500)
- `outline` : Bouton avec bordure
- `ghost` : Bouton transparent
- `danger` : Bouton de suppression (rouge)

**Tailles** :
- `sm` : Petit (py-2 px-3)
- `md` : Moyen (py-2.5 px-4)
- `lg` : Grand (py-3 px-6)

**Props** :
- `icon` : Icône Lucide React
- `loading` : État de chargement
- `fullWidth` : Largeur 100%
- `disabled` : Désactivé

**Exemple** :
```tsx
<Button variant="primary" size="lg" icon={<Plus />}>
  Ajouter un repas
</Button>
```

---

### Card

**Variants** :
- `default` : Carte standard
- `elevated` : Carte avec ombre
- `outlined` : Carte avec bordure
- `glass` : Effet glassmorphism

**Padding** :
- `none` : Pas de padding
- `sm` : Petit (p-3)
- `md` : Moyen (p-4)
- `lg` : Grand (p-6)

**Props** :
- `clickable` : Ajoute hover et cursor pointer
- `className` : Classes Tailwind additionnelles

**Exemple** :
```tsx
<Card variant="elevated" padding="md" clickable>
  <h3>Titre de la carte</h3>
  <p>Contenu...</p>
</Card>
```

---

### Input

**Types** :
- `text`, `number`, `email`, `password`

**Props** :
- `label` : Label au-dessus de l'input
- `error` : Message d'erreur
- `helperText` : Texte d'aide
- `icon` : Icône à gauche
- `fullWidth` : Largeur 100%

**Exemple** :
```tsx
<Input
  type="email"
  label="Email"
  placeholder="votre@email.com"
  icon={<Mail size={18} />}
  fullWidth
/>
```

---

### Badge

**Variants** :
- `default` : Badge par défaut (brand)
- `success` : Vert
- `warning` : Orange
- `error` : Rouge
- `info` : Bleu
- `bronze`, `silver`, `gold`, `platinum`, `diamond` : Tiers de gamification

**Tailles** :
- `sm` : Petit (px-2 py-0.5 text-xs)
- `md` : Moyen (px-2.5 py-1 text-sm)
- `lg` : Grand (px-3 py-1.5 text-base)

**Props** :
- `icon` : Icône Lucide React
- `dot` : Affiche un point coloré

**Exemple** :
```tsx
<Badge variant="success" size="sm" icon={<Check />}>
  Complété
</Badge>
```

---

### Modal

**Tailles** :
- `sm` : Petite (max-w-md)
- `md` : Moyenne (max-w-lg)
- `lg` : Grande (max-w-2xl)
- `xl` : Très grande (max-w-4xl)
- `full` : Plein écran (max-w-full)

**Props** :
- `isOpen` : État d'ouverture
- `onClose` : Fonction de fermeture
- `title` : Titre de la modale
- `footer` : Contenu du footer
- `closeOnOverlayClick` : Fermer au clic sur l'overlay
- `showCloseButton` : Afficher le bouton de fermeture

**Exemple** :
```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirmation"
  size="md"
>
  <p>Êtes-vous sûr de vouloir continuer ?</p>
</Modal>
```

---

## 🎯 Bonnes Pratiques

### Accessibilité

1. **Contraste** : Ratio minimum 4.5:1 pour le texte
2. **Focus** : Toujours visible avec `focus:ring-2 focus:ring-brand-500`
3. **Labels** : Toujours associer labels et inputs
4. **ARIA** : Utiliser les attributs ARIA pour les composants interactifs

### Performance

1. **Transitions** : Utiliser `transition-colors` plutôt que `transition-all` quand possible
2. **Images** : Toujours optimiser et lazy-load
3. **Animations** : Limiter à 60fps, utiliser `transform` et `opacity`

### Responsive

1. **Mobile First** : Design d'abord pour mobile
2. **Breakpoints** :
   - `sm`: 640px
   - `md`: 768px
   - `lg`: 1024px
   - `xl`: 1280px

### Dark Mode

1. Toujours utiliser les tokens de couleur avec `dark:` variant
2. Tester tous les composants en mode clair ET sombre
3. Utiliser `bg-bg-primary dark:bg-bg-primary` plutôt que des couleurs hardcodées

---

## 📦 Import des Composants

```tsx
import { Button, Card, Input, Badge, Modal } from '@/components/ui';
```

---

## 🚀 Roadmap

### Phase 1 : Composants de Base ✅
- Button, Card, Input, Badge, Modal

### Phase 2 : Composants Avancés (À venir)
- Select, Checkbox, Radio, Switch
- Tabs, Accordion, Tooltip
- Progress Bar, Skeleton Loader

### Phase 3 : Composants Métier (À venir)
- ExerciseCard, WorkoutCard
- NutritionCard, MealCard
- LeaderboardCard, AchievementBadge

---

## 📚 Ressources

- **Icônes** : [Lucide React](https://lucide.dev/)
- **Tailwind CSS** : [Documentation](https://tailwindcss.com/docs)
- **Inspiration** : Strava, MyFitnessPal, Nike Training Club

---

**Dernière mise à jour** : 2024-02-06
**Version** : 1.0.0
