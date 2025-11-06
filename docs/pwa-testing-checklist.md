# Checklist de test pour la personnalisation PWA

## Prérequis

Avant de commencer les tests, assurez-vous que :

- [ ] La table `app_settings` a été créée dans Supabase
- [ ] L'Edge Function `generate-manifest` a été déployée
- [ ] La variable d'environnement `VITE_CLOUDINARY_CLOUD_NAME` est configurée
- [ ] L'upload preset `virtus_pwa_icons` existe dans Cloudinary
- [ ] L'application est déployée ou en cours d'exécution localement

## Tests de l'interface admin

### 1. Accès à la page PWA Settings

- [ ] Se connecter en tant qu'administrateur
- [ ] Vérifier que l'entrée "PWA" apparaît dans le menu de navigation admin
- [ ] Cliquer sur "PWA" et vérifier que la page se charge correctement
- [ ] Vérifier que la configuration par défaut est chargée depuis la base de données

### 2. Upload d'icônes

#### Test d'upload valide (192x192)

- [ ] Préparer une image PNG de 192x192px
- [ ] Cliquer sur la zone d'upload pour l'icône 192x192
- [ ] Sélectionner l'image
- [ ] Vérifier que l'upload démarre (indicateur de chargement)
- [ ] Vérifier que l'image s'affiche dans la prévisualisation
- [ ] Vérifier qu'un message de succès s'affiche

#### Test d'upload valide (512x512)

- [ ] Préparer une image PNG de 512x512px
- [ ] Cliquer sur la zone d'upload pour l'icône 512x512
- [ ] Sélectionner l'image
- [ ] Vérifier que l'upload démarre (indicateur de chargement)
- [ ] Vérifier que l'image s'affiche dans la prévisualisation
- [ ] Vérifier qu'un message de succès s'affiche

#### Test d'upload invalide (mauvaise taille)

- [ ] Préparer une image de 256x256px
- [ ] Essayer de l'uploader comme icône 192x192
- [ ] Vérifier qu'un message d'erreur s'affiche indiquant la taille incorrecte

#### Test d'upload invalide (mauvais format)

- [ ] Essayer d'uploader un fichier non-image (PDF, TXT, etc.)
- [ ] Vérifier qu'un message d'erreur s'affiche

### 3. Modification des paramètres

- [ ] Modifier le nom complet de l'application
- [ ] Modifier le nom court de l'application
- [ ] Modifier la couleur de thème (via le color picker)
- [ ] Modifier la couleur de fond (via le color picker)
- [ ] Vérifier que les valeurs hexadécimales se mettent à jour

### 4. Sauvegarde de la configuration

- [ ] Cliquer sur "Sauvegarder la configuration"
- [ ] Vérifier qu'un message de succès s'affiche
- [ ] Recharger la page
- [ ] Vérifier que les modifications sont persistées

### 5. Validation des contraintes

- [ ] Essayer de sauvegarder sans avoir uploadé les deux icônes
- [ ] Vérifier que le bouton de sauvegarde est désactivé ou qu'un message d'erreur s'affiche

## Tests de l'Edge Function

### 1. Test de l'endpoint

- [ ] Ouvrir un navigateur
- [ ] Accéder à `https://dqsbfnsicmzovlrhuoif.supabase.co/functions/v1/generate-manifest`
- [ ] Vérifier que le JSON du manifeste s'affiche
- [ ] Vérifier que les URLs des icônes correspondent à celles uploadées
- [ ] Vérifier que les couleurs correspondent à la configuration

### 2. Test du manifeste dans l'application

- [ ] Ouvrir l'application dans Chrome/Edge
- [ ] Ouvrir les DevTools (F12)
- [ ] Aller dans l'onglet "Application" → "Manifest"
- [ ] Vérifier que le manifeste est chargé correctement
- [ ] Vérifier que les icônes s'affichent dans la prévisualisation
- [ ] Vérifier qu'aucune erreur n'apparaît dans la console

