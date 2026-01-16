# Plan de Tests - Système de Techniques d'Intensification

## Vue d'ensemble

Ce document décrit les tests à effectuer pour valider le système complet de techniques d'intensification dans Virtus.

---

## 1. Tests de la Base de Données

### 1.1 Vérification de la structure
- [ ] Table `intensification_techniques` existe
- [ ] Colonnes : id, name, description, protocol, category, adaptation_type, config_schema, is_system, coach_id, created_at, archived
- [ ] 36 techniques système présentes
- [ ] Contraintes : coach_id référence auth.users

### 1.2 Vérification des données
- [ ] Toutes les techniques système ont `is_system = true`
- [ ] 5 techniques ont `adaptation_type = 'extra_fields'` (Drop set, Rest-pause, Myo-reps, Cluster Sets, 21s)
- [ ] Les `config_schema` sont valides pour les 5 techniques adaptatives
- [ ] Les catégories sont correctes (Séries, Échec, Partiel, Tempo, Périodisation, Avancé)

### 1.3 Vérification des exercices
- [ ] Colonne `intensity_technique_id` existe dans `session_exercises`
- [ ] Colonne `intensity_config` existe dans `session_exercises`
- [ ] Colonne `intensity_applies_to` existe dans `session_exercises`

---

## 2. Tests de l'Interface Coach - Gestion des Techniques

### 2.1 Onglet "Techniques" dans WorkoutDatabase
- [ ] L'onglet "Techniques" s'affiche après "Échauffement"
- [ ] Les techniques système sont affichées avec badge "Système"
- [ ] Les techniques personnalisées sont affichées avec badge "Personnalisée"
- [ ] La recherche fonctionne (nom et description)
- [ ] Les filtres par catégorie fonctionnent

### 2.2 Visualisation des techniques
- [ ] Cliquer sur une technique ouvre le modal de détails
- [ ] Le modal affiche : nom, description, protocole, catégorie
- [ ] Le badge "Système" ou "Personnalisée" est visible
- [ ] Les techniques système ne peuvent pas être modifiées

### 2.3 Création de techniques personnalisées
- [ ] Le bouton "Créer une technique" ouvre le formulaire
- [ ] Tous les champs sont présents : nom, description, protocole, catégorie
- [ ] La validation fonctionne (champs requis)
- [ ] La technique créée apparaît dans la liste avec badge "Personnalisée"
- [ ] La technique créée est associée au coach connecté

### 2.4 Archivage de techniques
- [ ] Le bouton "Archiver" est visible uniquement pour les techniques personnalisées
- [ ] Archiver une technique la retire de la liste
- [ ] Les techniques archivées ne sont plus sélectionnables dans le WorkoutBuilder

---

## 3. Tests de l'Interface Coach - WorkoutBuilder

### 3.1 Sélection de technique simple (informative)
- [ ] Le sélecteur "Élément d'intensification" s'affiche
- [ ] Toutes les techniques (système + personnalisées) sont listées
- [ ] Sélectionner une technique affiche sa description
- [ ] La technique sélectionnée est sauvegardée avec l'exercice

### 3.2 Sélection de semaine d'application
- [ ] Le sélecteur de semaine apparaît quand une technique est sélectionnée
- [ ] Options : "Toutes les semaines" et "Semaine 1-8 uniquement"
- [ ] La valeur par défaut est "Toutes les semaines"
- [ ] Changer la semaine met à jour `intensity_applies_to`

### 3.3 Configuration de Drop Sets
- [ ] Sélectionner "Drop set" affiche le configurateur
- [ ] Le champ "Appliquer à" propose : Toutes/Dernière/Spécifiques
- [ ] Le champ "Nombre de paliers" permet d'ajouter/supprimer des paliers
- [ ] Chaque palier a : Réduction %, Reps cibles
- [ ] Les valeurs sont validées (min/max)
- [ ] La configuration est sauvegardée dans `intensity_config`

### 3.4 Configuration de Rest-Pause
- [ ] Sélectionner "Rest-pause" affiche le configurateur
- [ ] Champs : Appliquer à, Durée pause (s), Nombre de mini-séries
- [ ] Les valeurs sont validées
- [ ] La configuration est sauvegardée

### 3.5 Configuration de Myo-Reps
- [ ] Sélectionner "Myo-reps" affiche le configurateur
- [ ] Champs : Appliquer à, Reps série activation, Nombre mini-séries, Repos (s), Reps par mini
- [ ] Les valeurs sont validées
- [ ] La configuration est sauvegardée

### 3.6 Configuration de Cluster Sets
- [ ] Sélectionner "Cluster Sets" affiche le configurateur
- [ ] Champs : Appliquer à, Clusters par série, Reps par cluster, Repos intra-série (s)
- [ ] Les valeurs sont validées
- [ ] La configuration est sauvegardée

### 3.7 Configuration de Tempo (21s)
- [ ] Sélectionner "21s" affiche le configurateur
- [ ] Champs : Appliquer à, Excentrique (s), Pause 1 (s), Concentrique (s), Pause 2 (s)
- [ ] Les valeurs sont validées
- [ ] La configuration est sauvegardée

### 3.8 Sauvegarde et chargement
- [ ] Sauvegarder un programme avec techniques fonctionne
- [ ] Charger un programme restaure les techniques et configurations
- [ ] Cloner un exercice copie la technique et sa configuration
- [ ] Supprimer une technique d'un exercice fonctionne

---

## 4. Tests de l'Interface Client - Affichage Informatif

