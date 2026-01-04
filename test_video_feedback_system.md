# Plan de tests - Système vidéos et questionnaires

## 🎯 Objectifs des tests

Valider le bon fonctionnement du système de vidéos d'exercices et de questionnaires de fin de séance.

---

## ✅ Tests d'infrastructure

### Test 1 : Vérification de la base de données

**Objectif :** S'assurer que toutes les tables et colonnes existent

```sql
-- Vérifier la table exercise_set_videos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exercise_set_videos';

-- Vérifier les colonnes de session_feedback
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'session_feedback' 
AND column_name IN ('viewed_by_coach', 'viewed_at', 'coach_response');

-- Vérifier les index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'exercise_set_videos';
```

**Résultat attendu :**
- ✅ Table `exercise_set_videos` avec 14 colonnes
- ✅ Colonnes `viewed_by_coach`, `viewed_at`, `coach_response` dans `session_feedback`
- ✅ 4 index sur `exercise_set_videos`

### Test 2 : Vérification des politiques RLS

```sql
-- Vérifier les politiques de la table exercise_set_videos
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'exercise_set_videos';

-- Vérifier les politiques du bucket storage
SELECT * FROM storage.policies 
WHERE bucket_id = 'exercise-videos';
```

**Résultat attendu :**
- ✅ 2 politiques sur `exercise_set_videos` (client_own, coach_clients)
- ✅ 2 politiques sur le bucket (client_own_storage, coach_clients_storage)

### Test 3 : Vérification des triggers

```sql
-- Vérifier les triggers
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE '%video%' OR tgname LIKE '%feedback%';

-- Vérifier les fonctions
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%video%' OR proname LIKE '%feedback%';
```

**Résultat attendu :**
- ✅ Trigger `trigger_notify_coach_new_video` actif
- ✅ Trigger `trigger_notify_coach_session_feedback` actif
- ✅ Fonction `notify_coach_new_video()` existe
- ✅ Fonction `notify_coach_session_feedback()` existe
- ✅ Fonction `mark_video_as_viewed_by_coach()` existe

### Test 4 : Vérification du bucket Storage

```sql
-- Vérifier que le bucket existe
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'exercise-videos';
```

**Résultat attendu :**
- ✅ Bucket `exercise-videos` existe
- ✅ `public = false` (privé)

---

## ✅ Tests des services

### Test 5 : Service exerciseVideoService

**Fichier de test :** `src/services/exerciseVideoService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  uploadExerciseVideo, 
  getVideosForPerformance,
  markVideoAsViewed,
  addCoachCommentToVideo 
} from './exerciseVideoService';

describe('exerciseVideoService', () => {
  it('devrait uploader une vidéo', async () => {
    const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const result = await uploadExerciseVideo(
      'client-id',
      'coach-id',
      'performance-id',
      mockFile
    );
    expect(result).not.toBeNull();
    expect(result?.videoUrl).toBeDefined();
    expect(result?.videoId).toBeDefined();
  });

  it('devrait récupérer les vidéos d\'une performance', async () => {
    const videos = await getVideosForPerformance('performance-id');
    expect(Array.isArray(videos)).toBe(true);
  });

  it('devrait marquer une vidéo comme vue', async () => {
    const success = await markVideoAsViewed('video-id', 'coach-id');
    expect(success).toBe(true);
  });

  it('devrait ajouter un commentaire', async () => {
    const success = await addCoachCommentToVideo('video-id', 'Bon travail !');
    expect(success).toBe(true);
  });
});
```

### Test 6 : Service sessionFeedbackService

**Fichier de test :** `src/services/sessionFeedbackService.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { 
  markFeedbackAsViewed,
  addCoachResponseToFeedback,
  getFeedbackByPerformanceLogId 
} from './sessionFeedbackService';

describe('sessionFeedbackService', () => {
  it('devrait marquer un feedback comme vu', async () => {
    const success = await markFeedbackAsViewed('feedback-id');
    expect(success).toBe(true);
  });

  it('devrait ajouter une réponse coach', async () => {
    const success = await addCoachResponseToFeedback('feedback-id', 'Merci pour ton retour !');
    expect(success).toBe(true);
  });

  it('devrait récupérer un feedback par performance_log_id', async () => {
    const feedback = await getFeedbackByPerformanceLogId('log-id');
    expect(feedback).toBeDefined();
  });
});
```

---

## ✅ Tests des composants

### Test 7 : ExerciseVideoRecorder

**Scénario de test manuel :**

1. **Ouvrir le composant** dans l'interface client
2. **Cliquer sur "Filmer"**
   - ✅ La caméra s'active
   - ✅ Le bouton "Arrêter l'enregistrement" apparaît
   - ✅ L'indicateur REC est visible
