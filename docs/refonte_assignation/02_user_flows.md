# 2. User Flows Critiques (UX)

En s'inspirant de l'approche centrée utilisateur d'Alan Cooper, voici la description détaillée des parcours utilisateurs pour la fonctionnalité d'assignation. Chaque flow est décomposé en étapes, avec une attention particulière portée aux états, aux erreurs et aux feedbacks pour garantir une expérience utilisateur fluide et intuitive.

---

### Flow 1 – Coach : Assignation via le Créateur de Programme

Ce flow décrit comment un coach assigne un programme qu'il est en train de créer ou de modifier, directement depuis l'interface de construction de programme.

**Objectif utilisateur :** "Je viens de finir de (re)travailler un programme, je veux l'envoyer immédiatement à un ou plusieurs de mes clients sans quitter mon écran de travail."

| Étape | Action de l'Utilisateur (Coach) | Réponse du Système (UI) | États & Erreurs | Micro-feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1. **Contexte** | Le coach est sur la page du `WorkoutBuilder` (`/app/coach/workout-builder/:programId`). Le programme est affiché à l'écran. | Le bouton "Assigner" est visible et cliquable en haut de la page, à côté de "Sauvegarder". | **Avant** : Le programme n'est assigné à personne. | - |
| 2. **Déclenchement** | Le coach clique sur le bouton **"Assigner"**. | Une fenêtre modale (Modal) s'ouvre par-dessus l'interface du `WorkoutBuilder`. | - | L'arrière-plan se floute légèrement pour mettre la modale en évidence. |
| 3. **Sélection** | Le coach voit la liste de ses clients actifs. Il peut rechercher un client par nom et en sélectionner un ou plusieurs via des cases à cocher. | La modale affiche une barre de recherche et la liste des clients. Les clients déjà sélectionnés sont mis en surbrillance. | **Gestion d'erreur** : Si le coach n'a aucun client actif, un message l'informe : "Vous n'avez aucun client actif à qui assigner ce programme." | La liste des clients se filtre en temps réel à mesure que le coach tape dans la barre de recherche. |
| 4. **Paramétrage** | Le coach définit la **date de début** de l'assignation (par défaut à aujourd'hui). D'autres options (fréquence, etc.) pourront être ajoutées plus tard. | Un sélecteur de date (`<input type="date">`) est affiché dans la modale. | **Avant** : Pas de date de début définie. | - |
| 5. **Confirmation** | Le coach clique sur le bouton **"Confirmer l'assignation"** dans la modale. | Le bouton affiche un spinner de chargement pour indiquer que l'opération est en cours. La modale est temporairement non-interactive. | **Après** : Le système appelle la fonction `assignProgramToClient` pour chaque client sélectionné. | Le bouton passe de "Confirmer" à "Assignation en cours...". |
| 6. **Résultat** | L'opération se termine. | La modale se ferme. Un message de confirmation (toast) apparaît en haut de l'écran. | **Succès** : L'assignation est créée en base de données. **Erreur** : Si l'API retourne une erreur, la modale reste ouverte et affiche un message d'erreur (ex: "Une erreur est survenue. Veuillez réessayer."). | **Toast Succès** : "Programme assigné avec succès à X client(s)." (vert). **Toast Erreur** : "L'assignation a échoué pour Y client(s)." (rouge). |

---

### Flow 2 – Coach : Assignation depuis la Bibliothèque

Ce flow décrit comment un coach assigne un programme existant depuis sa bibliothèque de programmes.

**Objectif utilisateur :** "Je veux réutiliser un de mes programmes existants et l'assigner rapidement à un nouveau client ou à un groupe."

| Étape | Action de l'Utilisateur (Coach) | Réponse du Système (UI) | États & Erreurs | Micro-feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1. **Contexte** | Le coach est sur la page `WorkoutLibrary` (`/app/coach/workout-library`). La liste de ses programmes s'affiche sous forme de cartes. | Chaque carte de programme a un bouton "Assigner" et un menu d'options (pour modifier, supprimer, etc.). | **Avant** : Le coach visualise sa bibliothèque. | - |
| 2. **Déclenchement** | Le coach clique sur le bouton **"Assigner"** sur la carte du programme de son choix. | Identique au Flow 1 : une fenêtre modale s'ouvre avec la liste des clients et les options d'assignation. | - | L'arrière-plan se floute. |
| 3. **Sélection & Paramétrage** | Le coach sélectionne les clients et la date de début, comme dans le Flow 1. | L'interface de la modale est identique à celle du Flow 1. | - | La liste de clients se met à jour dynamiquement. |
| 4. **Confirmation** | Le coach clique sur **"Confirmer l'assignation"**. | Le système traite la demande en arrière-plan. | **Après** : L'assignation est créée. | Le bouton affiche un spinner. |
| 5. **Résultat** | L'opération se termine. | La modale se ferme. Un toast de succès ou d'erreur s'affiche. Le compteur d'assignations sur la carte du programme est mis à jour. | **Succès** : L'assignation est visible dans le profil du client. | **Toast Succès/Erreur**. Le chiffre à côté de l'icône d'assignation sur la carte du programme s'incrémente. |