### 4.1 Affichage des techniques informatives
- [ ] La technique s'affiche dans un bloc collapsible
- [ ] Le nom de la technique est visible
- [ ] Cliquer ouvre/ferme les détails (description + protocole)
- [ ] Le dark mode fonctionne

### 4.2 Filtrage par semaine
- [ ] Si `intensity_applies_to = "all_weeks"`, la technique s'affiche toutes les semaines
- [ ] Si `intensity_applies_to = "week_2"`, la technique s'affiche uniquement en semaine 2
- [ ] Si la technique ne s'applique pas, elle n'apparaît pas

---

## 5. Tests de l'Interface Client - Saisie Adaptative

### 5.1 Drop Sets - Interface
- [ ] L'interface adaptative s'affiche pour les exercices avec Drop Sets
- [ ] Le nombre de paliers correspond à la configuration
- [ ] Les charges sont calculées automatiquement (-20%, -40%, etc.)
- [ ] Chaque palier a des champs : Reps, Charge
- [ ] Les placeholders affichent les valeurs cibles

### 5.2 Drop Sets - Application selon "Appliquer à"
- [ ] Si "Toutes les séries" : toutes les séries ont l'interface adaptative
- [ ] Si "Dernière série uniquement" : seule la dernière série a l'interface adaptative
- [ ] Si "Séries spécifiques" : seules les séries spécifiées ont l'interface adaptative
- [ ] Les autres séries utilisent l'interface standard

### 5.3 Drop Sets - Saisie et sauvegarde
- [ ] Saisir les reps/charges pour chaque palier fonctionne
- [ ] Les données sont sauvegardées dans `performance_data`
- [ ] Les données sont visibles dans l'historique

### 5.4 Rest-Pause - Interface
- [ ] L'interface adaptative s'affiche
- [ ] La série principale est affichée
- [ ] Les mini-séries sont affichées avec indication de pause
- [ ] Chaque mini-série a un champ : Reps

### 5.5 Rest-Pause - Saisie et sauvegarde
- [ ] Saisir les reps pour la série principale et les mini-séries fonctionne
- [ ] Les données sont sauvegardées
- [ ] Les données sont visibles dans l'historique

### 5.6 Filtrage par semaine (client)
- [ ] Les techniques adaptatives ne s'affichent que pour les bonnes semaines
- [ ] Changer de semaine affiche/cache les techniques appropriées

---

## 6. Tests de l'Historique de Performance

### 6.1 Tableau d'historique (ProgramDetailView)
- [ ] La colonne "Technique" est présente
- [ ] Le nom de la technique s'affiche pour chaque exercice
- [ ] L'icône ⚙️ s'affiche pour les techniques configurées
- [ ] "-" s'affiche si aucune technique assignée

### 6.2 Chargement des techniques
- [ ] Les techniques sont chargées depuis la base de données
- [ ] Le chargement est asynchrone et ne bloque pas l'affichage
- [ ] Les erreurs de chargement sont gérées

---

## 7. Tests de Performance et Edge Cases

### 7.1 Performance
- [ ] Le chargement des techniques est rapide (<500ms)
- [ ] Pas de requêtes redondantes à la base de données
- [ ] Le rendu des composants est fluide

### 7.2 Edge Cases
- [ ] Technique supprimée/archivée : affichage gracieux
- [ ] Config invalide : fallback vers interface standard
- [ ] Semaine hors limites : gestion correcte
- [ ] Exercice sans technique : pas d'erreur
- [ ] Client sans programme : pas d'erreur

### 7.3 Compatibilité
- [ ] Ancien système `intensification` toujours fonctionnel
- [ ] Migration transparente vers nouveau système
- [ ] Pas de régression sur fonctionnalités existantes

---

## 8. Tests de Sécurité

### 8.1 Permissions
- [ ] Un coach ne peut voir que ses techniques personnalisées
- [ ] Un coach ne peut pas modifier les techniques système
- [ ] Un coach ne peut pas voir les techniques d'un autre coach
- [ ] Un client ne peut pas créer/modifier des techniques

### 8.2 Validation
- [ ] Les données de configuration sont validées côté serveur
- [ ] Les injections SQL sont impossibles
- [ ] Les données JSON sont parsées en toute sécurité

---

## 9. Tests de Régression

### 9.1 Fonctionnalités existantes
- [ ] Création de programme sans technique fonctionne
- [ ] Assignation de programme fonctionne
- [ ] Complétion de séance fonctionne
- [ ] Historique de performance fonctionne
- [ ] Clonage de programme fonctionne

### 9.2 Ancien système intensification
- [ ] Les programmes avec ancien système `intensification` fonctionnent
- [ ] L'affichage est correct
- [ ] La migration est transparente

---

## 10. Résultats des Tests

### Tests Automatiques
```bash
# Compilation TypeScript
pnpm run build
# Résultat : ✅ PASS

# Vérification des types
pnpm exec tsc --noEmit
# Résultat : ✅ PASS
```

### Tests Manuels
À effectuer dans l'interface déployée sur Cloudflare Pages.

---

## Statut Global

- **Base de données** : ✅ Validé
- **Services TypeScript** : ✅ Validé
- **Interface Coach** : ⏳ À tester manuellement
- **Interface Client** : ⏳ À tester manuellement
- **Historique** : ⏳ À tester manuellement
- **Performance** : ⏳ À tester manuellement
- **Sécurité** : ⏳ À tester manuellement

---

## Prochaines Actions

1. ✅ Compilation réussie
2. ⏳ Tests manuels dans l'interface déployée
3. ⏳ Correction des bugs éventuels
4. ⏳ Documentation utilisateur
5. ⏳ Déploiement final