3. **Enregistrer 10 secondes**
4. **Cliquer sur "Arrêter"**
   - ✅ La caméra s'arrête
   - ✅ La prévisualisation s'affiche
   - ✅ Les boutons "Envoyer" et "Refaire" apparaissent
5. **Cliquer sur "Envoyer"**
   - ✅ La barre de progression s'affiche
   - ✅ Le pourcentage augmente
   - ✅ Un message de succès s'affiche
   - ✅ La modal se ferme

**Scénario alternatif : Upload de fichier**

1. **Cliquer sur "Choisir un fichier"**
2. **Sélectionner une vidéo MP4 < 100 MB**
   - ✅ La prévisualisation s'affiche
   - ✅ Le bouton "Envoyer" est actif
3. **Cliquer sur "Envoyer"**
   - ✅ Upload réussi

**Scénario d'erreur : Fichier trop volumineux**

1. **Sélectionner une vidéo > 100 MB**
   - ✅ Message d'erreur affiché
   - ✅ Upload bloqué

### Test 8 : SessionFeedbackDisplay

**Scénario de test manuel :**

1. **Ouvrir le composant** dans l'interface coach
2. **Vérifier l'affichage initial**
   - ✅ Pastille rouge si non vu
   - ✅ Titre "Feedback de séance"
   - ✅ Bouton "Voir détails"
3. **Cliquer sur "Voir détails"**
   - ✅ Les 4 critères s'affichent en étoiles
   - ✅ Le commentaire client s'affiche (si présent)
   - ✅ Le champ de réponse coach s'affiche
4. **Ajouter une réponse**
   - ✅ Le texte est sauvegardé
   - ✅ La pastille rouge disparaît
   - ✅ La réponse s'affiche dans l'encadré vert

### Test 9 : VideoPlayerModal

**Scénario de test manuel :**

1. **Cliquer sur l'icône vidéo** dans l'interface coach
2. **Vérifier l'ouverture de la modal**
   - ✅ La vidéo se charge
   - ✅ Les informations s'affichent (date, taille, durée, format)
   - ✅ Le champ de commentaire est présent
3. **Lire la vidéo**
   - ✅ La vidéo se lit correctement
   - ✅ La pastille "Non visionné" disparaît
4. **Ajouter un commentaire**
   - ✅ Le commentaire est sauvegardé
   - ✅ Il s'affiche dans l'encadré vert
5. **Fermer la modal**
   - ✅ La modal se ferme
   - ✅ L'indicateur vidéo est mis à jour (plus de pastille rouge)

### Test 10 : VideoIndicator

**Scénario de test manuel :**

1. **Afficher une série avec 1 vidéo non vue**
   - ✅ Icône 📹 visible
   - ✅ Pastille rouge avec "1"
2. **Afficher une série avec 3 vidéos dont 2 non vues**
   - ✅ Icône 📹 visible
   - ✅ "×3" affiché
   - ✅ Pastille rouge avec "2"
3. **Afficher une série sans vidéo**
   - ✅ Rien ne s'affiche
4. **Hover sur l'indicateur**
   - ✅ Tooltip informatif s'affiche

---

## ✅ Tests d'intégration

### Test 11 : Workflow complet client → coach

**Scénario :**

1. **Côté client :**
   - Se connecter en tant que client
   - Réaliser une séance d'entraînement
   - Valider une série (ex: Squat 100kg × 10)
   - Cliquer sur "Enregistrer une vidéo"
   - Filmer l'exercice (10 secondes)
   - Uploader la vidéo
   - ✅ Message de succès affiché

2. **Côté coach :**
   - Se connecter en tant que coach
   - ✅ Notification "Nouvelle vidéo d'exercice" reçue
   - Ouvrir le profil du client
   - Ouvrir l'historique des performances
   - ✅ Icône 📹 avec pastille rouge visible
   - Cliquer sur l'icône
   - ✅ Modal de lecture s'ouvre
   - Lire la vidéo
   - ✅ Pastille rouge disparaît
   - Ajouter un commentaire "Bonne amplitude, attention au dos"
   - ✅ Commentaire sauvegardé

3. **Retour côté client :**
   - Rafraîchir la page
   - Ouvrir l'historique
   - ✅ Commentaire du coach visible

### Test 12 : Workflow questionnaire de fin de séance

**Scénario :**

