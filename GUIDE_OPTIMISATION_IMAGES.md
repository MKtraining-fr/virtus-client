# Guide d'Optimisation des Images et Assets

## 📋 Bonnes Pratiques

### 1. Formats d'Images Recommandés

Pour optimiser les performances de l'application Virtus, utilisez les formats suivants selon le type de contenu :

**WebP** : Format moderne offrant une excellente compression avec une qualité visuelle élevée. Recommandé pour toutes les photos et images complexes. La taille des fichiers est réduite de 25 à 35% par rapport au JPEG.

**AVIF** : Format encore plus performant que WebP, avec une compression supérieure. Utilisez-le comme format principal si le support navigateur le permet, avec un fallback WebP.

**SVG** : Format vectoriel idéal pour les logos, icônes et illustrations simples. Les fichiers SVG sont légers et s'adaptent à toutes les résolutions sans perte de qualité.

**PNG** : Réservé aux images nécessitant de la transparence ou aux graphiques avec du texte. Utilisez la compression PNG-8 pour les images simples.

### 2. Optimisation des Avatars Utilisateurs

Les avatars sont affichés fréquemment dans l'application. Voici les recommandations :

**Taille recommandée** : 200x200 pixels maximum (les avatars sont affichés à 80x80 pixels dans l'interface).

**Format** : WebP avec fallback JPEG.

**Compression** : Qualité 80% pour un bon équilibre taille/qualité.

**Lazy loading** : Activé par défaut avec l'attribut `loading="lazy"`.

### 3. Images de Programmes et Exercices

**Taille recommandée** : 800x600 pixels pour les vignettes, 1920x1080 pixels pour les images plein écran.

**Format** : WebP avec fallback JPEG.

**Responsive images** : Utilisez l'attribut `srcset` pour servir différentes tailles selon l'appareil.

### 4. Outils d'Optimisation

**En ligne** : TinyPNG, Squoosh, ImageOptim.

**CLI** : `sharp` (Node.js), `imagemin`.

**Automatisation** : Intégrez l'optimisation dans votre pipeline de build avec `vite-plugin-imagemin`.

### 5. Implémentation dans le Code

Exemple d'utilisation d'images optimisées avec fallback :

```tsx
<picture>
  <source srcSet="/images/avatar.avif" type="image/avif" />
  <source srcSet="/images/avatar.webp" type="image/webp" />
  <img 
    src="/images/avatar.jpg" 
    alt="Avatar utilisateur"
    loading="lazy"
    width="80"
    height="80"
  />
</picture>
```

### 6. CDN et Caching

Pour les images statiques, utilisez un CDN comme Cloudflare ou Vercel pour :

- Réduire la latence de chargement
- Mettre en cache les images au plus près des utilisateurs
- Optimiser automatiquement les formats selon le navigateur

### 7. Images Dynamiques (Firebase Storage)

Pour les images uploadées par les utilisateurs (avatars, photos de bilans) :

**Génération de thumbnails** : Créez automatiquement des versions optimisées lors de l'upload avec Firebase Functions.

**URL signées** : Utilisez des URL signées avec une durée de vie limitée pour la sécurité.

**Compression côté client** : Compressez les images avant l'upload avec `browser-image-compression`.

### 8. Métriques de Performance

Surveillez ces métriques pour évaluer l'impact de l'optimisation :

**LCP (Largest Contentful Paint)** : Doit être < 2.5s.

**FID (First Input Delay)** : Doit être < 100ms.

**CLS (Cumulative Layout Shift)** : Doit être < 0.1.

Utilisez Lighthouse ou WebPageTest pour mesurer ces métriques.

---

## 🚀 Actions Immédiates

1. Convertir toutes les images JPEG/PNG en WebP
2. Ajouter l'attribut `loading="lazy"` sur toutes les images
3. Définir les dimensions `width` et `height` pour éviter les layout shifts
4. Utiliser un CDN pour servir les images statiques
5. Implémenter la génération de thumbnails pour Firebase Storage

---

**Date de création :** 4 octobre 2025  
**Auteur :** Manus AI
