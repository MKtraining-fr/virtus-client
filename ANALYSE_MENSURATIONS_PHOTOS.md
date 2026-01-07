## Analyse du système de suivi des mensurations et photos

### Fonctionnement général

Le système de suivi des mensurations et photos est déjà en place dans l'application, à la fois côté client et côté coach. Il permet aux clients d'enregistrer leurs mensurations et de télécharger des photos de suivi, qui sont ensuite visibles par le coach.

### Côté Client (`src/pages/client/ClientProfile.tsx`)

#### Mensurations
- **Saisie des données** : Le client peut saisir son poids et ses mensurations (taille, hanches, etc.) dans des champs de formulaire dédiés.
- **Enregistrement** : Les données sont enregistrées dans la colonne `nutrition` (JSONB) de la table `clients`. Un nouvel enregistrement est également ajouté à l'historique `historyLog` dans la même colonne.
- **Visualisation** : Un graphique et un tableau historique affichent l'évolution des mensurations au fil du temps.

#### Photos
- **Téléversement** : Le client peut téléverser des photos de suivi via un bouton "Téléverser une photo".
- **Stockage** : Les photos sont stockées dans le **stockage local du navigateur** (`localStorage`) et ne sont **pas envoyées à la base de données Supabase**.
- **Affichage** : Les photos sont affichées dans une galerie privée pour le client.

### Côté Coach (`src/pages/ClientProfile.tsx`)

#### Mensurations
- **Visualisation** : Le coach peut voir l'historique des mensurations du client sous forme de graphique et de tableau, de la même manière que le client.

#### Photos
- **Aucune fonctionnalité** : Le coach **ne peut pas voir les photos** de suivi du client car elles ne sont pas stockées dans la base de données.

### Base de données Supabase

- **`clients`** : La table principale des clients contient une colonne `nutrition` (JSONB) qui stocke les mensurations et l'historique.
- **`client_documents`** : Une table existe pour stocker des documents, mais elle n'est pas utilisée pour les photos de suivi.
- **Aucune table dédiée** : Il n'y a pas de table dédiée pour les mensurations ou les photos de suivi.

### Conclusion

- **Mensurations** : Le système est fonctionnel et les données sont bien enregistrées dans la base de données.
- **Photos** : Le système est **incomplet**. Les photos sont stockées localement dans le navigateur du client et ne sont pas accessibles par le coach.

Pour que le coach puisse voir les photos, il faudrait modifier le système pour qu'elles soient téléversées dans le **stockage Supabase** (bucket `client-documents` ou un nouveau bucket dédié) et que les liens soient enregistrés dans une table de la base de données.