---

### Flow 3 – Coach : Vue "Programmes Assignés" dans le Profil Client

Ce flow décrit ce que le coach voit et peut faire dans la section des programmes d'un de ses clients.

**Objectif utilisateur :** "Je veux voir tous les programmes que j'ai assignés à ce client, suivre sa progression et gérer ses assignations."

| Étape | Action de l'Utilisateur (Coach) | Réponse du Système (UI) | États & Erreurs | Micro-feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1. **Contexte** | Le coach est sur la page `ClientProfile` (`/app/coach/clients/:clientId`). | La page affiche plusieurs sections, dont un accordéon **"Programmes Assignés"**. | **Avant** : L'accordéon est fermé ou ouvert, affichant la liste des programmes. | - |
| 2. **Visualisation** | Le coach ouvre l'accordéon "Programmes Assignés". | Le système affiche la liste des programmes assignés à ce client, triés par date de début (du plus récent au plus ancien). | **Gestion d'état** : Si la liste est vide, un message "Aucun programme assigné." est affiché. | Un spinner de chargement s'affiche pendant que les données sont récupérées depuis `getClientAssignedProgramsForCoach`. |
| 3. **Informations Clés** | Pour chaque programme listé, le coach voit : le nom du programme, son statut (`En cours`, `Terminé`, `À venir`), la date de début et la progression (ex: "Semaine 2/8"). | Les informations sont présentées de manière claire et concise sur chaque item de la liste. | - | Le statut est affiché avec une puce de couleur (vert pour "En cours", gris pour "Terminé"). |
| 4. **Interaction** | Le coach clique sur un programme pour voir les détails. | Une modale ou une nouvelle page s'ouvre, affichant la vue détaillée du programme du client (`ProgramPerformanceDetail`), avec les séances, les exercices et les performances enregistrées par le client. | **Gestion d'erreur** : Si les détails ne peuvent pas être chargés, un message d'erreur s'affiche. | - |
| 5. **Action** | Le coach peut effectuer des actions sur une assignation (ex: "Archiver", "Suspendre", "Supprimer"). | Un menu d'options (icône "...") sur chaque item de la liste permet d'accéder à ces actions. | **Confirmation** : Une boîte de dialogue de confirmation est affichée avant toute action destructive (ex: "Voulez-vous vraiment supprimer cette assignation ?"). | Après une action, la liste est mise à jour et un toast confirme l'opération (ex: "Assignation archivée."). |

---

### Flow 4 – Client : Vue "Programme en Cours"

Ce flow décrit comment le client accède à son programme et interagit avec ses séances.

**Objectif utilisateur :** "Je veux savoir quelle est ma séance du jour, la réaliser et enregistrer mes performances simplement."

| Étape | Action de l'Utilisateur (Client) | Réponse du Système (UI) | États & Erreurs | Micro-feedback |
| :--- | :--- | :--- | :--- | :--- |
| 1. **Contexte** | Le client se connecte et arrive sur son tableau de bord (`/app/client/dashboard`) ou va dans la section `Workout` (`/app/client/workout`). | Un encart proéminent "Programme en cours" est affiché. Il montre le nom du programme, la semaine et la séance actuelles. | **Avant** : Le client n'a pas encore commencé sa séance. **Gestion d'état** : S'il n'y a pas de programme actif, l'encart l'invite à contacter son coach. | - |
| 2. **Accès Séance** | Le client clique sur le bouton **"Commencer la séance"** ou sur l'encart du programme. | Le client est redirigé vers la page de la séance du jour (`/app/workout/session/:sessionId`). La liste des exercices à réaliser s'affiche. | **Gestion d'erreur** : Si la séance n'existe pas ou n'est pas accessible, une page d'erreur est affichée. | - |
| 3. **Réalisation** | Pour chaque exercice, le client consulte les consignes (séries, reps, charge) et remplit les champs pour enregistrer ses performances (ex: charge soulevée, répétitions effectuées, RPE). | Des champs de saisie (`input`) sont disponibles pour chaque série d'exercice. | **Validation** : Les entrées sont validées (ex: nombres uniquement pour la charge). | Les champs de saisie sont sauvegardés automatiquement (`autosave`) à mesure que le client les remplit pour éviter toute perte de données. |
| 4. **Validation** | Une fois tous les exercices complétés, le client clique sur le bouton **"Terminer la séance"** en bas de la page. | Le système enregistre les `LogPerformance` en base de données et met à jour le statut de la `SéanceClient` à `Terminé`. | **Après** : La progression du client (`current_session`) est incrémentée dans la table `program_assignments`. | Un message de félicitations s'affiche. Le client est redirigé vers son tableau de bord, qui montre maintenant la prochaine séance à venir. |
| 5. **Feedback** | Le client voit sa progression mise à jour. | Sur le tableau de bord, l'encart "Programme en cours" affiche maintenant "Prochaine séance : [Nom de la séance]" ou un message indiquant que la semaine est terminée. | - | Une jauge de progression du programme pourrait être mise à jour pour renforcer le sentiment d'accomplissement. |
