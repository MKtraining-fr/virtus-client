# Plan d'implémentation : Gestion des vidéos et photos

**Date :** 18 janvier 2026  
**Statut :** 📋 En planification

---

## 📋 Objectifs

### 1. Sélection multiple et actions en masse pour les vidéos
- Permettre au coach de sélectionner plusieurs vidéos
- Ajouter des boutons pour supprimer et télécharger en masse

### 2. Sélection multiple et actions en masse pour les photos
- Permettre au coach de sélectionner plusieurs photos
- Ajouter des boutons pour supprimer et télécharger en masse

### 3. Nettoyage automatique après suppression
- Supprimer complètement l'encadré vide après suppression d'une photo
- Supprimer automatiquement le dossier de date si toutes les photos sont supprimées

---

## 🔍 Analyse du code existant

### Composant `ClientVideosTab.tsx`

**Localisation :** `src/components/coach/ClientVideosTab.tsx`

**Fonctionnalités actuelles :**
- Affichage des vidéos groupées par exercice
- Filtres : Toutes / Nouvelles / Vues
- Lecture vidéo avec modal
- Marquage comme vue
- Ajout de commentaire coach

**Manquant :**
- ❌ Sélection multiple
- ❌ Suppression en masse
- ❌ Téléchargement en masse

### Composant `ClientPhotosSection.tsx`

**Localisation :** `src/components/coach/ClientPhotosSection.tsx`

**Fonctionnalités actuelles :**
- Affichage des photos groupées par session (date)
- Suppression individuelle de photos
- Suppression de session complète
- Affichage en modal

**Problèmes identifiés :**
- ❌ Encadré vide reste après suppression de toutes les photos d'une session
- ❌ Pas de sélection multiple
- ❌ Pas de téléchargement en masse

---

## 🎯 Solution proposée

### Phase 1 : Sélection multiple pour les vidéos

**Fichier à modifier :** `src/components/coach/ClientVideosTab.tsx`

**Modifications :**

1. **Ajouter les états de sélection**
```typescript
const [selectionMode, setSelectionMode] = useState(false);
const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
```

2. **Ajouter la barre d'actions**
```tsx
{/* Barre d'actions en mode sélection */}
{selectionMode && (
  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">
        {selectedVideos.size} vidéo{selectedVideos.size > 1 ? 's' : ''} sélectionnée{selectedVideos.size > 1 ? 's' : ''}
      </span>
      <button
        onClick={handleSelectAll}
        className="text-sm text-primary hover:underline"
      >
        {selectedVideos.size === filteredVideos.length ? 'Tout désélectionner' : 'Tout sélectionner'}
      </button>
    </div>
    <div className="flex gap-2">
      <button
        onClick={handleDownloadSelected}
        disabled={selectedVideos.size === 0}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
      >
        📥 Télécharger ({selectedVideos.size})
      </button>
      <button
        onClick={handleDeleteSelected}
        disabled={selectedVideos.size === 0}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
      >
        🗑️ Supprimer ({selectedVideos.size})
      </button>
      <button
        onClick={() => {
          setSelectionMode(false);
          setSelectedVideos(new Set());
        }}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        Annuler
      </button>
    </div>
  </div>
)}
```

3. **Ajouter le bouton pour activer le mode sélection**
```tsx
<button
  onClick={() => setSelectionMode(!selectionMode)}
  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
>
  {selectionMode ? 'Annuler la sélection' : '☑️ Sélectionner'}
</button>
```

4. **Ajouter les checkboxes sur les vidéos**
```tsx
{selectionMode && (
  <div className="absolute top-2 left-2 z-10">
    <input
      type="checkbox"
      checked={selectedVideos.has(video.id)}
      onChange={(e) => {
        e.stopPropagation();
        const newSelected = new Set(selectedVideos);
        if (e.target.checked) {
          newSelected.add(video.id);
        } else {
          newSelected.delete(video.id);
        }
        setSelectedVideos(newSelected);
      }}
      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
    />
  </div>
)}
```

5. **Implémenter les fonctions d'actions en masse**
```typescript
const handleSelectAll = () => {
  if (selectedVideos.size === filteredVideos.length) {
    setSelectedVideos(new Set());
  } else {
    setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
  }
};

const handleDeleteSelected = async () => {
  if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedVideos.size} vidéo${selectedVideos.size > 1 ? 's' : ''} ?`)) {
    return;
  }

  try {
    await Promise.all(
      Array.from(selectedVideos).map(videoId => deleteExerciseVideo(videoId))
    );
    
    await fetchVideos();
    setSelectedVideos(new Set());
    setSelectionMode(false);
    alert('Vidéos supprimées avec succès !');
  } catch (error) {
    console.error('Erreur suppression vidéos:', error);
    alert('Erreur lors de la suppression des vidéos.');
  }
};

