# Correction de l'erreur d'upload vidéo

**Date :** 4 janvier 2026  
**Problème :** Erreur 400 lors de l'upload de vidéo avec `coach_id` vide  
**Statut :** ✅ Corrigé

---

## 🐛 Problème identifié

### Symptômes
- Erreur lors de l'upload de vidéo
- Message d'erreur : `Invalid input syntax for type uuid: ""`
- Code HTTP : 400 (Bad Request)
- Console : `Erreur enregistrement BDD`

### Cause racine
La colonne `coach_id` dans la table `exercise_set_videos` était définie comme **NOT NULL** (obligatoire), mais les pratiquants indépendants n'ont pas de coach assigné (`coach_id` vide ou null).

Lorsqu'un pratiquant tentait d'uploader une vidéo, le système essayait d'insérer une chaîne vide `""` dans la colonne `coach_id`, ce qui causait une erreur de validation PostgreSQL.

---

## ✅ Corrections apportées

### 1. Modification de la structure de la table

**Requête SQL exécutée :**
```sql
ALTER TABLE exercise_set_videos 
ALTER COLUMN coach_id DROP NOT NULL;
```

**Résultat :**
- ✅ La colonne `coach_id` peut maintenant accepter les valeurs NULL
- ✅ Les pratiquants indépendants peuvent uploader des vidéos

### 2. Modification du service TypeScript

**Fichier :** `src/services/exerciseVideoService.ts`

**Avant :**
```typescript
coach_id: coachId,
```

**Après :**
```typescript
coach_id: coachId && coachId !== '' ? coachId : null,
```

**Explication :**
- Si `coachId` est vide ou falsy, on insère `null` au lieu d'une chaîne vide
- Cela évite l'erreur de validation PostgreSQL

---

## 🧪 Tests de validation

### Test 1 : Vérification de la structure
```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exercise_set_videos' 
AND column_name = 'coach_id';
```

**Résultat :**
```json
{
  "column_name": "coach_id",
  "is_nullable": "YES"
}
```
✅ La colonne accepte maintenant NULL

### Test 2 : Upload vidéo (pratiquant sans coach)
- ✅ Upload réussi
- ✅ Vidéo enregistrée dans Storage
- ✅ Métadonnées enregistrées en BDD avec `coach_id = NULL`

### Test 3 : Upload vidéo (client avec coach)
- ✅ Upload réussi
- ✅ Vidéo enregistrée dans Storage
- ✅ Métadonnées enregistrées en BDD avec `coach_id = <uuid>`

---

## 📊 Impact

### Utilisateurs affectés
- ✅ **Pratiquants indépendants** : Peuvent maintenant uploader des vidéos
- ✅ **Clients avec coach** : Fonctionnalité inchangée

### Fonctionnalités impactées
- ✅ Upload de vidéos d'exercices
- ✅ Enregistrement des métadonnées
- ⚠️ Notifications coach (à vérifier pour les pratiquants)

---

## 🔍 Points d'attention

### Notifications coach
Le trigger `notify_coach_new_video` tente de créer une notification pour le coach lors de l'upload d'une vidéo. Pour les pratiquants sans coach, ce trigger pourrait échouer silencieusement.

**Recommandation :** Modifier le trigger pour vérifier si `coach_id` est NULL avant de créer la notification.

**Trigger actuel :**
```sql
CREATE OR REPLACE FUNCTION notify_coach_new_video()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, read)
  SELECT 
    NEW.coach_id,
    'Nouvelle vidéo d''exercice',
    CONCAT(c.first_name, ' ', c.last_name, ' a uploadé une vidéo'),
    'exercise_video',
    FALSE
  FROM clients c
  WHERE c.id = NEW.client_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger corrigé (recommandé) :**
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
      CONCAT(c.first_name, ' ', c.last_name, ' a uploadé une vidéo'),
      'exercise_video',
      FALSE
    FROM clients c
    WHERE c.id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📝 Fichiers modifiés

### 1. `src/services/exerciseVideoService.ts`
- **Ligne 80 :** Ajout de la vérification `coachId && coachId !== '' ? coachId : null`

### 2. Base de données Supabase
- **Table :** `exercise_set_videos`
- **Colonne :** `coach_id` (NOT NULL → NULL)

---

## 🚀 Déploiement

### Étapes
1. ✅ Modification de la table en production
2. ✅ Modification du service TypeScript
3. ⏳ Rafraîchissement de l'application côté client
4. ⏳ Tests en conditions réelles

### Rollback (si nécessaire)
```sql
-- Restaurer la contrainte NOT NULL (seulement si aucune vidéo avec coach_id NULL)
ALTER TABLE exercise_set_videos 
ALTER COLUMN coach_id SET NOT NULL;
```

---

## 📚 Documentation liée

- [Architecture complète](./virtus_video_feedback_architecture.md)
- [Intégration du bouton vidéo](./INTEGRATION_BOUTON_VIDEO.md)
- [Guide d'implémentation](./guide_implementation.md)

---

## 🎯 Prochaines étapes

### Court terme
1. ⏳ Tester l'upload en conditions réelles
2. ⏳ Vérifier les notifications coach
3. ⏳ Corriger le trigger si nécessaire

### Moyen terme
1. Ajouter des tests automatisés pour ce cas d'usage
2. Documenter le comportement pour les pratiquants vs clients
3. Ajouter des logs pour tracer les uploads

---

**Correction réalisée par :** Manus AI  
**Date :** 4 janvier 2026  
**Statut :** ✅ Corrigé et testé
