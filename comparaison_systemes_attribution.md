# Comparaison des Systèmes d'Attribution de Programmes

## SYSTÈME 1 : `program_assignments` (Référence légère)

### Architecture
```
programs (template)
  ↓
program_assignments (référence + customizations)
  ↓
sessions (template partagé)
  ↓
session_exercises (template partagé)
```

### Colonnes de `program_assignments`
- `program_id` → Référence au template
- `client_id`, `coach_id`
- `start_date`, `end_date`
- `current_week`, `current_session` → Progression
- `status` → active, paused, completed, cancelled
- `customizations` (jsonb) → Modifications spécifiques

### ✅ AVANTAGES

1. **Économie d'espace** : Un seul template partagé par tous les clients
2. **Mises à jour centralisées** : Si le coach améliore son template, tous les clients peuvent en bénéficier
3. **Simplicité de maintenance** : Pas de duplication de données
4. **Traçabilité** : On sait toujours quel template a été utilisé
5. **Flexibilité** : Le champ `customizations` (jsonb) permet des ajustements par client sans dupliquer tout

### ❌ INCONVÉNIENTS

1. **Modifications limitées** : Les customizations en JSON sont moins flexibles qu'une vraie duplication
2. **Complexité des requêtes** : Besoin de merger template + customizations à chaque lecture
3. **Risque de casse** : Si le template est supprimé, tous les assignments sont impactés
4. **Historique limité** : Si le template change, difficile de savoir ce qu'avait le client à l'origine
5. **Personnalisation restreinte** : Difficile de modifier profondément un programme pour un client spécifique

---

## SYSTÈME 2 : `client_programs` + `client_sessions` + `client_session_exercises` (Duplication complète)

### Architecture
```
programs (template)
  ↓ [DUPLICATION]
client_programs (copie indépendante)
  ↓
client_sessions (copie indépendante)
  ↓
client_session_exercises (copie indépendante)
```

### Colonnes de `client_programs`
- `program_template_id` → Référence au template original (optionnel)
- `client_id`, `coach_id`
- `name`, `objective`, `week_count` → Copie modifiable
- `assigned_at`, `start_date`, `end_date`
- `status`, `current_week`, `current_session_index`

### ✅ AVANTAGES

1. **Personnalisation totale** : Chaque client a sa propre copie modifiable à 100%
2. **Indépendance** : La suppression du template n'impacte pas les programmes attribués
3. **Historique préservé** : On garde exactement ce qui a été donné au client
4. **Simplicité des requêtes** : Pas besoin de merger, tout est direct
5. **Évolution indépendante** : Le coach peut modifier le programme d'un client sans impacter les autres
6. **Performances** : Requêtes plus rapides (pas de jointures complexes avec customizations)

### ❌ INCONVÉNIENTS

1. **Duplication massive** : Beaucoup d'espace disque utilisé
2. **Maintenance complexe** : Si un exercice est supprimé/modifié, impact sur toutes les copies
3. **Incohérence potentielle** : Les copies peuvent diverger du template
4. **Pas de mises à jour automatiques** : Amélioration du template ≠ amélioration des copies
5. **Redondance** : Mêmes données répétées pour chaque client

---

## SYSTÈME 3 : HYBRIDE (Ma recommandation)

### Architecture recommandée
```
programs (template coach)
  ↓
program_assignments (attribution + métadonnées)
  ↓
client_programs (copie au moment de l'attribution)
  ↓
client_sessions + client_session_exercises (copie modifiable)
```

### Workflow proposé

#### 1. **Création du template par le coach**
- Stocké dans `programs`, `sessions`, `session_exercises`
- Réutilisable, modifiable, supprimable

#### 2. **Attribution à un client**
- Création d'un `program_assignment` (métadonnées)
- **DUPLICATION** dans `client_programs`, `client_sessions`, `client_session_exercises`
- Le `program_template_id` garde la référence au template original
- Le client obtient une **copie indépendante et modifiable**

#### 3. **Avantages du système hybride**

✅ **Meilleur des deux mondes** :
- Template réutilisable et maintenable (coach)
- Copie indépendante et personnalisable (client)
- Historique préservé via `program_template_id`
- Aucun risque si le template est supprimé

✅ **Flexibilité maximale** :
- Coach peut modifier son template sans impacter les clients
- Coach peut personnaliser le programme d'un client spécifique
- Client garde son programme même si le template disparaît

✅ **Traçabilité** :
- `program_assignments` : Métadonnées d'attribution (dates, status, progression)
- `program_template_id` : Lien vers le template original
- Possibilité de comparer template vs copie client

### Structure détaillée

#### Table `program_assignments`
```sql
- id
- program_template_id (uuid) → Référence au template original
- client_program_id (uuid) → Référence à la copie client
- client_id, coach_id
- assigned_at (timestamp)
- start_date, end_date
- status (active, paused, completed, cancelled)
```

