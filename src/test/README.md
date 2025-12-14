# Tests Automatisés - Virtus

Ce dossier contient les tests automatisés pour garantir la non-régression des corrections apportées.

## 🎯 Objectif

Les tests automatisés permettent de :
- **Détecter les régressions** avant qu'elles n'arrivent en production
- **Documenter le comportement attendu** du code
- **Faciliter les refactorings** en toute confiance
- **Améliorer la qualité** du code

## 📦 Structure

```
src/
├── test/
│   ├── setup.ts                          # Configuration Vitest
│   └── README.md                         # Ce fichier
├── services/
│   └── clientProgramProgressService.test.ts  # Tests du service de progression
├── utils/
│   └── progressionLogic.test.ts          # Tests de la logique de progression
└── integration/
    └── sessionCompletion.test.ts         # Tests d'intégration de la complétion
```

## 🧪 Types de Tests

### 1. Tests Unitaires

**Fichiers** :
- `src/services/clientProgramProgressService.test.ts`
- `src/utils/progressionLogic.test.ts`

**Ce qu'ils testent** :
- Les fonctions individuelles fonctionnent correctement
- Les cas limites sont gérés
- Les erreurs sont gérées proprement

### 2. Tests d'Intégration

**Fichiers** :
- `src/integration/sessionCompletion.test.ts`

**Ce qu'ils testent** :
- Le flux complet de complétion d'une séance
- L'interaction entre plusieurs composants
- La fonction RPC `complete_client_session_atomic`
- La vue SQL `client_program_progress`

## 🚀 Exécuter les Tests

### Tous les tests
```bash
pnpm test
```

### Tests en mode watch (re-exécute automatiquement)
```bash
pnpm test:watch
```

### Tests avec UI interactive
```bash
pnpm test:ui
```

### Tests avec coverage
```bash
pnpm test:coverage
```

### Un fichier spécifique
```bash
pnpm test src/services/clientProgramProgressService.test.ts
```

## 📊 Coverage

Le coverage est configuré pour exclure :
- `node_modules/`
- `src/test/`
- `**/*.d.ts`
- `**/*.config.*`
- `**/mockData`
- `**/constants`

Pour voir le rapport de coverage :
```bash
pnpm test:coverage
```

Le rapport HTML sera généré dans `coverage/index.html`.

## ✅ Tests Critiques

### 1. Progression des Séances

**Fichier** : `src/utils/progressionLogic.test.ts`

**Ce qui est testé** :
- ✅ Passer à la séance suivante dans la même semaine
- ✅ Passer à la semaine suivante après avoir complété toutes les séances
- ✅ Rester à la dernière semaine si le programme est terminé
- ✅ Gérer correctement une semaine avec 1 seule séance
- ✅ Gérer correctement une semaine avec 4 séances
- ✅ Valeurs consécutives pour `session_order` (1, 2, 3...) et non (1, 56, 93, 175...)

### 2. Service de Progression

**Fichier** : `src/services/clientProgramProgressService.test.ts`

**Ce qui est testé** :
- ✅ Récupérer la progression pour un assignment donné
- ✅ Récupérer la progression de tous les clients d'un coach
- ✅ Récupérer la progression d'un client spécifique
- ✅ Gérer les erreurs proprement

### 3. Complétion de Séance

**Fichier** : `src/integration/sessionCompletion.test.ts`

**Ce qui est testé** :
- ✅ Terminer une séance avec succès
- ✅ Retourner une erreur si la séance est déjà complétée
- ✅ Gérer les erreurs de type UUID
- ✅ Mettre à jour la progression après complétion
- ✅ Pas de doublons lors de la complétion

## 🐛 Bugs Prévenus

Ces tests préviennent les bugs suivants (identifiés dans les PRs #289, #290, #291) :

1. **Erreur 406** lors de la sauvegarde des performances
2. **Modal de validation** qui disparaît
3. **Œil** qui reste vert au lieu de devenir rouge
4. **Tableau d'historique** pas à jour
5. **Séances qui se dupliquent** (5/4, 6/4...)
6. **Progression qui ne se met pas à jour**
7. **Valeurs non consécutives** pour `session_order`

## 📝 Ajouter de Nouveaux Tests

### 1. Créer un fichier de test

```typescript
// src/monComposant.test.ts
import { describe, it, expect } from 'vitest';

describe('MonComposant', () => {
  it('devrait faire quelque chose', () => {
    expect(true).toBe(true);
  });
});
```

### 2. Utiliser les mocks

```typescript
import { vi } from 'vitest';

vi.mock('../services/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));
```

### 3. Tester les composants React

```typescript
import { render, screen } from '@testing-library/react';
import MonComposant from './MonComposant';

it('devrait afficher le texte', () => {
  render(<MonComposant />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## 🔗 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## 🎯 Objectif de Coverage

**Cible** : 80% de coverage pour les fichiers critiques

**Fichiers prioritaires** :
- Services (`src/services/`)
- Hooks (`src/hooks/`)
- Utils (`src/utils/`)
- Logique métier critique

**Fichiers exclus** :
- Composants UI purs (pour l'instant)
- Fichiers de configuration
- Constantes et types
