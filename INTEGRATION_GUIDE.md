# Guide d'intégration rapide - Vidéos et Questionnaires

## 🎯 Objectif

Ce guide vous permet d'intégrer rapidement les fonctionnalités de vidéos d'exercices et de questionnaires dans les pages existantes de Virtus.

---

## 📦 Composants disponibles

### Côté client

- `ExerciseVideoRecorder` - Enregistrement/upload de vidéo
- `ExerciseVideoModal` - Modal wrapper pour l'enregistrement

### Côté coach

- `SessionFeedbackDisplay` - Affichage des questionnaires
- `VideoPlayerModal` - Lecteur vidéo avec commentaires
- `VideoIndicator` - Icône avec pastille de notification

### Services

- `exerciseVideoService` - Gestion des vidéos
- `sessionFeedbackService` - Gestion des feedbacks

---

## 🔧 Intégration côté client

### Étape 1 : Ajouter le bouton d'enregistrement vidéo

**Fichier à modifier :** `src/components/performance/PerformanceEntry.tsx` (ou équivalent)

```typescript
import { useState } from 'react';
import ExerciseVideoModal from '../client/ExerciseVideoModal';
import Button from '../Button';

function PerformanceEntry() {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentPerformanceId, setCurrentPerformanceId] = useState<string | null>(null);
  const [currentExerciseName, setCurrentExerciseName] = useState<string>('');

  // Après validation d'une série
  const handleSerieCompleted = (performanceId: string, exerciseName: string) => {
    setCurrentPerformanceId(performanceId);
    setCurrentExerciseName(exerciseName);
    // Afficher le bouton vidéo
  };

  return (
    <div>
      {/* Votre code existant */}
      
      {/* Bouton pour enregistrer une vidéo */}
      {currentPerformanceId && (
        <Button
          onClick={() => setShowVideoModal(true)}
          variant="secondary"
          className="mt-2"
        >
          📹 Enregistrer une vidéo
        </Button>
      )}

      {/* Modal d'enregistrement */}
      {showVideoModal && currentPerformanceId && (
        <ExerciseVideoModal
          isOpen={showVideoModal}
          clientId={user.id}
          coachId={user.coach_id || ''}
          performanceId={currentPerformanceId}
          exerciseName={currentExerciseName}
          onClose={() => setShowVideoModal(false)}
          onSuccess={(videoUrl, videoId) => {
            console.log('✅ Vidéo uploadée:', videoId);
            setShowVideoModal(false);
            // Optionnel : afficher une notification de succès
          }}
        />
      )}
    </div>
  );
}
```

### Étape 2 : Afficher les vidéos existantes (optionnel)

Si vous voulez afficher les vidéos déjà uploadées :

