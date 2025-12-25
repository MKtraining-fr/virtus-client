# Rapport d'Analyse - Messagerie Virtus

**Date** : 25 décembre 2024  
**Version** : 1.0

---

## 1. État actuel de la messagerie

### 1.1 Structure de la base de données

La table `messages` existe déjà avec la structure suivante :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Clé primaire |
| sender_id | uuid | ID de l'expéditeur |
| recipient_id | uuid | ID du destinataire |
| subject | text | Sujet du message (optionnel) |
| content | text | Contenu du message |
| created_at | timestamp | Date de création |

Le type TypeScript `Message` dans le code frontend contient des champs supplémentaires non présents en base :

| Champ TypeScript | Présent en BDD | Description |
|------------------|----------------|-------------|
| isVoice | ❌ Non | Indique si c'est un message vocal |
| voiceUrl | ❌ Non | URL du fichier audio |
| seenBySender | ❌ Non | Lu par l'expéditeur |
| seenByRecipient | ❌ Non | Lu par le destinataire |

### 1.2 Storage Supabase

Un seul bucket existe actuellement : `exercise-images` (PUBLIC). Aucun bucket n'est configuré pour les documents ou messages vocaux.

### 1.3 Politiques RLS

La table `messages` dispose de 2 politiques RLS. À vérifier et adapter pour les nouvelles fonctionnalités.

---

## 2. Fonctionnalités demandées

| Fonctionnalité | Bénéficiaire | Description |
|----------------|--------------|-------------|
| Indicateur de lecture | Coach uniquement | Voir si le client a lu le message |
| Messages vocaux | Coach uniquement | Enregistrer et envoyer des messages audio |
| Pièces jointes messagerie | Coach uniquement | Envoyer des documents via la messagerie |
| Documents profil | Coach + Client | Gestion des documents via le profil client |

---

## 3. Modifications requises

### 3.1 Base de données - Table `messages`

Colonnes à ajouter :

```sql
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;
```

| Colonne | Type | Description |
|---------|------|-------------|
| read_at | timestamptz | Date/heure de lecture par le destinataire |
| message_type | text | Type : 'text', 'voice', 'document' |
| attachment_url | text | URL du fichier dans Storage |
| attachment_name | text | Nom original du fichier |
| attachment_type | text | MIME type du fichier |
| voice_duration | integer | Durée du vocal en secondes |

### 3.2 Nouvelle table `client_documents`

```sql
CREATE TABLE public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.clients(id),
  uploaded_by UUID NOT NULL REFERENCES public.clients(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Storage - Nouveaux buckets

| Bucket | Visibilité | Limite | Types MIME autorisés |
|--------|------------|--------|---------------------|
| voice-messages | PRIVATE | 5 MB | audio/webm, audio/mp3, audio/ogg, audio/wav |
| client-documents | PRIVATE | 10 MB | application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.* |

---

## 4. Conformité RGPD et Sécurité

### 4.1 Données personnelles concernées

Les documents et messages vocaux peuvent contenir des **données personnelles sensibles** au sens du RGPD, notamment :

- **Données de santé** : bilans médicaux, certificats médicaux, analyses
- **Données biométriques** : photos de progression physique
- **Données personnelles** : pièces d'identité, contrats

### 4.2 Obligations légales

| Obligation | Mesure à implémenter |
|------------|---------------------|
| **Consentement** | Informer le client avant tout téléversement de document |
| **Minimisation** | Ne collecter que les documents strictement nécessaires |
| **Limitation de conservation** | Définir une durée de conservation (ex: 3 ans après fin de contrat) |
| **Droit d'accès** | Permettre au client de télécharger tous ses documents |
| **Droit à l'effacement** | Permettre la suppression des documents sur demande |
| **Sécurité** | Chiffrement, accès restreint, logs d'accès |

### 4.3 Mesures de sécurité recommandées

**Stockage sécurisé :**

- Buckets PRIVATE (non publics)
- URLs signées avec expiration (1 heure max)
- Politiques RLS strictes

**Contrôle d'accès :**

```sql
-- Seul le client propriétaire et son coach peuvent voir les documents
CREATE POLICY "client_documents_select" ON public.client_documents
FOR SELECT TO authenticated
USING (
  client_id = auth.uid() 
  OR coach_id = auth.uid()
  OR public.is_admin()
);

-- Seul le propriétaire peut supprimer ses documents
CREATE POLICY "client_documents_delete" ON public.client_documents
FOR DELETE TO authenticated
USING (uploaded_by = auth.uid() OR public.is_admin());
```

**Journalisation :**

- Logger les accès aux documents sensibles
- Conserver les logs pendant 1 an minimum

### 4.4 Mentions légales à ajouter

Lors du téléversement d'un document, afficher :

> « En téléversant ce document, vous consentez à son stockage sécurisé sur nos serveurs. Vos données sont protégées conformément au RGPD. Vous pouvez demander la suppression de vos documents à tout moment. »

### 4.5 Politique de conservation

| Type de donnée | Durée de conservation | Action à l'expiration |
|----------------|----------------------|----------------------|
| Messages texte | 5 ans après dernier message | Archivage puis suppression |
| Messages vocaux | 2 ans | Suppression automatique |
| Documents client | 3 ans après fin de relation | Notification puis suppression |

---

## 5. Plan d'implémentation

### Phase 1 : Base de données
1. Ajouter les colonnes à la table `messages`
2. Créer la table `client_documents`
3. Créer les buckets Storage
4. Configurer les politiques RLS

### Phase 2 : Indicateur de lecture (Coach)
1. Modifier le frontend pour afficher l'indicateur
2. Ajouter la logique de mise à jour `read_at`
3. Afficher "Lu" ou "Non lu" côté coach

### Phase 3 : Messages vocaux (Coach)
1. Intégrer l'enregistrement audio (MediaRecorder API)
2. Upload vers le bucket `voice-messages`
3. Lecteur audio dans la messagerie
4. Affichage de la durée

### Phase 4 : Documents/Pièces jointes
1. Interface d'upload dans la messagerie (coach)
2. Interface documents dans le profil client
3. Prévisualisation des documents
4. Téléchargement sécurisé

---

## 6. Résumé des actions

| Action | Priorité | Complexité |
|--------|----------|------------|
| Migration BDD (colonnes messages) | Haute | Faible |
| Création table client_documents | Haute | Faible |
| Création buckets Storage | Haute | Faible |
| Politiques RLS | Haute | Moyenne |
| Indicateur de lecture | Haute | Faible |
| Messages vocaux | Moyenne | Moyenne |
| Pièces jointes messagerie | Moyenne | Moyenne |
| Interface documents profil | Moyenne | Moyenne |
| Mentions RGPD | Haute | Faible |

---

## 7. Questions en suspens

1. **Durée maximale des vocaux** : 2 minutes recommandé (limite de taille)
2. **Types de documents autorisés** : PDF, images, Word, Excel ?
3. **Notification par email** : Notifier le client quand un document est partagé ?
4. **Historique des accès** : Faut-il logger qui a consulté quel document ?

---

*Rapport préparé pour validation avant implémentation.*
