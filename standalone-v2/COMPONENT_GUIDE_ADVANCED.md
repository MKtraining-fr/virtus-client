# 🧩 Guide des Composants Avancés

Guide pratique pour utiliser les composants avancés du design system Virtus.

---

## 📦 Installation

```tsx
import { 
  Select, Checkbox, Radio, Switch, 
  Tabs, Tooltip, Progress 
} from '@/components/ui';
```

---

## 📋 Select

### Select Simple

```tsx
const [value, setValue] = useState('');

<Select
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]}
  value={value}
  onChange={setValue}
  placeholder="Choisir une option"
/>
```

### Select avec Recherche

```tsx
<Select
  options={countries}
  value={selectedCountry}
  onChange={setSelectedCountry}
  placeholder="Sélectionner un pays"
  searchable
  fullWidth
/>
```

### Select avec Label et Erreur

```tsx
<Select
  label="Catégorie"
  options={categories}
  value={category}
  onChange={setCategory}
  error={errors.category}
  fullWidth
/>
```

### Options Désactivées

```tsx
<Select
  options={[
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Argent' },
    { value: 'gold', label: 'Or', disabled: true },
    { value: 'platinum', label: 'Platine', disabled: true },
  ]}
  value={tier}
  onChange={setTier}
/>
```

---

## ☑️ Checkbox

### Checkbox Simple

```tsx
const [accepted, setAccepted] = useState(false);

<Checkbox
  checked={accepted}
  onChange={setAccepted}
  label="J'accepte les conditions d'utilisation"
/>
```

### Checkbox avec Texte d'Aide

```tsx
<Checkbox
  checked={newsletter}
  onChange={setNewsletter}
  label="Recevoir la newsletter"
  helperText="Recevez nos conseils d'entraînement chaque semaine"
/>
```

### Checkbox Indéterminé

```tsx
<Checkbox
  checked={allSelected}
  onChange={handleSelectAll}
  indeterminate={someSelected}
  label="Tout sélectionner"
/>
```

### Checkbox avec Erreur

```tsx
<Checkbox
  checked={terms}
  onChange={setTerms}
  label="Accepter les CGU"
  error="Vous devez accepter les conditions"
/>
```

---

## 🔘 Radio

### Radio Vertical

```tsx
const [plan, setPlan] = useState('basic');

<Radio
  name="subscription-plan"
  options={[
    { value: 'basic', label: 'Basique', helperText: '9.99€/mois' },
    { value: 'pro', label: 'Pro', helperText: '19.99€/mois' },
    { value: 'premium', label: 'Premium', helperText: '29.99€/mois' },
  ]}
  value={plan}
  onChange={setPlan}
  label="Choisir un plan"
/>
```

### Radio Horizontal

```tsx
<Radio
  name="gender"
  options={[
    { value: 'male', label: 'Homme' },
    { value: 'female', label: 'Femme' },
    { value: 'other', label: 'Autre' },
  ]}
  value={gender}
  onChange={setGender}
  orientation="horizontal"
/>
```

### Radio avec Options Désactivées

```tsx
<Radio
  name="level"
  options={[
    { value: 'beginner', label: 'Débutant' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'advanced', label: 'Avancé', disabled: true },
  ]}
  value={level}
  onChange={setLevel}
/>
```

---

## 🔀 Switch

### Switch Simple

```tsx
const [enabled, setEnabled] = useState(false);

<Switch
  checked={enabled}
  onChange={setEnabled}
  label="Activer les notifications"
/>
```

### Switch avec Texte d'Aide

```tsx
<Switch
  checked={darkMode}
  onChange={setDarkMode}
  label="Mode sombre"
  helperText="Activer le thème sombre pour réduire la fatigue oculaire"
/>
```

### Tailles de Switch

```tsx
<Switch size="sm" checked={value1} onChange={setValue1} label="Petit" />
<Switch size="md" checked={value2} onChange={setValue2} label="Moyen" />
<Switch size="lg" checked={value3} onChange={setValue3} label="Grand" />
```

---

## 📑 Tabs

### Tabs Default