```typescript
import { useEffect, useState } from 'react';
import { getVideosForPerformance, ExerciseVideo } from '../../services/exerciseVideoService';

function PerformanceHistory() {
  const [videos, setVideos] = useState<ExerciseVideo[]>([]);

  useEffect(() => {
    const loadVideos = async () => {
      const vids = await getVideosForPerformance(performanceId);
      setVideos(vids);
    };
    loadVideos();
  }, [performanceId]);

  return (
    <div>
      {videos.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            📹 {videos.length} vidéo{videos.length > 1 ? 's' : ''} enregistrée{videos.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Intégration côté coach

### Étape 1 : Importer les composants

**Fichier à modifier :** `src/pages/coach/ClientProgressionView.tsx`

```typescript
import { useState, useEffect } from 'react';
import SessionFeedbackDisplay from '../../components/coach/SessionFeedbackDisplay';
import VideoPlayerModal from '../../components/coach/VideoPlayerModal';
import VideoIndicator from '../../components/coach/VideoIndicator';
import { 
  getFeedbackByPerformanceLogId, 
  SessionFeedback 
} from '../../services/sessionFeedbackService';
import { 
  getVideosForPerformance, 
  ExerciseVideo 
} from '../../services/exerciseVideoService';
```

### Étape 2 : Charger les données

```typescript
function ClientProgressionView({ clientId }: { clientId: string }) {
  const [feedbacks, setFeedbacks] = useState<Record<string, SessionFeedback>>({});
  const [videos, setVideos] = useState<Record<string, ExerciseVideo[]>>({});
  const [selectedVideo, setSelectedVideo] = useState<ExerciseVideo | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  // Charger les feedbacks et vidéos pour chaque séance
  useEffect(() => {
    const loadData = async () => {
      // Pour chaque performance_log
      for (const log of performanceLogs) {
        // Charger le feedback de la séance
        const feedback = await getFeedbackByPerformanceLogId(log.id);
        if (feedback) {
          setFeedbacks(prev => ({ ...prev, [log.id]: feedback }));
        }

        // Charger les vidéos pour chaque exercice de la séance
        for (const exercise of log.exercises_performed) {
          const vids = await getVideosForPerformance(exercise.performance_id);
          if (vids.length > 0) {
            setVideos(prev => ({ 
              ...prev, 
              [exercise.performance_id]: vids 
            }));
          }
        }
      }
    };

    loadData();
  }, [performanceLogs]);

  // ... reste du code
}
```

### Étape 3 : Afficher les composants

```typescript
return (
  <div>
    {/* Pour chaque séance */}
    {performanceLogs.map(log => (
      <div key={log.id} className="mb-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">{log.session_name}</h3>

        {/* Afficher le feedback de séance */}
        {feedbacks[log.id] && (
          <div className="mb-4">
            <SessionFeedbackDisplay
              feedback={feedbacks[log.id]}
              onResponseAdded={() => {
                // Rafraîchir le feedback
                getFeedbackByPerformanceLogId(log.id).then(f => {
                  if (f) setFeedbacks(prev => ({ ...prev, [log.id]: f }));
                });
              }}
            />
          </div>
        )}

        {/* Pour chaque exercice de la séance */}
        {log.exercises_performed.map(exercise => (
          <div key={exercise.id} className="mb-2 flex items-center justify-between">
            <span>{exercise.exercise_name}</span>
            <span>{exercise.weight}kg × {exercise.reps} reps</span>

            {/* Indicateur vidéo */}
            {videos[exercise.performance_id] && (
              <VideoIndicator
                videoCount={videos[exercise.performance_id].length}
                unviewedCount={
                  videos[exercise.performance_id].filter(v => !v.viewedByCoach).length
                }
                onClick={() => {
                  setSelectedVideo(videos[exercise.performance_id][0]);
                  setSelectedExercise(exercise);
                }}
              />
            )}
          </div>
        ))}
      </div>
    ))}

    {/* Modal de lecture vidéo */}
    {selectedVideo && selectedExercise && (
      <VideoPlayerModal
        video={selectedVideo}
        exerciseName={selectedExercise.exercise_name}
        performanceDetails={`${selectedExercise.weight}kg × ${selectedExercise.reps} reps (RIR ${selectedExercise.rir})`}
        onClose={() => {
          setSelectedVideo(null);
          setSelectedExercise(null);
        }}
        onCommentAdded={() => {
          // Rafraîchir les vidéos
          getVideosForPerformance(selectedExercise.performance_id).then(vids => {
            setVideos(prev => ({ 
              ...prev, 
              [selectedExercise.performance_id]: vids 
            }));
          });
        }}
      />
    )}
  </div>
);
```

---

## 🎨 Personnalisation

### Modifier les couleurs

Les composants utilisent les classes Tailwind du projet. Pour personnaliser :

```typescript
// Dans ExerciseVideoRecorder.tsx
<div className="bg-white dark:bg-client-card"> // Changez ces classes
```

### Modifier les tailles

```typescript
// VideoIndicator accepte une prop size
<VideoIndicator size="lg" /> // 'sm', 'md', 'lg'
```

### Modifier les limites

```typescript
// Dans src/constants/videoConfig.ts
export const VIDEO_CONFIG = {
  MAX_SIZE_MB: 100, // Changez ici
  MAX_DURATION_SECONDS: 180,
  // ...
};
```

---

## 🐛 Dépannage

### La vidéo ne s'upload pas

1. Vérifier que le bucket `exercise-videos` existe dans Supabase Storage
2. Vérifier les politiques RLS
3. Vérifier la console du navigateur pour les erreurs
4. Vérifier que `clientId` et `coachId` sont bien définis

### Les vidéos ne s'affichent pas côté coach

1. Vérifier que `coach_id` est bien renseigné dans la table `clients`
2. Vérifier les politiques RLS du bucket
3. Vérifier que `getVideosForPerformance()` retourne bien des données

### Les notifications ne fonctionnent pas

1. Vérifier que les triggers SQL sont bien créés :
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%video%' OR tgname LIKE '%feedback%';
```

