# Conception : Personnalisation de l'icône PWA pour les clients

## Vue d'ensemble

Cette conception permet à l'administrateur de définir une icône personnalisée pour l'application PWA client. Cette icône sera utilisée par tous les utilisateurs clients lorsqu'ils installent l'application sur leur téléphone.

## Architecture de la solution

### 1. Stockage de l'icône

**Table Supabase : `app_settings`**

Création d'une nouvelle table pour stocker les paramètres globaux de l'application :

```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion de la configuration PWA par défaut
INSERT INTO app_settings (key, value) VALUES (
  'pwa_config',
  '{
    "icon_192": "https://cdn-icons-png.flaticon.com/512/3043/3043222.png",
    "icon_512": "https://cdn-icons-png.flaticon.com/512/3043/3043222.png",
    "name": "Virtus",
    "short_name": "Virtus",
    "theme_color": "#7A68FA",
    "background_color": "#121212"
  }'::jsonb
);
```

**Stockage des images sur Cloudinary**

Conformément aux bonnes pratiques du projet, les icônes uploadées seront stockées sur Cloudinary pour assurer flexibilité et performance.

### 2. Interface administrateur

**Nouvelle page : PWA Settings**

Créer une nouvelle page dans l'interface admin (`src/pages/admin/PWASettings.tsx`) avec :

- Upload d'icône 192x192px (obligatoire)
- Upload d'icône 512x512px (obligatoire)
- Prévisualisation des icônes
- Champs pour personnaliser :
  - Nom de l'application
  - Nom court
  - Couleur de thème
  - Couleur de fond

**Intégration dans le menu admin**

Ajouter un lien vers cette page dans le menu de navigation admin.

### 3. Endpoint API pour le manifeste dynamique

**Edge Function Supabase : `generate-manifest`**

Créer une Edge Function qui :
1. Récupère les paramètres PWA depuis `app_settings`
2. Génère dynamiquement le fichier `manifest.json`
3. Retourne le manifeste avec les bonnes en-têtes HTTP

**Localisation :** `supabase/functions/generate-manifest/index.ts`

### 4. Modification du fichier index.html

Modifier la référence au manifeste dans `index.html` :

```html
<!-- Avant -->
<link rel="manifest" href="/manifest.json" />

<!-- Après -->
<link rel="manifest" href="https://dqsbfnsicmzovlrhuoif.supabase.co/functions/v1/generate-manifest" />
```

## Flux de données

```
1. Admin upload icône → Cloudinary
2. Admin sauvegarde URL → Supabase (app_settings)
3. Client charge la page → Lit le manifeste dynamique
4. Edge Function → Récupère config depuis app_settings
5. Edge Function → Retourne manifest.json personnalisé
6. Navigateur → Utilise l'icône pour l'installation PWA
```

## Avantages de cette approche

1. **Centralisation** : Une seule source de vérité pour la configuration PWA
2. **Dynamique** : Pas besoin de redéployer l'application pour changer l'icône
3. **Scalable** : Facile d'ajouter d'autres paramètres PWA à l'avenir
4. **Performant** : Cloudinary optimise automatiquement les images
5. **Sécurisé** : Seuls les admins peuvent modifier les paramètres

## Considérations techniques

### Tailles d'icônes recommandées

- **192x192px** : Icône standard pour Android
- **512x512px** : Icône haute résolution pour splash screens

### Format d'image

- **PNG** recommandé pour la transparence
- **SVG** non supporté par tous les navigateurs pour les icônes PWA
- **Purpose** : `any maskable` pour compatibilité maximale

### Cache et mise à jour

- Le manifeste sera mis en cache par le navigateur
- Les utilisateurs devront réinstaller la PWA pour voir les changements
- Possibilité d'ajouter un versioning dans l'URL du manifeste

## Prochaines étapes d'implémentation

1. Créer la table `app_settings` dans Supabase
2. Créer la page admin `PWASettings.tsx`
3. Implémenter l'upload vers Cloudinary
4. Créer l'Edge Function `generate-manifest`
5. Modifier `index.html` pour pointer vers le manifeste dynamique
6. Tester l'installation PWA avec une icône personnalisée