```tsx
const [activeTab, setActiveTab] = useState('overview');

<Tabs
  tabs={[
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'stats', label: 'Statistiques' },
    { id: 'history', label: 'Historique' },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### Tabs Pills

```tsx
<Tabs
  variant="pills"
  tabs={[
    { id: 'all', label: 'Tous', badge: 24 },
    { id: 'active', label: 'Actifs', badge: 12 },
    { id: 'completed', label: 'Terminés', badge: 12 },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### Tabs avec Icônes

```tsx
import { Home, TrendingUp, User } from 'lucide-react';

<Tabs
  variant="pills"
  tabs={[
    { id: 'home', label: 'Accueil', icon: <Home size={16} /> },
    { id: 'stats', label: 'Stats', icon: <TrendingUp size={16} /> },
    { id: 'profile', label: 'Profil', icon: <User size={16} /> },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  fullWidth
/>
```

### Tabs Underline

```tsx
<Tabs
  variant="underline"
  tabs={[
    { id: 'details', label: 'Détails' },
    { id: 'reviews', label: 'Avis', badge: 42 },
    { id: 'faq', label: 'FAQ' },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

---

## 💬 Tooltip

### Tooltip Top (défaut)

```tsx
<Tooltip content="Cliquez pour modifier">
  <button>Modifier</button>
</Tooltip>
```

### Tooltip avec Positions

```tsx
<Tooltip content="En haut" position="top">
  <button>Top</button>
</Tooltip>

<Tooltip content="En bas" position="bottom">
  <button>Bottom</button>
</Tooltip>

<Tooltip content="À gauche" position="left">
  <button>Left</button>
</Tooltip>

<Tooltip content="À droite" position="right">
  <button>Right</button>
</Tooltip>
```

### Tooltip avec Délai

```tsx
<Tooltip content="Tooltip avec délai de 500ms" delay={500}>
  <button>Hover me</button>
</Tooltip>
```

### Tooltip avec Contenu Riche

```tsx
<Tooltip 
  content={
    <div>
      <p className="font-bold">Astuce</p>
      <p className="text-xs">Utilisez Ctrl+S pour enregistrer</p>
    </div>
  }
>
  <button>Enregistrer</button>
</Tooltip>
```

---

## 📊 Progress

### Progress Simple

```tsx
<Progress value={75} />
```

### Progress avec Label

```tsx
<Progress 
  value={850} 
  max={1000}
  label="Calories"
  showLabel
/>
```

### Progress Variants

```tsx
<Progress value={100} variant="success" label="Complété" showLabel />
<Progress value={75} variant="warning" label="En cours" showLabel />
<Progress value={25} variant="error" label="Faible" showLabel />
<Progress value={50} variant="gradient" label="Progression" showLabel />
```

### Progress Tailles

```tsx
<Progress value={50} size="sm" />
<Progress value={50} size="md" />
<Progress value={50} size="lg" />
```

### Progress Animé

```tsx
<Progress 
  value={45} 
  animated 
  label="Chargement..." 
  showLabel 
/>
```

---

## 🎨 Exemples de Compositions

### Formulaire de Paramètres

```tsx
import { Card, Switch, Select, Button } from '@/components/ui';

<Card variant="elevated" padding="lg">
  <h2 className="text-xl font-black text-text-primary mb-6">
    Paramètres
  </h2>
  
  <div className="space-y-6">
    <Switch
      checked={notifications}
      onChange={setNotifications}
      label="Notifications push"
      helperText="Recevoir des notifications sur votre appareil"
    />
    
    <Switch
      checked={darkMode}
      onChange={setDarkMode}
      label="Mode sombre"
      helperText="Activer le thème sombre"
    />
    
    <Select
      label="Langue"
      options={[
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
      ]}
      value={language}
      onChange={setLanguage}
      fullWidth
    />
    
    <Button variant="primary" size="lg" fullWidth>
      Enregistrer
    </Button>
  </div>
</Card>
```

### Filtres avec Tabs et Checkboxes

```tsx
import { Card, Tabs, Checkbox, Button } from '@/components/ui';

<Card variant="elevated" padding="md">
  <Tabs
    variant="pills"
    tabs={[
      { id: 'all', label: 'Tous' },
      { id: 'equipment', label: 'Équipement' },
      { id: 'bodyweight', label: 'Poids du corps' },
    ]}
    activeTab={activeTab}
    onChange={setActiveTab}
    fullWidth
  />
  
  <div className="mt-4 space-y-2">
    <Checkbox
      checked={filters.chest}
      onChange={(checked) => setFilters({ ...filters, chest: checked })}
      label="Pectoraux"
    />
    <Checkbox
      checked={filters.back}
      onChange={(checked) => setFilters({ ...filters, back: checked })}
      label="Dos"
    />
    <Checkbox
      checked={filters.legs}
      onChange={(checked) => setFilters({ ...filters, legs: checked })}
      label="Jambes"
    />
  </div>
  
  <Button variant="primary" size="md" fullWidth className="mt-4">
    Appliquer les filtres
  </Button>
</Card>
```

### Progression avec Progress Bars

```tsx
import { Card, Progress, Badge } from '@/components/ui';

<Card variant="elevated" padding="md">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-black text-text-primary">
      Objectifs de la semaine
    </h3>
    <Badge variant="success">3/5</Badge>
  </div>
  
  <div className="space-y-4">
    <Progress 
      value={100} 
      variant="success" 
      label="Lundi - Pectoraux" 
      showLabel 
    />
    <Progress 
      value={100} 
      variant="success" 
      label="Mercredi - Dos" 
      showLabel 
    />
    <Progress 
      value={100} 
      variant="success" 
      label="Vendredi - Jambes" 
      showLabel 
    />
    <Progress 
      value={0} 
      variant="default" 
      label="Samedi - Épaules" 
      showLabel 
    />
    <Progress 
      value={0} 
      variant="default" 
      label="Dimanche - Bras" 
      showLabel 
    />
  </div>
</Card>
```

### Sélection de Plan avec Radio

```tsx
import { Card, Radio, Button, Badge } from '@/components/ui';

<Card variant="elevated" padding="lg">
  <h2 className="text-2xl font-black text-text-primary mb-6">
    Choisir votre plan
  </h2>
  
  <Radio
    name="plan"
    options={[
      { 
        value: 'basic', 
        label: 'Basique', 
        helperText: '9.99€/mois - Programmes de base' 
      },
      { 
        value: 'pro', 
        label: 'Pro', 
        helperText: '19.99€/mois - Programmes avancés + Nutrition' 
      },
      { 
        value: 'premium', 
        label: 'Premium', 
        helperText: '29.99€/mois - Tout inclus + Coach personnel' 
      },
    ]}
    value={selectedPlan}
    onChange={setSelectedPlan}
  />
  
  <div className="flex gap-2 mt-6">
    <Button variant="outline" fullWidth>
      Annuler
    </Button>
    <Button variant="primary" fullWidth>
      Continuer
    </Button>
  </div>
</Card>
```

---

## 🎯 Conseils d'Utilisation

### 1. Select vs Radio
- **Select** : Plus de 5 options ou recherche nécessaire
- **Radio** : 2-5 options visibles en permanence

### 2. Checkbox vs Switch
- **Checkbox** : Sélection multiple ou action à valider
- **Switch** : Activation/désactivation immédiate

### 3. Tabs Variants
- **default** : Navigation principale de page
- **pills** : Filtres ou catégories
- **underline** : Navigation secondaire

### 4. Progress Variants
- **success** : Objectif atteint (100%)
- **warning** : En cours (50-99%)
- **error** : Faible progression (<50%)
- **gradient** : Progression générale

### 5. Tooltip Position
- **top/bottom** : Éléments horizontaux (boutons, liens)
- **left/right** : Éléments verticaux (sidebars, menus)

---

## 📚 Ressources

- [Design System Complet](./DESIGN_SYSTEM.md)
- [Guide des Composants de Base](./COMPONENT_GUIDE.md)
- [Lucide Icons](https://lucide.dev/)

---

**Dernière mise à jour** : 2024-02-06
