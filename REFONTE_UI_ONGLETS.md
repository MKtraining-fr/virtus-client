# Refonte UI - Système de Suivi des Performances

## Vue d'ensemble

Cette refonte restaure le design original avec 3 onglets séparés tout en conservant les améliorations apportées (recherche, filtres, liste compacte, affichage du 1RM).

## Architecture des composants

### PerformanceSection.tsx
**Rôle** : Composant principal gérant la navigation par onglets

**Fonctionnalités** :
- Navigation entre 3 onglets : Projections & Profil | Évolution | Saisir une perf
- Gestion de l'état actif avec indicateurs visuels
- Rafraîchissement automatique après ajout d'une performance
- Info box explicative en bas de page

**Props** :
- `clientId: string` - ID du client
- `isCoach?: boolean` - Mode coach ou client (pour futures évolutions)

---

### ProjectionsTab.tsx
**Rôle** : Affichage des projections de performances et du profil nerveux

**Fonctionnalités** :
1. **Liste compacte des exercices**
   - Affichage en grille (2 colonnes sur desktop)
   - Carte par exercice avec nom, nombre de performances et 1RM
   - Sélection visuelle de l'exercice actif

2. **Barre de recherche**
   - Recherche en temps réel par nom d'exercice
   - Icône de recherche intégrée

3. **Filtres de période**
   - 1M (1 mois), 3M (3 mois), 6M (6 mois), ALL (tout)
   - Boutons avec état actif visuel
   - Filtrage côté serveur pour optimiser les performances

4. **Tableau des projections**
   - Colonnes : RM | Projection | Réel | Écart
   - Code couleur pour les écarts (vert = dépassement, rouge = en-dessous)
   - Indicateurs visuels : ▲ (dépassement) ▼ (en-dessous)
   - Mention "(projection)" pour les valeurs non testées

5. **Profil nerveux**
   - Graphique radar (Recharts)
   - Comparaison réel vs projection en pourcentage
   - Légende explicative des scores
   - Informations pédagogiques sur l'interprétation

**États gérés** :
- `exercises` : Liste des exercices avec leurs records
- `selectedExerciseId` : Exercice actuellement sélectionné
- `projections` : Données de projection pour l'exercice sélectionné
- `searchTerm` : Terme de recherche
- `periodFilter` : Filtre de période actif
- `isLoading` : État de chargement

**Requêtes Supabase** :
1. Chargement des exercices avec jointure sur la table `exercises`
2. Filtrage par `client_id` et période
3. Chargement des projections depuis `client_exercise_projections`

---

### EvolutionTab.tsx
**Rôle** : Visualisation de l'évolution des performances dans le temps

**Fonctionnalités** :
1. **Liste compacte des exercices**
   - Identique à ProjectionsTab pour cohérence UI
   - Affichage du 1RM dans chaque carte

2. **Barre de recherche et filtres**
   - Fonctionnement identique à ProjectionsTab
   - Filtres de période appliqués aux graphiques

3. **Graphique d'évolution du 1RM**
   - LineChart (Recharts)
   - Axe X : Dates (format JJ/MM)
   - Axe Y : Poids en kg
   - Courbe violette avec points de données
   - Tooltip interactif

4. **Graphique Charge & Répétitions**
   - LineChart avec double axe Y
   - Axe Y gauche : Charge (kg) - courbe bleue
   - Axe Y droit : Répétitions - courbe verte
   - Permet de visualiser la corrélation charge/volume

**États gérés** :
- Identiques à ProjectionsTab
- `chartData` : Données formatées pour les graphiques

**Format des données graphiques** :
```typescript
interface ChartDataPoint {
  date: string;        // Format JJ/MM
  oneRM: number;       // 1RM arrondi
  weight: number;      // Charge utilisée
  reps: number;        // Répétitions effectuées
}
```

---

## Formules et calculs

### Calcul du 1RM (Brzycki avec ajustement RIR)
```
1RM_ajusté = Poids / (1.0278 - 0.0278 × Reps) × (1 - RIR × 0.025)
```

**Paramètres** :
- `Poids` : Charge soulevée en kg
- `Reps` : Nombre de répétitions effectuées
- `RIR` : Reps In Reserve (répétitions en réserve, 0-5)

### Calcul du profil nerveux
```
Score = (Performance_Réelle / Projection_Théorique) × 100
```

**Interprétation** :
- Score > 100% : Force nerveuse élevée (dépasse les projections)
- Score ≈ 100% : Profil équilibré (conforme aux projections)
- Score < 100% : Potentiel d'amélioration (en-dessous des projections)

---

## Tables Supabase utilisées

### client_exercise_records
Stocke les performances enregistrées par le client.

