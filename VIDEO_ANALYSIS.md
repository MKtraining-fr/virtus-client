# Analyse de la vidéo - Problèmes identifiés

## Problème 1 : Doublons dans la liste déroulante (Frame 1, 20)
- "Abducteur debout" apparaît 2 fois
- "Abducteurs assis" apparaît 2 fois  
- "Tirage vertical pronation" apparaît 3 fois
- **Cause** : Même nom d'exercice mais équipements différents
- **Solution** : Afficher l'équipement entre parenthèses

## Problème 2 : Pas de persistance de la sélection (Frame 35)
- L'utilisateur sélectionne "Tirage horizontal prise neutre" dans l'onglet Évolution
- Quand il revient sur l'onglet "Projections & Profil", c'est "Belt squat" qui est sélectionné
- **Cause** : Chaque onglet a son propre état de sélection, non partagé
- **Solution** : Remonter l'état de sélection au niveau du composant parent (PerformanceSection)

## Problème 3 : Graphiques d'évolution vides (Frame 30)
- L'onglet "Évolution" montre les cartes mais les graphiques sont vides
- **Cause** : Les données ne sont pas correctement récupérées ou affichées
- **Solution** : Vérifier le composant PerformanceCharts

## Problème 4 : Pas de projections/extrapolations (Frame 10)
- Le tableau des projections affiche "Aucune projection disponible"
- **Cause** : Les projections ne sont pas calculées automatiquement
- **Solution** : Déclencher le calcul des projections après l'insertion de performances

## Actions à effectuer
1. Ajouter l'équipement entre parenthèses dans les listes déroulantes
2. Partager l'état de sélection entre les onglets
3. Vérifier les graphiques d'évolution
4. Appliquer la modification à tous les champs de recherche (client, coach, admin)
