-- Migration: Ajouter la politique UPDATE pour la table messages
-- Permet au destinataire de marquer les messages comme lus

-- Politique UPDATE : le destinataire peut mettre à jour les messages qu'il reçoit
-- (pour marquer comme lu)
CREATE POLICY "recipient_update_messages" ON public.messages
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Politique DELETE optionnelle : l'expéditeur peut supprimer ses propres messages
CREATE POLICY "sender_delete_messages" ON public.messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());