**Colonnes principales** :
- `id` : UUID
- `client_id` : UUID (référence vers profiles)
- `exercise_id` : UUID (référence vers exercises)
- `weight` : NUMERIC (charge en kg)
- `reps` : INTEGER (répétitions)
- `sets` : INTEGER (séries)
- `rir` : INTEGER (reps in reserve)
- `estimated_1rm` : NUMERIC (calculé automatiquement par trigger)
- `created_at` : TIMESTAMP

**Trigger** : Calcul automatique du 1RM à chaque insertion/modification

### client_exercise_projections
Stocke les projections de performances (1RM à 15RM).

**Colonnes principales** :
- `id` : UUID
- `client_id` : UUID
- `exercise_id` : UUID
- `rep_range` : INTEGER (1 à 15)
- `projected_weight` : NUMERIC (projection théorique)
- `actual_performance` : NUMERIC (performance réelle si testée)
- `created_at` : TIMESTAMP

**Trigger** : Génération automatique des 15 projections à chaque nouveau record

### exercises
Table de référence des exercices disponibles.

**Colonnes principales** :
- `id` : UUID
- `name` : TEXT (nom de l'exercice)
- `category` : TEXT (catégorie : force, cardio, etc.)
- `coach_id` : UUID (exercices personnalisés par coach)

---

## Améliorations apportées

### Par rapport à la version précédente (vue unique)
1. ✅ **Séparation claire des fonctionnalités** : Chaque onglet a un objectif distinct
2. ✅ **Navigation intuitive** : Onglets visuellement distincts avec icônes
3. ✅ **Moins de scroll** : Contenu organisé par onglet au lieu d'une longue page
4. ✅ **Meilleure lisibilité** : Focus sur une fonctionnalité à la fois

### Par rapport à la version initiale (sans recherche/filtres)
1. ✅ **Recherche d'exercices** : Autocomplete en temps réel
2. ✅ **Filtres de période** : 1M, 3M, 6M, ALL pour cibler les données
3. ✅ **Liste compacte** : Affichage scalable pour des dizaines d'exercices
4. ✅ **1RM visible** : Directement dans la liste sans avoir à cliquer
5. ✅ **Code couleur** : Différenciation visuelle réel vs projection

---

## Responsive Design

### Desktop (≥ 768px)
- Liste des exercices : 2 colonnes
- Graphiques : Pleine largeur
- Filtres : Alignés horizontalement

### Mobile (< 768px)
- Liste des exercices : 1 colonne
- Graphiques : Pleine largeur avec scroll horizontal si nécessaire
- Filtres : Peuvent passer en 2 lignes

---

## États de chargement et erreurs

### État vide (aucune performance)
- Icône illustrative (Activity ou TrendingUp)
- Message explicatif
- Redirection vers l'onglet "Saisir une perf"

### État de chargement
- Spinner animé
- Message "Chargement..."

### Erreurs
- Gestion des erreurs dans les `try/catch`
- Logs console pour debugging
- Affichage gracieux si données manquantes

---

## Prochaines évolutions possibles

### Court terme
- [ ] Ajouter un bouton "Exporter en PDF" pour les graphiques
- [ ] Permettre de comparer 2 exercices côte à côte
- [ ] Ajouter des annotations sur les graphiques (blessure, changement de programme)

### Moyen terme
- [ ] Intégrer dans l'interface client (pratiquant)
- [ ] Connecter avec les séances d'entraînement assignées
- [ ] Notifications coach-client sur nouveaux records

### Long terme
- [ ] Analyse prédictive avec IA (projection de progression)
- [ ] Détection automatique de plateaux
- [ ] Recommandations personnalisées de périodisation

---

## Tests recommandés

### Fonctionnels
1. ✅ Saisie d'une nouvelle performance
2. ✅ Affichage dans la liste compacte
3. ✅ Recherche d'exercice
4. ✅ Filtres de période
5. ✅ Sélection d'un exercice
6. ✅ Affichage des projections
7. ✅ Affichage du profil nerveux
8. ✅ Graphiques d'évolution

### Performance
1. ⏳ Chargement avec 50+ exercices
2. ⏳ Filtrage avec 100+ records
3. ⏳ Recherche en temps réel

### Responsive
1. ⏳ Affichage mobile (< 768px)
2. ⏳ Affichage tablette (768px - 1024px)
3. ⏳ Affichage desktop (> 1024px)

---

## Commit
- **Branch** : `feature/performance-tracking-system`
- **Commit** : `0d5930b`
- **Pull Request** : #322
- **Date** : 2026-01-03

## Auteur
Refonte UI réalisée par Manus AI pour MKtraining-fr/Virtus
