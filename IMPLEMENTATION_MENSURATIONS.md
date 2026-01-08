# Implémentation du système de mensurations avec configuration

## Récapitulatif de l'avancement

### ✅ Phase 1 : Tables de base de données (TERMINÉ)

Deux tables ont été créées dans Supabase :

#### Table `client_measurements`
Stocke l'historique des mensurations de chaque client avec 13 champs :
- `weight` : Poids (kg)
- `neck` : Tour de cou (cm)
- `chest` : Tour de poitrine (cm)
- `waist` : Tour de taille (cm)
- `hips` : Tour de hanches (cm)
- `glutes` : Tour de fessiers (cm)
- `thigh` : Tour de cuisses (cm)
- `calf` : Tour de mollets (cm)
- `arm` : Tour de bras (cm)
- `forearm` : Tour d'avant-bras (cm)
- `shoulder` : Tour d'épaules (cm)
- `body_fat` : Masse grasse (%)
- `muscle_mass` : Masse musculaire (kg)

#### Table `client_measurement_settings`
Stocke la configuration de visibilité des mensurations pour chaque client (définie par le coach).

### ✅ Phase 2 : Services (TERMINÉ)

Fichier créé : `/src/services/measurementsService.ts`

**Fonctions disponibles** :
- `getClientMeasurements(clientId)` : Récupère l'historique des mensurations
- `createClientMeasurement(clientId, measurement)` : Crée une nouvelle entrée
- `updateClientMeasurement(measurementId, measurement)` : Met à jour une entrée
- `deleteClientMeasurement(measurementId)` : Supprime une entrée
- `getMeasurementSettings(clientId)` : Récupère les paramètres de visibilité
- `upsertMeasurementSettings(clientId, coachId, settings)` : Crée/met à jour les paramètres

### ✅ Phase 3 : Modal de configuration pour le coach (TERMINÉ)

Fichier créé : `/src/components/coach/MeasurementSettingsModal.tsx`

**Fonctionnalités** :
- Liste de tous les champs de mensuration avec toggle ON/OFF
- Sauvegarde des paramètres dans la base de données
- Interface moderne avec feedback visuel

---

## 🔄 Phases restantes

### Phase 4 : Modifier l'interface client

**Fichier à modifier** : `/src/pages/client/ClientProfile.tsx`

**Modifications nécessaires** :
1. Remplacer l'ancien système de sauvegarde des mensurations (qui utilisait `nutrition.measurements`)
2. Charger les paramètres de visibilité depuis `client_measurement_settings`
3. Afficher uniquement les champs activés par le coach
4. Utiliser `createClientMeasurement()` pour sauvegarder les nouvelles mensurations
5. Afficher l'historique depuis `client_measurements` au lieu de `nutrition.historyLog`
6. Mettre à jour le graphique pour utiliser les nouvelles données

### Phase 5 : Modifier l'interface coach

**Fichier à modifier** : `/src/pages/ClientProfile.tsx` (interface coach)

**Modifications nécessaires** :
1. Ajouter un bouton "Paramètres" (icône engrenage) dans la section "Suivi Mensurations & Photos"
2. Intégrer le modal `MeasurementSettingsModal`
3. Afficher l'historique des mensurations du client depuis `client_measurements`
4. Mettre à jour le graphique pour utiliser les nouvelles données

### Phase 6 : Tests et validation

Voir les étapes de test ci-dessous.

---

## 📋 Étapes de test recommandées

### Test 1 : Vérification des tables (BDD)

**Objectif** : S'assurer que les tables sont correctement créées

```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('client_measurements', 'client_measurement_settings');

-- Vérifier la structure de client_measurements
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'client_measurements';

-- Vérifier la structure de client_measurement_settings
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'client_measurement_settings';
```

**Résultat attendu** : Les deux tables doivent exister avec toutes les colonnes listées ci-dessus.

---

### Test 2 : Configuration par le coach

**Objectif** : Tester le modal de configuration des mensurations

