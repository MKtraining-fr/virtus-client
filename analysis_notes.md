# Analyse de la structure de la base de données - Messagerie

## Table: messages (pour la messagerie coach-client)

La table `messages` contient la messagerie entre coach et client. Structure observée avec 2 enregistrements :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| sender_id | uuid | ID de l'expéditeur |
| recipient_id | uuid | ID du destinataire |
| subject | text | Sujet du message (NULL dans les exemples) |
| content | text | Contenu du message ("Test", "parfait") |
| created_at | timestamp | Date de création (2025-11-06) |

**Observations importantes :**
- La table existe déjà avec une structure de base
- Il manque des colonnes pour les nouvelles fonctionnalités demandées :
  - `read_at` (timestamp) - Pour l'indicateur de lecture
  - `message_type` (text) - Pour différencier texte/vocal/document
  - `attachment_url` (text) - Pour les pièces jointes
  - `attachment_type` (text) - Type de pièce jointe (document, audio)
  - `duration` (integer) - Durée des messages vocaux en secondes

## Table: notifications (pour les notifications système)

Structure différente, utilisée pour les notifications automatiques (programme assigné, séance terminée, etc.)

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| user_id | uuid | Destinataire de la notification |
| title | text | Titre de la notification |
| message | text | Contenu du message |
| type | text | Type (session_completed, program_assigned, program_deleted) |
| read | bool | Statut de lecture |
| created_at | timestamptz | Date de création |

## À vérifier ensuite
- Configuration du Storage Supabase pour les fichiers
- Existence d'une table pour les documents clients
- Politiques RLS sur la table messages


## Storage Supabase - Configuration actuelle

Un seul bucket existe actuellement :

| Bucket | Visibilité | Politiques | Limite | Types MIME |
|--------|------------|------------|--------|------------|
| exercise-images | PUBLIC | 0 | 50 MB | Any |

**Buckets à créer pour les nouvelles fonctionnalités :**

1. **client-documents** (PRIVATE) - Pour les documents des clients
   - Limite : 10 MB
   - Types : PDF, images, documents Office

2. **voice-messages** (PRIVATE) - Pour les messages vocaux des coachs
   - Limite : 5 MB
   - Types : audio/webm, audio/mp3, audio/ogg

3. **message-attachments** (PRIVATE) - Pour les pièces jointes de la messagerie
   - Limite : 10 MB
   - Types : PDF, images, documents

## Prochaines étapes

1. Examiner le code frontend de la messagerie
2. Vérifier les politiques RLS existantes sur messages
3. Préparer le rapport complet avec recommandations RGPD
