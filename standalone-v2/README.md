# Virtus Standalone v2 - Design System

Cette version contient le design system complet et les composants réutilisables pour l'application Virtus.

## 📦 Contenu

- **12 composants UI** : Button, Card, Input, Badge, Modal, Select, Checkbox, Radio, Switch, Tabs, Tooltip, Progress
- **6 composants IronTrack** : NotesModal, VideoModal, NumberPicker, RestTimer, SetList, MetronomeModal
- **4 pages** : IronTrack, Nutrition, Shop, Messages
- **Documentation complète** : DESIGN_SYSTEM.md, COMPONENT_GUIDE.md, COMPONENT_GUIDE_ADVANCED.md

## 🚀 Utilisation

Les composants sont dans `src/components/ui/` et peuvent être importés ainsi :

```tsx
import { Button, Card, Input, Badge } from './components/ui';
```

## 📚 Documentation

- [Design System](./DESIGN_SYSTEM.md) - Spécifications complètes
- [Guide des Composants de Base](./COMPONENT_GUIDE.md)
- [Guide des Composants Avancés](./COMPONENT_GUIDE_ADVANCED.md)

## 🎨 Design Tokens

- **Primaire** : #38338e (brand-600)
- **Secondaire** : #7b6df2 (brand-500)
- **Dark mode** : Support complet
- **TypeScript** : Props typées
- **Accessibilité** : ARIA, focus, contraste
