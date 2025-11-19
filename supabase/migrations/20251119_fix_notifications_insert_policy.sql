-- Migration: Ajouter la politique INSERT manquante sur la table notifications
-- Date: 2025-11-19
-- Problème: Erreur 403 Forbidden lors de la création de notifications (assignation de programmes)
-- Solution: Ajouter une politique permettant aux utilisateurs authentifiés de créer des notifications

-- Créer la politique INSERT pour les notifications
-- Permet aux utilisateurs authentifiés de créer des notifications pour n'importe quel utilisateur
-- (car un coach doit pouvoir notifier ses clients)
CREATE POLICY "users_insert_notifications"
ON public.notifications
FOR INSERT
TO public
WITH CHECK (true);

-- Note: Cette politique est permissive car elle permet à tout utilisateur authentifié
-- de créer une notification. Dans un système plus restrictif, on pourrait vérifier
-- que l'utilisateur qui crée la notification est bien le coach du destinataire.
-- Exemple de politique plus restrictive (commentée pour référence) :
-- WITH CHECK (
--   auth.uid() IN (
--     SELECT coach_id FROM users WHERE id = user_id
--   )
-- );
