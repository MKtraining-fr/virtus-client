# Implémentation Interface Coach - Visualisation Vidéos

**Date :** 4 janvier 2026  
**Statut :** 🚧 En cours  
**Objectif :** Permettre au coach de visualiser les vidéos uploadées par ses clients

---

## 📋 Vue d'ensemble

Cette implémentation ajoute une interface complète pour que les coachs puissent :
1. Visualiser toutes les vidéos uploadées par leurs clients
2. Recevoir des notifications pour les nouvelles vidéos
3. Marquer les vidéos comme vues
4. Ajouter des commentaires techniques
5. Accéder aux vidéos via le profil client

---

## ✅ Modifications de la base de données

### Colonnes ajoutées à `exercise_set_videos`

```sql
-- Nom de l'exercice
ALTER TABLE exercise_set_videos 
ADD COLUMN IF NOT EXISTS exercise_name TEXT;

-- Index de la série
ALTER TABLE exercise_set_videos 
ADD COLUMN IF NOT EXISTS set_index INTEGER;
```

**Justification :**
- `exercise_name` : Permet de grouper les vidéos par exercice dans l'interface coach
- `set_index` : Permet d'identifier quelle série a été filmée

---

## 📦 Nouveaux composants créés

### 1. `ClientVideosTab.tsx`

**Chemin :** `src/components/coach/ClientVideosTab.tsx`

**Fonctionnalités :**
- Affichage de toutes les vidéos d'un client
- Filtres : Toutes / Nouvelles / Vues
- Groupement par exercice
- Badges visuels (🔴 Nouvelle, 💬 Commenté)
- Lecteur vidéo intégré
- Ajout de commentaires coach

**Props :**
```typescript
interface ClientVideosTabProps {
  clientId: string;
  coachId: string;
}
```

**État :**
- ✅ Créé
- ⏳ Nécessite intégration dans ClientProgressionView
- ⏳ Nécessite mise à jour des services

---

## 🔧 Modifications des services

### `exerciseVideoService.ts`

**Modifications nécessaires :**

1. **Interface `ExerciseVideo`** ✅
```typescript
export interface ExerciseVideo {
  id: string;
  clientId: string;
  coachId: string;
  performanceId: string;
  exerciseName?: string;  // ✅ Ajouté
  setIndex?: number;       // ✅ Ajouté
  videoUrl: string;
  fileName: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  mimeType: string;
  viewedByCoach: boolean;
  viewedAt?: string;
  coachComment?: string;
  createdAt: string;
  updatedAt: string;
}
```

2. **Fonction `uploadExerciseVideo`** ⏳
```typescript
// Signature à modifier
export async function uploadExerciseVideo(
  clientId: string,
  coachId: string,
  performanceId: string,
  exerciseName: string,    // ⏳ À ajouter
  setIndex: number,         // ⏳ À ajouter
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; videoId: string } | null>

// Insert à modifier
.insert({
  client_id: clientId,
  coach_id: coachId && coachId !== '' ? coachId : null,
  performance_id: performanceId,
  exercise_name: exerciseName,  // ⏳ À ajouter
  set_index: setIndex,           // ⏳ À ajouter
  video_url: urlData.signedUrl,
  file_name: fileName,
  file_size_bytes: file.size,
  mime_type: file.type
})
```

3. **Fonctions de récupération** ⏳
```typescript
// Mettre à jour les mappings pour inclure exercise_name et set_index
return (data || []).map(row => ({
  id: row.id,
  clientId: row.client_id,
  coachId: row.coach_id,
  performanceId: row.performance_id,
  exerciseName: row.exercise_name,  // ⏳ À ajouter
  setIndex: row.set_index,           // ⏳ À ajouter
  videoUrl: row.video_url,
  fileName: row.file_name,
  fileSizeBytes: row.file_size_bytes,
  durationSeconds: row.duration_seconds,
  mimeType: row.mime_type,
  viewedByCoach: row.viewed_by_coach,
  viewedAt: row.viewed_at,
  coachComment: row.coach_comment,
  createdAt: row.created_at,
  updatedAt: row.updated_at
}));
```

---

## 🎨 Intégration dans ClientProgressionView

### Système d'onglets à ajouter

**Structure proposée :**
```tsx
<div className="tabs">
  <button onClick={() => setActiveTab('history')}>
    Historique des séances
  </button>
  <button onClick={() => setActiveTab('videos')}>
    Vidéos
    {newVideosCount > 0 && (
      <span className="badge">{newVideosCount}</span>
    )}
  </button>
</div>

{activeTab === 'history' && (
  // Contenu actuel (historique des performances)
)}

{activeTab === 'videos' && (
  <ClientVideosTab clientId={clientId} coachId={user.id} />
)}
```

---

## 🔔 Système de notifications

### Trigger existant

Le trigger `notify_coach_new_video` existe déjà dans la base de données et crée automatiquement une notification quand une vidéo est uploadée.

**Modifications nécessaires :**

