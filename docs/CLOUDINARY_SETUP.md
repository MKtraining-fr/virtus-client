# Configuration Cloudinary pour l'upload des icônes PWA

## Problème résolu

L'upload des icônes PWA (192x192 et 512x512) échouait avec l'erreur suivante :

```
POST https://api.cloudinary.com/v1_1/undefined/image/upload 401 (Unauthorized)
```

## Cause

La variable d'environnement `VITE_CLOUDINARY_CLOUD_NAME` n'était pas définie, ce qui causait :
1. Une URL invalide avec `undefined` au lieu du nom du cloud
2. Une erreur 401 (Unauthorized) lors de l'upload

## Solution

### 1. Variable d'environnement ajoutée

La variable `VITE_CLOUDINARY_CLOUD_NAME` a été ajoutée aux fichiers de configuration :

- **`.env.example`** : Template avec `your_cloudinary_cloud_name`
- **`.env`** : Valeur réelle pour le développement local

### 2. Configuration Cloudinary requise

Pour que l'upload fonctionne, un **upload preset** doit être configuré dans Cloudinary :

#### Étapes de configuration :

1. Se connecter à https://console.cloudinary.com
2. Aller dans **Settings** → **Upload** → **Upload presets**
3. Créer un nouveau preset avec les paramètres suivants :
   - **Preset name** : `virtus_pwa_icons`
   - **Signing Mode** : `Unsigned` (important pour l'upload depuis le frontend)
   - **Asset folder** : `pwa-icons`
4. Sauvegarder le preset

### 3. Configuration Netlify

Pour la production, ajouter la variable d'environnement dans Netlify :

1. Aller dans **Site settings** → **Environment variables**
2. Ajouter la variable :
   - **Key** : `VITE_CLOUDINARY_CLOUD_NAME`
   - **Value** : `djotbtrij` (ou votre nom de cloud)
3. Redéployer le site

## Utilisation

Le code dans `src/pages/admin/PWASettings.tsx` utilise cette variable pour construire l'URL d'upload :

```typescript
const response = await fetch(
  `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
  {
    method: 'POST',
    body: formData,
  }
);
```

## Vérification

Pour vérifier que la configuration fonctionne :

1. Aller dans l'interface admin → PWA Settings
2. Essayer d'uploader une icône 192x192 ou 512x512
3. L'upload devrait réussir et l'image devrait apparaître
4. Vérifier dans Cloudinary que l'image est bien dans le dossier `pwa-icons`

## Notes importantes

- Le preset `virtus_pwa_icons` doit être en mode **Unsigned** pour permettre l'upload depuis le frontend
- Les images sont stockées dans le dossier `pwa-icons` pour une meilleure organisation
- La variable d'environnement doit être préfixée par `VITE_` pour être accessible dans le code Vite/React
