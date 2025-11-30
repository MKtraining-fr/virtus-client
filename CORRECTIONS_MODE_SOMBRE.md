# Corrections du mode sombre sur la page de connexion

## Problème identifié

Les champs de saisie (email et mot de passe) apparaissaient en noir sur la page de connexion, rendant le texte illisible. Ce problème était causé par :

1. **Script d'initialisation du thème** : Dans `index.html`, un script s'exécutait avant le chargement de React et appliquait automatiquement le mode sombre si l'utilisateur l'avait activé précédemment, **même sur la page de connexion**.

2. **Composants Input et Select** : Ces composants n'avaient pas de styles adaptés pour le mode sombre, ce qui causait des problèmes de lisibilité.

## Solutions appliquées

### 1. Modification de `index.html`

Le script d'initialisation du thème a été modifié pour **ne jamais appliquer le mode sombre sur les pages de connexion et d'inscription** (`/login`, `/auth`).

**Avant :**
```javascript
const theme = localStorage.getItem('virtus_theme');
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}
```

**Après :**
```javascript
// Ne pas appliquer le mode sombre sur la page de connexion/inscription
const isAuthPage = window.location.pathname === '/login' || 
                   window.location.pathname === '/login/' ||
                   window.location.pathname === '/auth' || 
                   window.location.pathname === '/auth/' ||
                   window.location.hash === '#/login' ||
                   window.location.hash === '#/auth' ||
                   window.location.hash.startsWith('#/login?') ||
                   window.location.hash.startsWith('#/auth?');

if (!isAuthPage) {
  const theme = localStorage.getItem('virtus_theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}
```

### 2. Amélioration du composant `Input.tsx`

Ajout de classes Tailwind pour le mode sombre afin de garantir la lisibilité dans tous les contextes (bien que le mode sombre ne s'applique plus sur la page de connexion).

**Modifications :**
- Labels : `text-gray-700 dark:text-gray-300`
- Champs input : `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-gray-100`, `border-gray-300 dark:border-gray-600`
- Placeholders : `placeholder:text-gray-500 dark:placeholder:text-gray-400`

### 3. Amélioration du composant `Select.tsx`

Mêmes améliorations que pour le composant Input pour assurer la cohérence.

## Résultat attendu

- ✅ La page de connexion reste **toujours en mode clair**, même si l'utilisateur a activé le mode sombre dans l'application
- ✅ Les champs de saisie sont **lisibles** avec un texte noir sur fond blanc
- ✅ Le mode sombre ne s'applique qu'**après la connexion**, une fois dans l'application
- ✅ Les composants Input et Select sont maintenant compatibles avec le mode sombre pour une utilisation future dans l'application

## Fichiers modifiés

1. `index.html` - Script d'initialisation du thème
2. `components/Input.tsx` - Styles du composant Input
3. `components/Select.tsx` - Styles du composant Select
