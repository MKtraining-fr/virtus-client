# 🧩 Guide Rapide des Composants UI

Guide pratique pour utiliser les composants du design system Virtus.

---

## 📦 Installation

```tsx
import { Button, Card, Input, Badge, Modal } from '@/components/ui';
```

---

## 🔘 Button

### Variants

```tsx
// Primary (défaut)
<Button variant="primary">Action principale</Button>

// Secondary
<Button variant="secondary">Action secondaire</Button>

// Outline
<Button variant="outline">Action tertiaire</Button>

// Ghost
<Button variant="ghost">Action discrète</Button>

// Danger
<Button variant="danger">Supprimer</Button>
```

### Tailles

```tsx
<Button size="sm">Petit</Button>
<Button size="md">Moyen</Button>
<Button size="lg">Grand</Button>
```

### Avec Icône

```tsx
import { Plus, Save, Trash } from 'lucide-react';

<Button icon={<Plus />}>Ajouter</Button>
<Button icon={<Save />} variant="secondary">Enregistrer</Button>
<Button icon={<Trash />} variant="danger">Supprimer</Button>
```

### États

```tsx
// Loading
<Button loading>Chargement...</Button>

// Disabled
<Button disabled>Désactivé</Button>

// Full Width
<Button fullWidth>Pleine largeur</Button>
```

---

## 🃏 Card

### Variants

```tsx
// Default
<Card variant="default">
  <p>Carte standard</p>
</Card>

// Elevated (avec ombre)
<Card variant="elevated">
  <p>Carte avec ombre</p>
</Card>

// Outlined
<Card variant="outlined">
  <p>Carte avec bordure</p>
</Card>

// Glass (effet glassmorphism)
<Card variant="glass">
  <p>Carte transparente</p>
</Card>
```

### Padding

```tsx
<Card padding="none">Pas de padding</Card>
<Card padding="sm">Petit padding</Card>
<Card padding="md">Padding moyen</Card>
<Card padding="lg">Grand padding</Card>
```

### Clickable

```tsx
<Card clickable onClick={() => console.log('Cliqué')}>
  <p>Carte cliquable</p>
</Card>
```

### Classes Personnalisées

```tsx
<Card className="bg-gradient-to-br from-brand-600 to-brand-500">
  <p className="text-white">Carte avec gradient</p>
</Card>
```

---

## 📝 Input

### Types de Base

```tsx
<Input type="text" placeholder="Nom" />
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Mot de passe" />
<Input type="number" placeholder="Âge" />
```

### Avec Label

```tsx
<Input
  type="email"
  label="Adresse email"
  placeholder="votre@email.com"
/>
```

### Avec Icône

```tsx
import { Mail, Lock, Search } from 'lucide-react';

<Input
  type="email"
  icon={<Mail size={18} />}
  placeholder="Email"
/>

<Input
  type="password"
  icon={<Lock size={18} />}
  placeholder="Mot de passe"
/>

<Input
  type="text"
  icon={<Search size={18} />}
  placeholder="Rechercher..."
/>
```

### Avec Erreur

```tsx
<Input
  type="email"
  label="Email"
  error="Email invalide"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Avec Texte d'Aide

```tsx
<Input
  type="password"
  label="Mot de passe"
  helperText="Au moins 8 caractères"
  placeholder="••••••••"
/>
```

### Full Width

```tsx
<Input
  type="text"
  placeholder="Rechercher..."
  fullWidth
/>
```

---

## 🏷️ Badge

### Variants Sémantiques

```tsx
<Badge variant="default">Par défaut</Badge>
<Badge variant="success">Succès</Badge>
<Badge variant="warning">Attention</Badge>
<Badge variant="error">Erreur</Badge>
<Badge variant="info">Info</Badge>
```

### Variants de Gamification

```tsx
<Badge variant="bronze">Bronze</Badge>
<Badge variant="silver">Argent</Badge>
<Badge variant="gold">Or</Badge>
<Badge variant="platinum">Platine</Badge>
<Badge variant="diamond">Diamant</Badge>
```

### Tailles

```tsx
<Badge size="sm">Petit</Badge>
<Badge size="md">Moyen</Badge>
<Badge size="lg">Grand</Badge>
```

### Avec Icône

```tsx
import { Check, AlertTriangle, X } from 'lucide-react';

<Badge variant="success" icon={<Check size={14} />}>
  Complété
</Badge>

<Badge variant="warning" icon={<AlertTriangle size={14} />}>
  Attention
</Badge>

<Badge variant="error" icon={<X size={14} />}>
  Échec
</Badge>
```

### Avec Dot

```tsx
<Badge variant="success" dot>En ligne</Badge>
<Badge variant="error" dot>Hors ligne</Badge>
```

---

## 🪟 Modal

### Modal Simple

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Titre de la modale"
>
  <p>Contenu de la modale</p>
</Modal>
```

### Avec Footer

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmation"
  footer={
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Annuler
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirmer
      </Button>
    </div>
  }