## Tests d'installation PWA

### Test sur Android (Chrome)

- [ ] Ouvrir l'application sur un téléphone Android avec Chrome
- [ ] Vérifier que la bannière d'installation PWA apparaît
- [ ] Cliquer sur "Installer" ou utiliser le menu "Ajouter à l'écran d'accueil"
- [ ] Vérifier que l'icône personnalisée apparaît sur l'écran d'accueil
- [ ] Vérifier que le nom de l'application est correct
- [ ] Lancer l'application depuis l'écran d'accueil
- [ ] Vérifier que l'application s'ouvre en mode standalone (sans barre d'adresse)

### Test sur iOS (Safari)

- [ ] Ouvrir l'application sur un iPhone/iPad avec Safari
- [ ] Appuyer sur le bouton "Partager"
- [ ] Sélectionner "Sur l'écran d'accueil"
- [ ] Vérifier que l'icône personnalisée apparaît dans la prévisualisation
- [ ] Vérifier que le nom de l'application est correct
- [ ] Ajouter à l'écran d'accueil
- [ ] Vérifier que l'icône personnalisée apparaît sur l'écran d'accueil
- [ ] Lancer l'application depuis l'écran d'accueil

### Test sur Desktop (Chrome/Edge)

- [ ] Ouvrir l'application dans Chrome ou Edge sur desktop
- [ ] Vérifier que l'icône d'installation apparaît dans la barre d'adresse
- [ ] Cliquer sur l'icône d'installation
- [ ] Installer l'application
- [ ] Vérifier que l'icône personnalisée apparaît dans le lanceur d'applications
- [ ] Lancer l'application
- [ ] Vérifier qu'elle s'ouvre dans une fenêtre dédiée

## Tests de mise à jour

### Test de changement d'icône

- [ ] Installer la PWA avec une première icône
- [ ] En tant qu'admin, changer l'icône dans les paramètres PWA
- [ ] Sauvegarder
- [ ] Sur le téléphone/desktop, désinstaller l'ancienne PWA
- [ ] Réinstaller la PWA
- [ ] Vérifier que la nouvelle icône est utilisée

### Test de cache

- [ ] Vérifier que le manifeste est mis en cache (en-tête Cache-Control)
- [ ] Attendre 1 heure ou vider le cache
- [ ] Recharger l'application
- [ ] Vérifier que les modifications sont prises en compte

## Tests de sécurité et permissions

### Test des politiques RLS

- [ ] Se connecter en tant que coach (non-admin)
- [ ] Vérifier que l'entrée "PWA" n'apparaît pas dans le menu
- [ ] Essayer d'accéder directement à `/app/pwa-settings`
- [ ] Vérifier qu'une redirection ou un message d'erreur s'affiche

### Test de lecture publique

- [ ] Sans être connecté, accéder à l'Edge Function
- [ ] Vérifier que le manifeste est accessible (lecture publique)

## Tests de fallback

### Test en cas d'erreur de l'Edge Function

- [ ] Simuler une erreur dans l'Edge Function (ex: supprimer temporairement la config)
- [ ] Accéder au manifeste
- [ ] Vérifier qu'un manifeste par défaut est retourné
- [ ] Vérifier que l'installation PWA fonctionne toujours

## Résultats attendus

Tous les tests doivent passer avec succès. En cas d'échec :

1. Noter le test qui échoue
2. Vérifier les logs dans la console du navigateur
3. Vérifier les logs de l'Edge Function dans Supabase
4. Vérifier la configuration de Cloudinary
5. Corriger le problème et retester

## Notes

- Les utilisateurs existants devront désinstaller et réinstaller la PWA pour voir les nouvelles icônes
- Le cache du manifeste peut prendre jusqu'à 1 heure pour expirer
- Sur iOS, l'icône apple-touch-icon peut être mise à jour dynamiquement en modifiant également le fichier index.html