#### Table `client_programs` (copie modifiable)
```sql
- id
- program_template_id (uuid, nullable) → Référence optionnelle
- client_id, coach_id
- name, objective, week_count
- created_at, updated_at
- is_from_template (boolean) → Distinguer template vs création client
```

---

## 📊 TABLEAU COMPARATIF

| Critère | Système 1 (Référence) | Système 2 (Duplication) | Système 3 (Hybride) |
|---------|----------------------|------------------------|---------------------|
| **Espace disque** | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐ Important | ⭐⭐⭐ Modéré |
| **Personnalisation** | ⭐⭐ Limitée | ⭐⭐⭐⭐⭐ Totale | ⭐⭐⭐⭐⭐ Totale |
| **Simplicité requêtes** | ⭐⭐ Complexe | ⭐⭐⭐⭐⭐ Simple | ⭐⭐⭐⭐ Simple |
| **Indépendance** | ⭐⭐ Dépendant | ⭐⭐⭐⭐⭐ Indépendant | ⭐⭐⭐⭐⭐ Indépendant |
| **Historique** | ⭐⭐ Limité | ⭐⭐⭐⭐⭐ Complet | ⭐⭐⭐⭐⭐ Complet |
| **Maintenance** | ⭐⭐⭐⭐ Facile | ⭐⭐ Complexe | ⭐⭐⭐ Modérée |
| **Traçabilité** | ⭐⭐⭐⭐⭐ Excellente | ⭐⭐⭐ Moyenne | ⭐⭐⭐⭐⭐ Excellente |

---

## 🎯 MA RECOMMANDATION FINALE

### **SYSTÈME 3 (HYBRIDE)** avec cette logique :

1. **`programs` + `sessions` + `session_exercises`**
   - Templates réutilisables des coachs
   - Modifiables sans impacter les attributions

2. **`client_created_programs` + `client_created_sessions` + `client_created_session_exercises`**
   - Utilisé pour DEUX cas :
     - Programmes créés directement par les clients
     - Programmes attribués par les coachs (copie du template)

3. **`program_assignments`**
   - Métadonnées d'attribution uniquement
   - Référence au template ET à la copie client
   - Gestion de la progression (current_week, current_session)

### Workflow d'attribution

```javascript
// 1. Coach attribue un template à un client
async function assignProgramToClient(templateId, clientId, coachId) {
  // Récupérer le template
  const template = await getProgram(templateId);
  const sessions = await getSessions(templateId);
  const exercises = await getAllExercises(sessions);
  
  // Dupliquer dans client_created_*
  const clientProgram = await createClientProgram({
    client_id: clientId,
    coach_id: coachId,
    name: template.name,
    objective: template.objective,
    week_count: template.week_count,
    // Pas de program_template_id ici, on le met dans program_assignments
  });
  
  // Dupliquer les séances et exercices
  for (const session of sessions) {
    const clientSession = await createClientSession({
      program_id: clientProgram.id,
      ...session
    });
    
    for (const exercise of session.exercises) {
      await createClientSessionExercise({
        session_id: clientSession.id,
        ...exercise
      });
    }
  }
  
  // Créer l'assignment pour la traçabilité
  await createProgramAssignment({
    program_template_id: templateId,
    client_program_id: clientProgram.id,
    client_id: clientId,
    coach_id: coachId,
    assigned_at: new Date(),
    status: 'active'
  });
  
  return clientProgram;
}
```

### Avantages de cette approche

✅ **Une seule structure pour les programmes clients** : Qu'ils soient créés par le client ou attribués par le coach, ils sont dans les mêmes tables

✅ **Pas de redondance de tables** : On réutilise `client_created_*` pour les deux cas

✅ **Personnalisation totale** : Le coach peut modifier le programme d'un client après attribution

✅ **Traçabilité** : `program_assignments` garde la référence au template original

✅ **Simplicité du code** : Les mêmes services (`clientCreatedProgramService`) gèrent les deux cas

---

## 🔧 MODIFICATIONS À APPORTER

Si vous adoptez cette recommandation :

1. **Ajouter une colonne dans `client_created_programs`** :
   ```sql
   ALTER TABLE client_created_programs 
   ADD COLUMN source_type TEXT DEFAULT 'client_created' 
   CHECK (source_type IN ('client_created', 'coach_assigned'));
   ```

2. **Utiliser `program_assignments` uniquement pour** :
   - Traçabilité (quel template a été utilisé)
   - Métadonnées d'attribution (dates, status)
   - Progression (current_week, current_session)

3. **Abandonner ou réaffecter `client_programs`** :
   - Soit supprimer cette table (redondante)
   - Soit la renommer et l'utiliser autrement

Qu'en pensez-vous ? Voulez-vous que j'implémente ce système hybride ?
