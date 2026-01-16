# Guide Utilisateur - Techniques d'Intensification

## Introduction

Les techniques d'intensification sont des méthodes avancées d'entraînement qui permettent d'augmenter l'intensité d'un exercice pour stimuler davantage la croissance musculaire et améliorer les performances. Ce guide vous explique comment utiliser le système de techniques d'intensification dans Virtus.

---

## Qu'est-ce qu'une technique d'intensification ?

Une technique d'intensification est une méthode qui pousse le muscle au-delà de l'échec musculaire classique ou qui modifie la manière dont l'exercice est exécuté pour augmenter le stress métabolique ou mécanique.

### Exemples courants

**Drop Sets (Dégressif)** : Après avoir atteint l'échec avec une charge, vous réduisez immédiatement la charge et continuez jusqu'à l'échec à nouveau.

**Rest-Pause** : Après avoir atteint l'échec, vous prenez une courte pause (10-15 secondes) puis effectuez quelques répétitions supplémentaires.

**Superset** : Enchaîner deux exercices sans repos entre les deux.

**Tempo contrôlé** : Modifier la vitesse d'exécution (par exemple, 4 secondes en phase excentrique).

---

## Accéder aux Techniques

### Consulter la bibliothèque de techniques

1. Connectez-vous à votre compte coach
2. Cliquez sur **"Base de Données"** dans le menu latéral
3. Cliquez sur l'onglet **"Techniques"**

Vous verrez deux types de techniques :
- **Techniques Système** (badge bleu) : 36 techniques pré-configurées que vous ne pouvez pas modifier
- **Techniques Personnalisées** (badge vert) : Vos propres techniques que vous avez créées

### Rechercher une technique

Utilisez la barre de recherche en haut pour trouver une technique par son nom ou sa description.

### Filtrer par catégorie

Cliquez sur les boutons de catégorie pour filtrer les techniques :
- **Séries** : Techniques basées sur la manipulation des séries (Drop Sets, Superset, etc.)
- **Échec** : Techniques visant l'échec musculaire (Rest-Pause, Myo-Reps, etc.)
- **Partiel** : Techniques utilisant des amplitudes partielles
- **Tempo** : Techniques modifiant la vitesse d'exécution
- **Périodisation** : Techniques de variation de l'intensité
- **Avancé** : Techniques avancées pour athlètes expérimentés

---

## Créer une Technique Personnalisée

Si vous avez une méthode d'intensification spécifique que vous utilisez régulièrement, vous pouvez créer votre propre technique.

### Étapes

1. Dans l'onglet **"Techniques"**, cliquez sur **"Créer une technique"**
2. Remplissez le formulaire :
   - **Nom** : Nom court et descriptif (ex: "Drop Set 3 paliers")
   - **Description** : Explication de la technique (ex: "Effectuer 3 paliers de dégressif avec -20%, -40%, -60%")
   - **Protocole** : Instructions détaillées pour l'exécution
   - **Catégorie** : Choisissez la catégorie appropriée
3. Cliquez sur **"Créer"**

Votre technique apparaîtra maintenant dans la liste avec un badge **"Personnalisée"**.

### Archiver une technique

Si vous n'utilisez plus une technique personnalisée, vous pouvez l'archiver :
1. Cliquez sur la technique
2. Cliquez sur **"Archiver"**

La technique sera retirée de la liste mais restera dans la base de données. Elle ne sera plus sélectionnable dans le créateur de programmes.

---

## Appliquer une Technique à un Exercice

### Dans le créateur de programmes

1. Ouvrez le **WorkoutBuilder** (créateur de programmes)
2. Ajoutez ou sélectionnez un exercice
3. Dans la section de l'exercice, trouvez le sélecteur **"Élément d'intensification"**
4. Cliquez sur le sélecteur et choisissez une technique dans la liste

La description de la technique s'affichera automatiquement.

### Choisir les semaines d'application

Après avoir sélectionné une technique, un second sélecteur apparaît : **"Appliquer à"**.

Vous avez deux options :
- **Appliquer à toutes les semaines** : La technique sera utilisée pendant toute la durée du programme
- **Semaine X uniquement** : La technique ne sera utilisée que pendant la semaine spécifiée