2. Vérifier que la table `notifications` existe et est accessible

### Erreur "Permission denied"

Vérifier les politiques RLS :

```sql
-- Pour la table exercise_set_videos
SELECT * FROM pg_policies WHERE tablename = 'exercise_set_videos';

-- Pour le bucket storage
SELECT * FROM storage.policies WHERE bucket_id = 'exercise-videos';
```

---

## 📊 Monitoring

### Compter les vidéos uploadées

```typescript
import { countUnviewedVideosForCoach } from '../../services/exerciseVideoService';

const unviewedCount = await countUnviewedVideosForCoach(coachId);
console.log(`${unviewedCount} vidéos non vues`);
```

### Compter les feedbacks non vus

```typescript
import { countUnviewedFeedbacksForCoach } from '../../services/sessionFeedbackService';

const unviewedCount = await countUnviewedFeedbacksForCoach(coachId);
console.log(`${unviewedCount} feedbacks non vus`);
```

### Afficher dans le header coach

```typescript
function CoachHeader() {
  const [unviewedVideos, setUnviewedVideos] = useState(0);
  const [unviewedFeedbacks, setUnviewedFeedbacks] = useState(0);

  useEffect(() => {
    const loadCounts = async () => {
      const vids = await countUnviewedVideosForCoach(coachId);
      const feeds = await countUnviewedFeedbacksForCoach(coachId);
      setUnviewedVideos(vids);
      setUnviewedFeedbacks(feeds);
    };
    loadCounts();
  }, [coachId]);

  return (
    <div>
      {(unviewedVideos + unviewedFeedbacks) > 0 && (
        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
          {unviewedVideos + unviewedFeedbacks} nouveaux
        </span>
      )}
    </div>
  );
}
```

---

## ✅ Checklist d'intégration

### Côté client

- [ ] Bouton "Enregistrer une vidéo" ajouté après validation de série
- [ ] Modal `ExerciseVideoModal` intégrée
- [ ] Props correctement passées (clientId, coachId, performanceId, exerciseName)
- [ ] Callback `onSuccess` géré
- [ ] Tests manuels effectués (filmer, uploader, vérifier notification)

### Côté coach

- [ ] Composants importés dans `ClientProgressionView.tsx`
- [ ] Feedbacks chargés pour chaque séance
- [ ] Vidéos chargées pour chaque exercice
- [ ] `SessionFeedbackDisplay` affiché
- [ ] `VideoIndicator` affiché pour chaque série avec vidéo
- [ ] `VideoPlayerModal` intégrée avec gestion de l'ouverture/fermeture
- [ ] Tests manuels effectués (voir vidéo, commenter, vérifier marquage vu)

### Infrastructure

- [x] Table `exercise_set_videos` créée
- [x] Colonnes coach ajoutées à `session_feedback`
- [x] Triggers de notification créés
- [x] Bucket `exercise-videos` créé
- [x] Politiques RLS configurées
- [ ] Tests de sécurité effectués

---

## 🚀 Prochaines étapes

Une fois l'intégration de base terminée, vous pouvez :

1. **Ajouter des notifications push** pour alerter les coachs en temps réel
2. **Implémenter la compression vidéo** avec ffmpeg.wasm
3. **Générer des miniatures** pour prévisualisation rapide
4. **Ajouter des annotations temporelles** sur les vidéos
5. **Créer une vue "Toutes mes vidéos"** pour les clients
6. **Implémenter la comparaison vidéo** (avant/après)

---

## 📚 Ressources

- **Architecture complète** : `/home/ubuntu/virtus_video_feedback_architecture.md`
- **Documentation d'implémentation** : `/home/ubuntu/virtus/IMPLEMENTATION_COMPLETE.md`
- **Code source des composants** : `/home/ubuntu/virtus/src/components/`
- **Services** : `/home/ubuntu/virtus/src/services/`

---

**Bon développement ! 🎉**