**Étapes** :
1. Se connecter en tant que coach
2. Accéder au profil d'un client
3. Aller dans la section "Suivi Mensurations & Photos"
4. Cliquer sur le bouton "Paramètres" (engrenage)
5. Désactiver quelques mensurations (ex: tour de cou, tour d'avant-bras)
6. Cliquer sur "Enregistrer"

**Vérification BDD** :
```sql
SELECT * FROM client_measurement_settings WHERE client_id = '<ID_CLIENT>';
```

**Résultat attendu** : 
- Les champs désactivés doivent avoir `false` dans la colonne correspondante
- Les champs activés doivent avoir `true`

---

### Test 3 : Saisie des mensurations par le client

**Objectif** : Vérifier que le client ne voit que les champs activés

**Étapes** :
1. Se connecter en tant que client
2. Accéder à "Mensurations & Photos"
3. Vérifier que seuls les champs activés par le coach sont visibles
4. Remplir quelques champs
5. Cliquer sur "Enregistrer"

**Vérification BDD** :
```sql
SELECT * FROM client_measurements WHERE client_id = '<ID_CLIENT>' ORDER BY recorded_at DESC LIMIT 1;
```

**Résultat attendu** :
- Une nouvelle ligne doit être créée avec les valeurs saisies
- Les champs non remplis doivent être `NULL`

---

### Test 4 : Affichage de l'historique

**Objectif** : Vérifier que l'historique s'affiche correctement

**Étapes** :
1. Saisir plusieurs enregistrements de mensurations à des dates différentes
2. Vérifier que le graphique affiche l'évolution
3. Vérifier que le tableau affiche toutes les entrées

**Vérification BDD** :
```sql
SELECT recorded_at, weight, waist, hips FROM client_measurements 
WHERE client_id = '<ID_CLIENT>' ORDER BY recorded_at DESC;
```

**Résultat attendu** :
- Le graphique doit montrer l'évolution des mensurations sélectionnées
- Le tableau doit lister toutes les entrées par ordre chronologique décroissant

---

### Test 5 : Visibilité côté coach

**Objectif** : Vérifier que le coach voit toutes les mensurations du client

**Étapes** :
1. Se connecter en tant que coach
2. Accéder au profil du client
3. Aller dans "Suivi Mensurations & Photos"
4. Vérifier que toutes les mensurations enregistrées sont visibles

**Résultat attendu** :
- Le coach doit voir toutes les mensurations, même celles désactivées pour le client
- Le graphique et le tableau doivent afficher les données correctement

---

### Test 6 : Modification des paramètres

**Objectif** : Vérifier que les modifications de configuration sont prises en compte immédiatement

**Étapes** :
1. Coach : Désactiver un champ (ex: tour de hanches)
2. Client : Recharger la page et vérifier que le champ a disparu
3. Coach : Réactiver le champ
4. Client : Recharger la page et vérifier que le champ est de nouveau visible

**Résultat attendu** :
- Les modifications doivent être visibles immédiatement après rechargement

---

### Test 7 : Migration des anciennes données

**Objectif** : S'assurer que les anciennes données (stockées dans `nutrition.historyLog`) ne sont pas perdues

**Note** : Une migration de données sera nécessaire si des clients ont déjà enregistré des mensurations dans l'ancien système.

**Script de migration** (à exécuter si nécessaire) :
```sql
-- À développer selon les besoins
-- Exemple : copier les données de nutrition.historyLog vers client_measurements
```

---

## 🚀 Prochaines étapes recommandées

1. **Tester les phases 1-3** (tables, services, modal) en priorité
2. **Implémenter la phase 4** (interface client)
3. **Tester la phase 4** avec les tests 3 et 4
4. **Implémenter la phase 5** (interface coach)
5. **Tester la phase 5** avec les tests 2, 5 et 6
6. **Migration des données** si nécessaire (test 7)

---

## ⚠️ Points d'attention

- Les politiques RLS (Row Level Security) sont activées sur les deux tables
- Les clients ne peuvent voir que leurs propres mensurations
- Les coachs peuvent voir les mensurations de leurs clients uniquement
- Par défaut, tous les champs sont visibles si aucune configuration n'existe