const handleDownloadSelected = async () => {
  try {
    for (const videoId of Array.from(selectedVideos)) {
      const video = videos.find(v => v.id === videoId);
      if (video) {
        // Télécharger la vidéo
        const link = document.createElement('a');
        link.href = video.videoUrl;
        link.download = video.fileName;
        link.click();
        
        // Petit délai entre chaque téléchargement
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    alert('Téléchargement des vidéos lancé !');
  } catch (error) {
    console.error('Erreur téléchargement vidéos:', error);
    alert('Erreur lors du téléchargement des vidéos.');
  }
};
```

### Phase 2 : Sélection multiple pour les photos

**Fichier à modifier :** `src/components/coach/ClientPhotosSection.tsx`

**Modifications similaires à Phase 1 :**

1. **Ajouter les états de sélection**
```typescript
const [selectionMode, setSelectionMode] = useState(false);
const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
```

2. **Ajouter la barre d'actions** (même structure que vidéos)

3. **Ajouter les checkboxes sur les photos**
```tsx
{selectionMode && (
  <div className="absolute top-2 left-2 z-10">
    <input
      type="checkbox"
      checked={selectedPhotos.has(photo.id)}
      onChange={(e) => {
        e.stopPropagation();
        const newSelected = new Set(selectedPhotos);
        if (e.target.checked) {
          newSelected.add(photo.id);
        } else {
          newSelected.delete(photo.id);
        }
        setSelectedPhotos(newSelected);
      }}
      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
    />
  </div>
)}
```

4. **Implémenter les fonctions d'actions en masse**

### Phase 3 : Nettoyage automatique après suppression

**Fichier à modifier :** `src/components/coach/ClientPhotosSection.tsx`

**Problème actuel :**
```typescript
const handleDeletePhoto = async (photoId: string, sessionId?: string) => {
  // ...
  await deleteClientDocument(photoId);
  
  // Recharge les photos de la session
  if (sessionId && sessionPhotos[sessionId]) {
    const photos = await getSessionPhotos(sessionId);
    setSessionPhotos(prev => ({ ...prev, [sessionId]: photos }));
  }
  
  await loadPhotosData(); // Recharge toutes les sessions
  // ❌ Mais la session vide reste visible !
};
```

**Solution :**
```typescript
const handleDeletePhoto = async (photoId: string, sessionId?: string) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

  setIsDeleting(true);
  try {
    await deleteClientDocument(photoId);
    
    // Recharger les photos de la session
    if (sessionId && sessionPhotos[sessionId]) {
      const photos = await getSessionPhotos(sessionId);
      
      // ✅ Si plus aucune photo, supprimer la session automatiquement
      if (photos.length === 0) {
        await deletePhotoSession(sessionId);
        
        // Retirer la session des états
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setExpandedSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
        setSessionPhotos(prev => {
          const newPhotos = { ...prev };
          delete newPhotos[sessionId];
          return newPhotos;
        });
        
        alert('Photo supprimée et dossier vide supprimé automatiquement !');
      } else {
        // Mettre à jour les photos de la session
        setSessionPhotos(prev => ({ ...prev, [sessionId]: photos }));
        await loadPhotosData();
        alert('Photo supprimée avec succès !');
      }
    }
  } catch (error) {
    console.error('Erreur suppression photo:', error);
    alert('Erreur lors de la suppression de la photo.');
  } finally {
    setIsDeleting(false);
  }
};
```

**Même logique pour la suppression en masse :**
```typescript
const handleDeleteSelected = async () => {
  if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''} ?`)) {
    return;
  }

  setIsDeleting(true);
  try {
    // Grouper les photos par session
    const photosBySession: Record<string, string[]> = {};
    for (const photoId of Array.from(selectedPhotos)) {
      // Trouver la session de cette photo
      for (const [sessionId, photos] of Object.entries(sessionPhotos)) {
        if (photos.some(p => p.id === photoId)) {
          if (!photosBySession[sessionId]) {
            photosBySession[sessionId] = [];
          }
          photosBySession[sessionId].push(photoId);
          break;
        }
      }
    }

    // Supprimer toutes les photos
    await Promise.all(
      Array.from(selectedPhotos).map(photoId => deleteClientDocument(photoId))
    );

    // Vérifier chaque session et supprimer si vide
    for (const [sessionId, deletedPhotoIds] of Object.entries(photosBySession)) {
      const remainingPhotos = await getSessionPhotos(sessionId);
      
      if (remainingPhotos.length === 0) {
        // Supprimer la session vide
        await deletePhotoSession(sessionId);
        
        // Retirer la session des états
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setExpandedSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
        setSessionPhotos(prev => {
          const newPhotos = { ...prev };
          delete newPhotos[sessionId];
          return newPhotos;
        });
      } else {
        // Mettre à jour les photos de la session
        setSessionPhotos(prev => ({ ...prev, [sessionId]: remainingPhotos }));
      }
    }

    await loadPhotosData();
    setSelectedPhotos(new Set());
    setSelectionMode(false);
    alert('Photos supprimées avec succès !');
  } catch (error) {
    console.error('Erreur suppression photos:', error);
    alert('Erreur lors de la suppression des photos.');
  } finally {
    setIsDeleting(false);
  }
};
```

---

## 🔧 Services à créer/modifier

### Service `exerciseVideoService.ts`

**Ajouter la fonction de suppression :**
```typescript
export async function deleteExerciseVideo(videoId: string): Promise<void> {
  try {
    // Récupérer les infos de la vidéo pour supprimer le fichier du storage
    const { data: video, error: fetchError } = await supabase
      .from('exercise_set_videos')
      .select('video_url, file_name')
      .eq('id', videoId)
      .single();

    if (fetchError) throw fetchError;

    // Supprimer le fichier du storage
    if (video) {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = video.video_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('exercise-videos') + 1).join('/');
      
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAMES.EXERCISE_VIDEOS)
        .remove([filePath]);

      if (storageError) {
        console.error('Erreur suppression storage:', storageError);
      }
    }

    // Supprimer l'entrée de la base de données
    const { error: dbError } = await supabase
      .from('exercise_set_videos')
      .delete()
      .eq('id', videoId);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Erreur deleteExerciseVideo:', error);
    throw error;
  }
}
```

---

## 📝 Checklist d'implémentation

### Phase 1 : Vidéos
- [ ] Ajouter les états de sélection dans `ClientVideosTab.tsx`
- [ ] Ajouter le bouton "Sélectionner" dans le header
- [ ] Ajouter la barre d'actions en mode sélection
- [ ] Ajouter les checkboxes sur les vidéos
- [ ] Implémenter `handleSelectAll`
- [ ] Implémenter `handleDeleteSelected`
- [ ] Implémenter `handleDownloadSelected`
- [ ] Ajouter `deleteExerciseVideo` dans `exerciseVideoService.ts`
- [ ] Tester la suppression en masse
- [ ] Tester le téléchargement en masse

### Phase 2 : Photos
- [ ] Ajouter les états de sélection dans `ClientPhotosSection.tsx`
- [ ] Ajouter le bouton "Sélectionner" dans le header
- [ ] Ajouter la barre d'actions en mode sélection
- [ ] Ajouter les checkboxes sur les photos
- [ ] Implémenter `handleSelectAll`
- [ ] Implémenter `handleDeleteSelected` avec nettoyage auto
- [ ] Implémenter `handleDownloadSelected`
- [ ] Tester la suppression en masse
- [ ] Tester le téléchargement en masse

### Phase 3 : Nettoyage automatique
- [ ] Modifier `handleDeletePhoto` pour supprimer les sessions vides
- [ ] Modifier `handleDeleteSelected` pour supprimer les sessions vides
- [ ] Tester la suppression d'une photo unique (doit supprimer la session si vide)
- [ ] Tester la suppression en masse (doit supprimer les sessions vides)

---

## 🎨 Design

### Barre d'actions
- Fond bleu clair (`bg-blue-50`)
- Boutons avec icônes
- Compteur de sélection
- Bouton "Tout sélectionner/désélectionner"

### Checkboxes
- Position : coin supérieur gauche
- Taille : 20x20px
- Couleur : primary
- Z-index élevé pour être au-dessus de l'image

### Boutons d'action
- **Télécharger** : Bleu primary avec icône 📥
- **Supprimer** : Rouge avec icône 🗑️
- **Annuler** : Gris avec texte

---

## 🧪 Tests

### Tests vidéos
1. Activer le mode sélection
2. Sélectionner plusieurs vidéos
3. Cliquer sur "Tout sélectionner"
4. Télécharger les vidéos sélectionnées
5. Supprimer les vidéos sélectionnées
6. Vérifier que les vidéos sont bien supprimées de la base et du storage

### Tests photos
1. Activer le mode sélection
2. Sélectionner plusieurs photos
3. Cliquer sur "Tout sélectionner"
4. Télécharger les photos sélectionnées
5. Supprimer toutes les photos d'une session
6. Vérifier que la session est automatiquement supprimée
7. Supprimer quelques photos d'une session
8. Vérifier que la session reste visible avec les photos restantes

---

**Auteur :** Manus AI Agent  
**Date de création :** 18 janvier 2026  
**Version :** 1.0
