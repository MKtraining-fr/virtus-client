# Diagnostic - Table client_documents

## Données trouvées (1 enregistrement)

| Colonne | Valeur |
|---------|--------|
| id | 4f66a505-31c6-4f62-9bca-2ad36e71356c |
| client_id | 6e75f7d4-1b99-4adf-9246-b718b5... |
| coach_id | 4855bd7c-9f0f-40e7-a7bf-2bd61c... |
| uploaded_by | 4855bd7c-9f0f-40e7-a7bf-2bd61c... |
| file_name | CONCLUSION 2.docx |
| file_url | https://dqs... |

## Analyse

Le document a été uploadé par le coach (uploaded_by = coach_id).
Le client_id est bien renseigné.

## Prochaine étape

Vérifier que le client_id correspond bien à l'ID de l'utilisateur mickael.roncin@gmail.com
dans la table clients.

Vérifier également les politiques RLS pour s'assurer que le client peut voir les documents
où client_id = auth.uid().
