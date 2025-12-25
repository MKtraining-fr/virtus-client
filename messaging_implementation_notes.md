# Notes d'implémentation - Améliorations Messagerie

## Structure actuelle

### Type Message (types.ts ligne 329-340)
```typescript
interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  isVoice: boolean;
  voiceUrl?: string;
  seenBySender: boolean;
  seenByRecipient: boolean;
  subject?: string;
}
```

### Colonnes BDD ajoutées (migration 20251225)
- `read_at` : TIMESTAMPTZ - Horodatage de lecture
- `message_type` : TEXT - 'text', 'voice', 'document'
- `attachment_url` : TEXT - URL du fichier
- `attachment_name` : TEXT - Nom du fichier
- `attachment_type` : TEXT - Type MIME
- `voice_duration` : INTEGER - Durée en secondes

### Fichiers à modifier

1. **types.ts** - Mettre à jour l'interface Message
2. **typeMappers.ts** - Mettre à jour mapSupabaseMessageToMessage
3. **useDataStore.ts** - Mettre à jour addMessage et markMessageAsRead
4. **Messaging.tsx** - Ajouter indicateur de lecture, vocaux, pièces jointes

## Fonctionnalités à implémenter

### 1. Indicateur de lecture (coach uniquement)
- Utiliser `read_at` pour savoir si le message a été lu
- Afficher une icône "vu" (double check) sous les messages envoyés par le coach
- Mettre à jour `read_at` quand le client ouvre la conversation

### 2. Messages vocaux (coach uniquement)
- Bouton micro pour enregistrer
- Upload vers bucket `voice-messages`
- Afficher un lecteur audio dans la conversation
- Stocker `voice_duration` pour afficher la durée

### 3. Pièces jointes (coach uniquement)
- Bouton trombone pour joindre un document
- Upload vers bucket `client-documents`
- Afficher le nom du fichier avec lien de téléchargement