**Exemple d'utilisation** :
- Semaines 1-2 : Drop Sets (pour l'hypertrophie)
- Semaines 3-4 : Rest-Pause (pour l'intensité)
- Semaines 5-6 : Tempo contrôlé (pour la technique)

Cela permet de créer des programmes progressifs et variés.

---

## Techniques Adaptatives (Configuration Avancée)

Certaines techniques nécessitent une configuration spécifique. Lorsque vous sélectionnez l'une de ces techniques, un configurateur apparaît automatiquement.

### Drop Sets (Dégressif)

**Configuration** :
1. **Appliquer à** : Choisissez si le drop set s'applique à toutes les séries, uniquement la dernière, ou des séries spécifiques
2. **Nombre de paliers** : Définissez combien de paliers de dégressif (généralement 2-3)
3. Pour chaque palier :
   - **Réduction %** : Pourcentage de réduction de la charge (ex: -20%, -40%)
   - **Reps cibles** : Nombre de répétitions à viser pour ce palier

**Exemple** :
```
Appliquer à : Dernière série uniquement
Palier 1 : -20% | 8-10 reps
Palier 2 : -40% | 6-8 reps
```

Cela signifie que seule la dernière série de l'exercice aura un drop set avec 2 paliers.

### Rest-Pause

**Configuration** :
1. **Appliquer à** : Toutes séries, dernière, ou spécifiques
2. **Durée de la pause** : Temps de repos entre les mini-séries (généralement 10-15 secondes)
3. **Nombre de mini-séries** : Combien de mini-séries après la série principale (généralement 2-3)

**Exemple** :
```
Appliquer à : Toutes les séries
Durée de la pause : 15 secondes
Nombre de mini-séries : 2
```

### Myo-Reps

**Configuration** :
1. **Appliquer à** : Toutes séries, dernière, ou spécifiques
2. **Reps série d'activation** : Nombre de répétitions pour la série initiale (généralement 12-20)
3. **Nombre de mini-séries** : Nombre de mini-séries après l'activation (généralement 3-5)
4. **Repos entre mini-séries** : Temps de repos (généralement 3-5 secondes)
5. **Reps par mini-série** : Nombre de répétitions par mini-série (généralement 3-5)

### Cluster Sets

**Configuration** :
1. **Appliquer à** : Toutes séries, dernière, ou spécifiques
2. **Clusters par série** : Nombre de clusters dans une série (généralement 3-5)
3. **Reps par cluster** : Répétitions par cluster (généralement 2-4)
4. **Repos intra-série** : Temps de repos entre clusters (généralement 10-20 secondes)

### Tempo Contrôlé (21s)

**Configuration** :
1. **Appliquer à** : Toutes séries, dernière, ou spécifiques
2. **Excentrique** : Durée de la phase excentrique en secondes (ex: 4s)
3. **Pause 1** : Durée de la pause en position basse (ex: 0s)
4. **Concentrique** : Durée de la phase concentrique en secondes (ex: 1s)
5. **Pause 2** : Durée de la pause en position haute (ex: 0s)

**Exemple de tempo 4010** :
```
Excentrique : 4s
Pause 1 : 0s
Concentrique : 1s
Pause 2 : 0s
```

---

## Ce que Voient Vos Clients

### Techniques Informatives

Pour les techniques simples (Superset, Triset, etc.), vos clients verront :
- Un bloc collapsible avec le nom de la technique
- En cliquant, ils peuvent voir la description et le protocole détaillé

### Techniques Adaptatives

Pour les techniques configurées (Drop Sets, Rest-Pause, etc.), l'interface s'adapte automatiquement :

**Drop Sets** :
- L'interface affiche la série principale + chaque palier
- Les charges sont calculées automatiquement selon les pourcentages configurés
- Le client saisit les répétitions et charges pour chaque palier

**Rest-Pause** :
- L'interface affiche la série principale + les mini-séries
- Le temps de pause est indiqué
- Le client saisit les répétitions pour chaque mini-série

### Variations par Semaine

Si vous avez configuré des techniques différentes par semaine, vos clients ne verront que la technique assignée à leur semaine actuelle. Lorsqu'ils passent à la semaine suivante, l'interface s'adapte automatiquement.

---

## Consulter l'Historique

Lorsque vous consultez l'historique de performance d'un client, vous verrez une colonne **"Technique"** dans le tableau récapitulatif.

Cette colonne affiche :
- Le nom de la technique utilisée pour chaque exercice
- Une icône ⚙️ si la technique était configurée
- Un tiret "-" si aucune technique n'était assignée

Cela vous permet de voir rapidement quelles techniques ont été utilisées et d'analyser leur efficacité.

---

## Bonnes Pratiques

### Progression Progressive

Ne surchargez pas vos clients avec trop de techniques d'intensification dès le début. Introduisez-les progressivement :
- **Semaines 1-2** : Pas de technique (apprentissage des mouvements)
- **Semaines 3-4** : Introduction d'une technique simple (Superset)
- **Semaines 5-6** : Technique plus avancée (Drop Sets)
- **Semaines 7-8** : Technique intensive (Rest-Pause)

### Choix de la Technique

Choisissez la technique en fonction de l'objectif :
- **Hypertrophie** : Drop Sets, Superset, Myo-Reps
- **Force** : Cluster Sets, Rest-Pause
- **Endurance** : Tempo contrôlé, Superset
- **Technique** : Tempo contrôlé, Partiel

### Placement dans la Séance

Les techniques d'intensification sont très exigeantes. Placez-les stratégiquement :
- **Début de séance** : Techniques moins fatigantes (Tempo contrôlé)
- **Milieu de séance** : Techniques modérées (Superset)
- **Fin de séance** : Techniques intensives (Drop Sets, Rest-Pause)

### Fréquence

N'utilisez pas les techniques d'intensification sur tous les exercices. Une bonne règle :
- **1-2 exercices par séance** avec technique d'intensification
- **Dernière série uniquement** pour les débutants
- **Toutes les séries** pour les avancés (avec prudence)

### Récupération

Les techniques d'intensification augmentent la fatigue. Assurez-vous que vos clients :
- Ont une nutrition adéquate
- Dorment suffisamment
- Ont des jours de repos appropriés

---

## Exemples de Programmes

### Programme Hypertrophie (4 semaines)

**Semaine 1-2** : Pas de technique (volume de base)

**Semaine 3** : Drop Sets sur dernière série des exercices principaux
- Développé couché : Drop Set (-20%, -40%)
- Squat : Drop Set (-20%, -40%)

**Semaine 4** : Rest-Pause sur dernière série
- Développé couché : Rest-Pause (15s, 2 mini-séries)
- Squat : Rest-Pause (15s, 2 mini-séries)

### Programme Force (6 semaines)

**Semaine 1-3** : Cluster Sets sur exercices principaux
- Développé couché : 5 clusters x 3 reps (15s repos)
- Squat : 5 clusters x 3 reps (15s repos)

**Semaine 4-6** : Rest-Pause sur exercices principaux
- Développé couché : Rest-Pause (20s, 2 mini-séries)
- Squat : Rest-Pause (20s, 2 mini-séries)

### Programme Esthétique (8 semaines)

**Semaine 1-2** : Tempo contrôlé (4010)
- Tous les exercices d'isolation

**Semaine 3-4** : Superset
- Pectoraux : Développé + Écarté
- Dos : Tirage + Rowing

**Semaine 5-6** : Drop Sets
- Dernière série de tous les exercices

**Semaine 7-8** : Myo-Reps
- Exercices d'isolation uniquement

---

## Dépannage

### La technique ne s'affiche pas dans le WorkoutBuilder

**Solution** : Vérifiez que la technique n'est pas archivée. Seules les techniques actives sont disponibles.

### Le configurateur ne s'affiche pas

**Solution** : Seules 5 techniques ont un configurateur (Drop Sets, Rest-Pause, Myo-Reps, Cluster Sets, Tempo). Les autres techniques sont informatives uniquement.

### Le client ne voit pas la technique

**Solutions** :
1. Vérifiez que la technique s'applique à la semaine actuelle du client
2. Vérifiez que le programme a été correctement sauvegardé
3. Demandez au client de rafraîchir la page

### L'interface adaptative ne s'affiche pas pour le client

**Solutions** :
1. Vérifiez que la configuration a été sauvegardée
2. Vérifiez que "Appliquer à" correspond à la série actuelle
3. Vérifiez que la technique s'applique à la semaine actuelle

---

## Support

Si vous rencontrez des problèmes ou avez des questions, n'hésitez pas à contacter le support technique à l'adresse : [https://help.manus.im](https://help.manus.im)

---

**Version** : 1.0  
**Date** : Janvier 2026  
**Application** : Virtus
