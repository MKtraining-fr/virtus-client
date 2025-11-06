# Configuration Cloudinary pour les icônes PWA

## Prérequis

Pour que l'upload d'icônes PWA fonctionne correctement, vous devez configurer Cloudinary.

## Étapes de configuration

### 1. Créer un compte Cloudinary

Si vous n'avez pas encore de compte Cloudinary :
1. Rendez-vous sur [cloudinary.com](https://cloudinary.com)
2. Créez un compte gratuit
3. Notez votre **Cloud Name** depuis le dashboard

### 2. Créer un Upload Preset

1. Connectez-vous à votre dashboard Cloudinary
2. Allez dans **Settings** → **Upload**
3. Faites défiler jusqu'à **Upload presets**
4. Cliquez sur **Add upload preset**
5. Configurez le preset :
   - **Preset name** : `virtus_pwa_icons`
   - **Signing mode** : **Unsigned** (important pour l'upload depuis le frontend)
   - **Folder** : `pwa-icons` (optionnel mais recommandé)
   - **Use filename or externally defined Public ID** : Coché
   - **Unique filename** : Coché
6. Cliquez sur **Save**

### 3. Ajouter la variable d'environnement

Dans votre fichier `.env` à la racine du projet, ajoutez :

```env
VITE_CLOUDINARY_CLOUD_NAME=votre_cloud_name
```

Remplacez `votre_cloud_name` par le Cloud Name de votre compte Cloudinary.

### 4. Redémarrer l'application

Après avoir ajouté la variable d'environnement, redémarrez votre serveur de développement :

```bash
npm run dev
```

## Configuration pour la production

Pour Netlify, ajoutez également la variable d'environnement dans les paramètres du projet :

1. Allez dans **Site settings** → **Environment variables**
2. Ajoutez `VITE_CLOUDINARY_CLOUD_NAME` avec votre Cloud Name
3. Redéployez l'application

## Vérification

Pour vérifier que la configuration fonctionne :

1. Connectez-vous en tant qu'admin
2. Allez dans **PWA** dans le menu de navigation
3. Essayez d'uploader une icône 192x192px
4. Si l'upload réussit, la configuration est correcte

## Dépannage

### Erreur "VITE_CLOUDINARY_CLOUD_NAME is not defined"

- Vérifiez que la variable est bien définie dans `.env`
- Redémarrez le serveur de développement
- Vérifiez que le fichier `.env` est à la racine du projet

### Erreur lors de l'upload

- Vérifiez que l'upload preset `virtus_pwa_icons` existe
- Vérifiez que le preset est en mode **Unsigned**
- Vérifiez que le Cloud Name est correct

### L'image ne s'affiche pas

- Vérifiez que l'URL retournée par Cloudinary est accessible
- Vérifiez les paramètres CORS de Cloudinary si nécessaire
