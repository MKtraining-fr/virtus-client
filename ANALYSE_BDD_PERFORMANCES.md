# Analyse de la Base de Données - Performances des Séances

## 1. Tables identifiées

### Tables principales pour les performances

| Table | Description | Données clés |
|-------|-------------|--------------|
| `client_exercise_performance` | **Performances réalisées lors des séances** | `reps_achieved`, `load_achieved`, `set_number`, `performed_at` |
| `client_session_exercises` | Exercices assignés dans une séance client | `exercise_id`, `client_id`, `sets`, `reps`, `load` |
| `client_sessions` | Séances du client | `status` (pending/completed), `completed_at` |
| `client_exercise_records` | Records manuels (via "Saisir une perf") | `weight`, `reps`, `one_rm_calculated`, `source` |
| `client_exercise_projections` | Projections calculées | `projected_weight`, `target_reps`, `nervous_profile` |

### Flux de données actuel

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SÉANCES VALIDÉES                                  │
│                                                                          │
│  client_sessions (status='completed')                                    │
│         │                                                                │
│         ▼                                                                │
│  client_session_exercises (exercise_id, client_id)                       │
│         │                                                                │
│         ▼                                                                │
│  client_exercise_performance (reps_achieved, load_achieved)              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        SAISIE MANUELLE                                   │
│                                                                          │
│  Onglet "Saisir une perf"                                                │
│         │                                                                │
│         ▼                                                                │
│  client_exercise_records (weight, reps, one_rm_calculated)               │
│         │                                                                │
│         ▼                                                                │
│  client_exercise_projections (projections calculées)                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Données trouvées

### client_exercise_performance (67 enregistrements)
- Contient les performances réelles des séances validées
- Exemple : "Tirage horizontal prise neutre" - 5 reps @ 5kg
- Lié à `client_session_exercises` via `client_session_exercise_id`
- Contient : `reps_achieved`, `load_achieved`, `set_number`, `performed_at`

### client_exercise_records (4 enregistrements)
- Contient les records saisis manuellement
- Exemple : "V-squat (positions ventral)" - 180.5kg @ 2 reps → 1RM = 185.66kg
- Contient : `weight`, `reps`, `one_rm_calculated`, `source='manual'`

## 3. Problème identifié

**Actuellement** : Les projections (`client_exercise_projections`) ne sont alimentées que par les records manuels (`client_exercise_records`).

**Ce qui manque** : Les performances des séances validées (`client_exercise_performance`) ne sont pas utilisées pour calculer les projections et le 1RM.

## 4. Solution proposée

### Option A : Synchronisation automatique (recommandée)

Créer un trigger ou une fonction qui, lors de la validation d'une séance :
1. Récupère les performances de `client_exercise_performance`
2. Calcule le 1RM pour chaque exercice
3. Met à jour `client_exercise_records` avec `source='session'`
4. Déclenche le recalcul des projections

### Option B : Requête combinée dans le frontend

Modifier `ProjectionsDisplay.tsx` pour :
1. Récupérer les données de `client_exercise_projections` (comme actuellement)
2. **ET** récupérer les performances de `client_exercise_performance`
3. Calculer le 1RM côté client si nécessaire
4. Afficher les données combinées

### Option C : Vue SQL combinée

Créer une vue SQL qui combine :
- `client_exercise_records` (saisie manuelle)
- `client_exercise_performance` (séances validées)

Et utiliser cette vue dans le frontend.

## 5. Recommandation

**Option A** est la plus robuste car elle :
- Centralise les données dans `client_exercise_records`
- Maintient la cohérence des projections
- Ne nécessite pas de modifications majeures du frontend
- Permet de tracer la source des données (`source='manual'` vs `source='session'`)

## 6. Implémentation suggérée

1. **Créer une fonction PostgreSQL** `sync_session_performance_to_records()` qui :
   - Prend les performances de `client_exercise_performance`
   - Calcule le 1RM avec la formule de Brzycki
   - Insère/met à jour dans `client_exercise_records`

2. **Créer un trigger** sur `client_sessions` qui :
   - Se déclenche quand `status` passe à `'completed'`
   - Appelle la fonction de synchronisation

3. **Modifier le frontend** pour afficher la source des données (manuel vs séance)