1. **Vérifier que coach_id n'est pas NULL** ⏳
```sql
CREATE OR REPLACE FUNCTION notify_coach_new_video()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne créer une notification que si le client a un coach
  IF NEW.coach_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    SELECT 
      NEW.coach_id,
      'Nouvelle vidéo d''exercice',
      CONCAT(c.first_name, ' ', c.last_name, ' a uploadé une vidéo pour ', NEW.exercise_name),
      'exercise_video',
      FALSE
    FROM clients c
    WHERE c.id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

2. **Lien vers la vidéo dans la notification** ⏳
```typescript
// Dans le composant de notification
const handleNotificationClick = (notification) => {
  if (notification.type === 'exercise_video') {
    // Rediriger vers l'onglet vidéos du profil client
    navigate(`/coach/client/${clientId}/progression?tab=videos`);
  }
};
```

---

## 📊 Intégration dans l'historique des performances

### Affichage des vidéos par série

**Dans le tableau de performances :**
```tsx
{/* Pour chaque série */}
<div className="set-row">
  <span>Série {setIndex + 1}</span>
  <span>{reps} reps</span>
  <span>{load} kg</span>
  
  {/* Icône vidéo si disponible */}
  {hasVideo(exerciseId, setIndex) && (
    <button onClick={() => openVideoModal(exerciseId, setIndex)}>
      🎥
      {!videoViewed && <span className="badge-red" />}
    </button>
  )}
</div>
```

---

## 🧪 Tests à effectuer

### Tests fonctionnels

1. **Upload vidéo (client)** ✅
   - [x] Upload réussit
   - [x] Vidéo enregistrée dans Storage
   - [x] Métadonnées en BDD

2. **Visualisation (coach)** ⏳
   - [ ] Onglet "Vidéos" accessible
   - [ ] Liste des vidéos affichée
   - [ ] Filtres fonctionnels
   - [ ] Lecteur vidéo fonctionne
   - [ ] Marquage "vue" fonctionne
   - [ ] Ajout commentaire fonctionne

3. **Notifications** ⏳
   - [ ] Notification créée à l'upload
   - [ ] Badge compteur affiché
   - [ ] Clic redirige vers vidéos
   - [ ] Notification disparaît après consultation

4. **Historique performances** ⏳
   - [ ] Icône 🎥 affichée si vidéo
   - [ ] Pastille rouge si non vue
   - [ ] Clic ouvre le lecteur
   - [ ] Vidéos liées à la bonne série

---

## 📝 Fichiers modifiés/créés

### Créés ✅
- `src/components/coach/ClientVideosTab.tsx`
- `IMPLEMENTATION_COACH_VIDEOS.md` (ce fichier)

### À modifier ⏳
- `src/services/exerciseVideoService.ts`
  - Signature `uploadExerciseVideo`
  - Mappings des fonctions de récupération
  
- `src/pages/coach/ClientProgressionView.tsx`
  - Ajout système d'onglets
  - Intégration `ClientVideosTab`
  
- `src/components/client/ExerciseVideoModal.tsx`
  - Passer `exerciseName` et `setIndex` à `uploadExerciseVideo`

- `supabase/migrations/20260104_video_feedback_functions.sql`
  - Mise à jour trigger `notify_coach_new_video`

### Base de données ✅
- `exercise_set_videos.exercise_name` (TEXT)
- `exercise_set_videos.set_index` (INTEGER)

---

## 🚀 Prochaines étapes

### Phase 1 : Finaliser les services ⏳
1. Modifier la signature de `uploadExerciseVideo`
2. Mettre à jour les mappings dans les fonctions de récupération
3. Tester l'upload avec les nouveaux champs

### Phase 2 : Intégrer ClientVideosTab ⏳
1. Ajouter le système d'onglets dans ClientProgressionView
2. Intégrer le composant ClientVideosTab
3. Tester l'affichage des vidéos

### Phase 3 : Notifications ⏳
1. Mettre à jour le trigger de notification
2. Ajouter le lien de redirection
3. Tester le flux complet

### Phase 4 : Historique performances ⏳
1. Ajouter les icônes vidéo dans le tableau
2. Implémenter les pastilles de notification
3. Tester l'intégration

---

## 🐛 Problèmes connus

### 1. Colonnes manquantes
**Problème :** `exercise_name` et `set_index` n'étaient pas dans la table  
**Solution :** ✅ Colonnes ajoutées

### 2. Service incomplet
**Problème :** `uploadExerciseVideo` ne prend pas `exerciseName` et `setIndex`  
**Solution :** ⏳ À modifier

### 3. Composants non intégrés
**Problème :** `ClientVideosTab` créé mais pas intégré  
**Solution :** ⏳ À faire dans ClientProgressionView

---

## 📚 Documentation liée

- [Architecture complète](./virtus_video_feedback_architecture.md)
- [Intégration du bouton vidéo](./INTEGRATION_BOUTON_VIDEO.md)
- [Corrections caméra et performance_id](./CORRECTIONS_CAMERA_PERFORMANCE_ID.md)

---

**Implémentation par :** Manus AI  
**Date :** 4 janvier 2026  
**Statut :** 🚧 En cours - ~40% complété