1. **Côté client :**
   - Terminer une séance
   - Remplir le questionnaire :
     - Fatigue pré-séance : 3/10
     - Qualité du sommeil : 8/10
     - Difficulté perçue : 7/10
     - Plaisir : 9/10
     - Commentaire : "Très bonne séance !"
   - Valider
   - ✅ Questionnaire enregistré

2. **Côté coach :**
   - ✅ Notification "Nouveau feedback de séance" reçue
   - Ouvrir le profil du client
   - Ouvrir l'historique des performances
   - ✅ Encadré "Feedback de séance" avec pastille rouge
   - Cliquer sur "Voir détails"
   - ✅ Les 4 critères s'affichent correctement
   - ✅ Le commentaire client s'affiche
   - Ajouter une réponse : "Continue comme ça !"
   - ✅ Réponse sauvegardée
   - ✅ Pastille rouge disparaît

---

## ✅ Tests de sécurité

### Test 13 : Isolation des données client

**Scénario :**

1. **Client A** uploade une vidéo
2. **Client B** (différent coach) tente d'accéder à la vidéo de Client A
   - ✅ Accès refusé (erreur 403 ou vidéo non visible)

### Test 14 : Isolation des données coach

**Scénario :**

1. **Coach A** a un client qui uploade une vidéo
2. **Coach B** (différent coach) tente d'accéder à la vidéo
   - ✅ Accès refusé

### Test 15 : Accès direct aux vidéos

**Scénario :**

1. Copier l'URL d'une vidéo
2. Se déconnecter
3. Tenter d'accéder à l'URL
   - ✅ Accès refusé (URL signée expirée ou authentification requise)

---

## ✅ Tests de performance

### Test 16 : Upload de vidéo volumineuse

**Scénario :**

1. Uploader une vidéo de 90 MB
   - ✅ Upload réussi en < 2 minutes (connexion 10 Mbps)
   - ✅ Barre de progression fluide

### Test 17 : Chargement de l'historique avec 50 vidéos

**Scénario :**

1. Client avec 50 vidéos uploadées
2. Coach ouvre l'historique des performances
   - ✅ Chargement en < 3 secondes
   - ✅ Interface fluide

### Test 18 : Lecture de vidéo sur mobile

**Scénario :**

1. Ouvrir l'interface coach sur mobile
2. Cliquer sur une vidéo
   - ✅ Lecture fluide
   - ✅ Contrôles adaptés au mobile

---

## ✅ Tests de compatibilité

### Test 19 : Navigateurs

**Tester sur :**
- ✅ Chrome (desktop)
- ✅ Firefox (desktop)
- ✅ Safari (desktop)
- ✅ Chrome (mobile Android)
- ✅ Safari (mobile iOS)

**Fonctionnalités à vérifier :**
- Enregistrement vidéo
- Upload de fichier
- Lecture vidéo
- Affichage des composants

### Test 20 : Formats vidéo

**Tester l'upload de :**
- ✅ MP4
- ✅ MOV
- ✅ WEBM
- ❌ AVI (doit être rejeté)
- ❌ MKV (doit être rejeté)

---

## 📊 Résultats attendus

### Critères de succès

- ✅ Tous les tests d'infrastructure passent
- ✅ Tous les tests de services passent
- ✅ Tous les tests de composants passent
- ✅ Tous les tests d'intégration passent
- ✅ Tous les tests de sécurité passent
- ✅ Au moins 90% des tests de performance passent
- ✅ Au moins 80% des tests de compatibilité passent

### Métriques de qualité

- **Couverture de code** : > 80%
- **Temps de chargement** : < 3 secondes
- **Taux d'erreur** : < 1%
- **Satisfaction utilisateur** : > 4/5

---

## 🐛 Rapport de bugs

### Template de rapport

```markdown
**Titre :** [Description courte du bug]

**Gravité :** Critique / Élevée / Moyenne / Faible

**Étapes pour reproduire :**
1. ...
2. ...
3. ...

**Résultat attendu :**
...

**Résultat obtenu :**
...

**Environnement :**
- Navigateur : ...
- OS : ...
- Version : ...

**Captures d'écran :**
[Joindre si possible]

**Logs :**
```
[Copier les logs de la console]
```
```

---

## ✅ Validation finale

### Checklist avant déploiement

- [ ] Tous les tests passent
- [ ] Aucun bug critique
- [ ] Documentation à jour
- [ ] Code review effectué
- [ ] Migration SQL testée en staging
- [ ] Bucket Storage créé en production
- [ ] Politiques RLS vérifiées
- [ ] Monitoring en place
- [ ] Plan de rollback préparé

---

**Tests réalisés le :** [Date]  
**Par :** [Nom]  
**Statut :** ✅ Validé / ⚠️ En cours / ❌ Échec
