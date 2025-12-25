# Diagnostic du problème de synchronisation des documents

## Analyse du code

### ClientFiles.tsx (côté client)
- Ligne 159-163: Charge les documents avec `client_id = user.id`
- Le client utilise `user.id` pour filtrer ses propres documents

### CoachClientDocuments.tsx (côté coach)
- Ligne 163-167: Charge les documents avec `client_id = clientId` (l'ID du client sélectionné)
- Le coach utilise `clientId` (passé en prop) pour charger les documents du client

### Upload par le coach (CoachClientDocuments.tsx)
- Ligne 231-240: Lors de l'upload, le coach définit:
  - `client_id: clientId` (l'ID du client)
  - `coach_id: user.id` (l'ID du coach)
  - `uploaded_by: user.id` (l'ID du coach)

## Problème potentiel

Le problème pourrait être:
1. Le `clientId` passé au composant CoachClientDocuments n'est pas le bon UUID
2. Les politiques RLS bloquent l'accès

## Vérification nécessaire

Exécuter cette requête SQL pour voir les données réelles:
```sql
SELECT 
  cd.id,
  cd.client_id,
  cd.coach_id,
  cd.uploaded_by,
  cd.file_name,
  c.email as client_email
FROM client_documents cd
LEFT JOIN clients c ON c.id = cd.client_id;
```

Et vérifier l'ID du client mickael.roncin@gmail.com:
```sql
SELECT id, email, first_name, last_name, coach_id 
FROM clients 
WHERE email = 'mickael.roncin@gmail.com';
```