>
  <p>Êtes-vous sûr de vouloir continuer ?</p>
</Modal>
```

### Tailles

```tsx
<Modal size="sm">Petite modale</Modal>
<Modal size="md">Modale moyenne</Modal>
<Modal size="lg">Grande modale</Modal>
<Modal size="xl">Très grande modale</Modal>
<Modal size="full">Modale plein écran</Modal>
```

### Options

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Options"
  closeOnOverlayClick={false}  // Ne pas fermer au clic sur l'overlay
  showCloseButton={false}       // Cacher le bouton de fermeture
>
  <p>Contenu...</p>
</Modal>
```

---

## 🎨 Exemples de Compositions

### Carte de Produit

```tsx
<Card variant="elevated" padding="sm" clickable>
  <Badge variant="error" size="sm">-20%</Badge>
  
  <div className="bg-bg-secondary rounded-lg aspect-square flex items-center justify-center text-5xl mb-3">
    🥛
  </div>
  
  <h3 className="text-text-primary font-black text-sm mb-2">
    Whey Protein Isolate
  </h3>
  
  <div className="flex items-baseline gap-2 mb-3">
    <span className="text-text-primary text-lg font-black">49.99€</span>
    <span className="text-text-tertiary text-xs line-through">59.99€</span>
  </div>
  
  <Button variant="primary" size="sm" fullWidth>
    Ajouter au panier
  </Button>
</Card>
```

### Formulaire de Connexion

```tsx
import { Mail, Lock } from 'lucide-react';

<Card variant="elevated" padding="lg">
  <h2 className="text-2xl font-black text-text-primary mb-6">
    Connexion
  </h2>
  
  <div className="space-y-4">
    <Input
      type="email"
      label="Email"
      placeholder="votre@email.com"
      icon={<Mail size={18} />}
      fullWidth
    />
    
    <Input
      type="password"
      label="Mot de passe"
      placeholder="••••••••"
      icon={<Lock size={18} />}
      fullWidth
    />
    
    <Button variant="primary" size="lg" fullWidth>
      Se connecter
    </Button>
  </div>
</Card>
```

### Liste de Conversations

```tsx
{conversations.map((conv) => (
  <Card
    key={conv.id}
    variant="elevated"
    padding="md"
    clickable
    onClick={() => selectConversation(conv.id)}
  >
    <div className="flex items-start gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-2xl">
          {conv.avatar}
        </div>
        {conv.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-bg-primary rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-text-primary text-sm font-black truncate">
            {conv.name}
          </h3>
          <span className="text-[10px] text-text-tertiary">
            {conv.timestamp}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-text-secondary text-xs truncate flex-1">
            {conv.lastMessage}
          </p>
          {conv.unread > 0 && (
            <Badge variant="default" size="sm">
              {conv.unread}
            </Badge>
          )}
        </div>
      </div>
    </div>
  </Card>
))}
```

### KPI Card

```tsx
import { TrendingUp, Flame } from 'lucide-react';

<Card variant="elevated" padding="md">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Flame size={20} className="text-green-400" />
      <h3 className="text-text-primary font-black">Calories</h3>
    </div>
    <Badge variant="success">+12%</Badge>
  </div>
  
  <div className="flex items-baseline gap-2 mb-2">
    <span className="text-3xl font-black text-text-primary">
      1850
    </span>
    <span className="text-sm text-text-tertiary">
      / 2400 kcal
    </span>
  </div>
  
  <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all"
      style={{ width: '77%' }}
    />
  </div>
</Card>
```

---

## 🎯 Conseils d'Utilisation

### 1. Cohérence des Variants

Utilisez toujours les mêmes variants pour les mêmes actions :
- `primary` : Action principale (enregistrer, valider, ajouter)
- `secondary` : Action secondaire (annuler, retour)
- `danger` : Actions destructives (supprimer)

### 2. Hiérarchie Visuelle

Utilisez les tailles et variants pour créer une hiérarchie claire :
```tsx
<Button variant="primary" size="lg">Action principale</Button>
<Button variant="secondary" size="md">Action secondaire</Button>
<Button variant="ghost" size="sm">Action tertiaire</Button>
```

### 3. Espacement Cohérent

Utilisez toujours les mêmes espacements :
```tsx
<div className="space-y-4">  {/* Entre sections */}
  <Card padding="md">
    <div className="space-y-2">  {/* Entre éléments */}
      {/* Contenu */}
    </div>
  </Card>
</div>
```

### 4. Dark Mode

Toujours utiliser les tokens de couleur avec `dark:` :
```tsx
<p className="text-text-primary dark:text-text-primary">
  Texte qui s'adapte au mode sombre
</p>
```

### 5. Accessibilité

Toujours ajouter des labels et aria-labels :
```tsx
<Input
  type="email"
  label="Email"
  aria-label="Adresse email"
  placeholder="votre@email.com"
/>
```

---

## 📚 Ressources

- [Design System Complet](./DESIGN_SYSTEM.md)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Dernière mise à jour** : 2024-02-06
