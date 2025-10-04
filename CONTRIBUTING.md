# Guide de Contribution

Merci de votre intérêt pour contribuer à **Virtus** ! Ce guide vous aidera à comprendre comment contribuer efficacement au projet.

---

## 📋 Table des Matières

1. [Code de Conduite](#code-de-conduite)
2. [Comment Contribuer](#comment-contribuer)
3. [Configuration de l'Environnement](#configuration-de-lenvironnement)
4. [Standards de Code](#standards-de-code)
5. [Processus de Pull Request](#processus-de-pull-request)
6. [Conventions de Commit](#conventions-de-commit)
7. [Tests](#tests)

---

## 📜 Code de Conduite

En participant à ce projet, vous vous engagez à respecter un environnement ouvert et accueillant. Soyez respectueux, constructif et professionnel dans toutes vos interactions.

---

## 🤝 Comment Contribuer

### Signaler un Bug

Si vous trouvez un bug, veuillez créer une issue sur GitHub avec les informations suivantes :

- **Description claire du problème**
- **Étapes pour reproduire le bug**
- **Comportement attendu vs comportement observé**
- **Captures d'écran** (si applicable)
- **Environnement** (navigateur, OS, version)

### Proposer une Fonctionnalité

Pour proposer une nouvelle fonctionnalité :

1. Vérifiez qu'une issue similaire n'existe pas déjà
2. Créez une issue avec le label `enhancement`
3. Décrivez clairement la fonctionnalité et son utilité
4. Attendez l'approbation avant de commencer le développement

### Contribuer au Code

1. Forkez le repository
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Développez votre fonctionnalité
4. Testez votre code
5. Commitez vos changements
6. Poussez vers votre fork
7. Créez une Pull Request

---

## ⚙️ Configuration de l'Environnement

### Prérequis

- **Node.js** : v18 ou supérieur
- **npm** : v9 ou supérieur
- **Git** : Dernière version

### Installation

```bash
# Cloner le repository
git clone https://github.com/MKtraining-fr/virtus.git
cd virtus

# Installer les dépendances
npm install

# Configurer Firebase (voir README.md)
# Créer un fichier .env avec vos clés Firebase

# Lancer le serveur de développement
npm run dev
```

### Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile l'application pour la production |
| `npm run preview` | Prévisualise le build de production |
| `npm test` | Lance les tests en mode watch |
| `npm run test:run` | Lance les tests une fois |
| `npm run test:coverage` | Génère un rapport de couverture |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs ESLint |
| `npm run format` | Formate le code avec Prettier |
| `npm run format:check` | Vérifie le formatage du code |
| `npm run type-check` | Vérifie les types TypeScript |
| `npm run quality` | Lance tous les checks de qualité |

---

## 📝 Standards de Code

### TypeScript

- Utilisez **TypeScript** pour tout le code
- Définissez des types explicites pour les props, les états et les fonctions
- Évitez `any` autant que possible

### React

- Utilisez des **composants fonctionnels** avec des hooks
- Utilisez `React.memo` pour les composants qui se re-rendent souvent
- Utilisez `useMemo` et `useCallback` pour optimiser les performances

### Nommage

- **Composants** : PascalCase (`Button`, `ClientDashboard`)
- **Fichiers de composants** : PascalCase (`Button.tsx`, `ClientDashboard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useAuth`, `useFocusTrap`)
- **Utilitaires** : camelCase (`formatDate`, `calculateBMI`)
- **Constants** : UPPER_SNAKE_CASE (`API_URL`, `MAX_FILE_SIZE`)

### Structure des Fichiers

```
src/
├── components/       # Composants réutilisables
├── pages/           # Pages de l'application
├── hooks/           # Hooks personnalisés
├── context/         # Contextes React
├── services/        # Services (API, Firebase, etc.)
├── utils/           # Fonctions utilitaires
├── validation/      # Schémas de validation
├── constants/       # Constantes et configurations
└── types.ts         # Types TypeScript globaux
```

### Accessibilité

- Ajoutez des attributs ARIA appropriés
- Assurez-vous que tous les éléments interactifs sont accessibles au clavier
- Vérifiez les contrastes de couleurs (ratio minimum 4.5:1)
- Testez avec un lecteur d'écran

---

## 🔄 Processus de Pull Request

### Avant de Soumettre

1. ✅ Assurez-vous que le code compile sans erreur
2. ✅ Lancez `npm run quality` et corrigez toutes les erreurs
3. ✅ Ajoutez des tests pour votre code
4. ✅ Mettez à jour la documentation si nécessaire
5. ✅ Vérifiez que votre branche est à jour avec `main`

### Soumettre une Pull Request

1. Donnez un titre clair et descriptif
2. Décrivez les changements apportés
3. Référencez les issues liées (ex: `Fixes #123`)
4. Ajoutez des captures d'écran si pertinent
5. Attendez la revue de code

### Revue de Code

- Soyez ouvert aux suggestions
- Répondez aux commentaires de manière constructive
- Apportez les modifications demandées
- Une fois approuvée, votre PR sera mergée

---

## 📝 Conventions de Commit

Nous utilisons des **commits conventionnels** pour maintenir un historique clair :

### Format

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Modification de la documentation
- `style`: Changement de style (formatage, etc.)
- `refactor`: Refactorisation du code
- `test`: Ajout ou modification de tests
- `chore`: Tâches de maintenance

### Exemples

```bash
feat(auth): ajouter la réinitialisation de mot de passe

fix(dashboard): corriger l'affichage des statistiques

docs(readme): mettre à jour les instructions d'installation

test(button): ajouter des tests pour le composant Button
```

---

## 🧪 Tests

### Écrire des Tests

- Testez les **comportements**, pas l'implémentation
- Utilisez des noms de tests descriptifs
- Suivez le pattern **Arrange-Act-Assert**

### Exemple de Test

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('devrait appeler onClick quand cliqué', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Cliquez-moi</Button>);
    
    // Act
    await user.click(screen.getByText('Cliquez-moi'));
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Couverture de Code

Visez une couverture de code d'au moins **80%** pour les nouveaux composants.

---

## 🙏 Remerciements

Merci de contribuer à Virtus ! Votre aide est précieuse pour améliorer l'application et offrir une meilleure expérience aux utilisateurs.

---

**Date de création :** 4 octobre 2025  
**Auteur :** Manus AI
