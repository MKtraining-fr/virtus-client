# Corrections du thème lié à l'utilisateur

## Problème identifié

Le mode sombre était **partagé entre tous les comptes utilisateurs** sur le même navigateur. Lorsqu'un utilisateur activait le mode sombre puis se déconnectait, le prochain utilisateur qui se connectait héritait automatiquement du mode sombre, même s'il ne l'avait jamais activé personnellement.

**Cause racine :**
- Le thème était stocké dans `localStorage` avec une clé globale `virtus_theme`
- Aucune liaison entre le thème et l'utilisateur connecté
- Le thème persistait entre les sessions de différents utilisateurs

## Solutions appliquées

### 1. Stockage du thème par utilisateur

**Avant :**
```javascript
const THEME_KEY = 'virtus_theme';
window.localStorage.setItem(THEME_KEY, theme);
```

**Après :**
```javascript
const THEME_KEY = 'virtus_theme';
// Sauvegarder avec l'ID de l'utilisateur
window.localStorage.setItem(`${THEME_KEY}_${user.id}`, theme);
```

Chaque utilisateur a maintenant sa propre clé de thème : `virtus_theme_userId`

### 2. Chargement du thème au démarrage

**Nouvelle fonction `getUserTheme` :**
```javascript
const getUserTheme = (userId: string | null): 'light' | 'dark' => {
  if (typeof window === 'undefined' || !userId) {
    return 'light';
  }
  const stored = window.localStorage.getItem(`${THEME_KEY}_${userId}`);
  return stored === 'dark' ? 'dark' : 'light';
};
```

### 3. Initialisation en mode clair

**Avant :**
```javascript
const getInitialTheme = (): 'light' | 'dark' => {
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === 'dark' ? 'dark' : 'light';
};
```

**Après :**
```javascript
const getInitialTheme = (): 'light' | 'dark' => {
  return 'light'; // Toujours démarrer en mode clair
};
```

L'application démarre toujours en mode clair. Le thème de l'utilisateur est chargé **après la connexion**.

### 4. Chargement du thème lors de la connexion

Dans la fonction `handleSupabaseUser` :

```javascript
if (clientProfile) {
  // Charger le thème de l'utilisateur
  const userTheme = getUserTheme(clientProfile.id);
  set({ user: clientProfile, theme: userTheme, isAuthLoading: false });
  logger.info('Utilisateur connecté avec thème', { userId: clientProfile.id, theme: userTheme });
}
```

### 5. Réinitialisation du thème lors de la déconnexion

Dans la fonction `logout` :

```javascript
// Nettoyer l'état local dans tous les cas et réinitialiser le thème
set({ user: null, originalUser: null, currentViewRole: 'admin', theme: 'light' });
logger.info('Déconnexion réussie et état nettoyé (thème réinitialisé)');
```

### 6. Sauvegarde du thème par utilisateur

Dans la fonction `setTheme` :

```javascript
setTheme: (theme) => {
  const { user } = get();
  set({ theme });
  if (typeof window !== 'undefined' && user?.id) {
    // Sauvegarder le thème avec l'ID de l'utilisateur
    window.localStorage.setItem(`${THEME_KEY}_${user.id}`, theme);
  }
}
```

## Résultat attendu

- ✅ Chaque utilisateur a **son propre thème indépendant**
- ✅ Le thème est **lié à l'ID de l'utilisateur** dans localStorage
- ✅ La page de connexion reste **toujours en mode clair**
- ✅ Le thème de l'utilisateur est **chargé automatiquement** après la connexion
- ✅ Le thème est **réinitialisé en mode clair** lors de la déconnexion
- ✅ Plus de "fuite" du mode sombre entre les comptes

## Fichiers modifiés

1. `src/stores/useAuthStore.ts` - Gestion du thème par utilisateur

## Exemple de fonctionnement

### Scénario 1 : Utilisateur A active le mode sombre
1. Utilisateur A se connecte → Mode clair par défaut
2. Utilisateur A active le mode sombre → Sauvegardé dans `virtus_theme_userA_id`
3. Utilisateur A se déconnecte → Thème réinitialisé en mode clair

### Scénario 2 : Utilisateur B se connecte après
1. Utilisateur B se connecte → Mode clair chargé (pas de préférence)
2. Le thème de l'utilisateur A n'affecte **pas** l'utilisateur B
3. Chaque utilisateur garde ses propres préférences

### Scénario 3 : Utilisateur A se reconnecte
1. Utilisateur A se reconnecte → Son thème (dark) est **automatiquement rechargé** depuis `virtus_theme_userA_id`
2. L'application affiche le mode sombre comme il l'avait configuré
