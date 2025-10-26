import React, { ReactNode } from 'react';

interface LiveRegionProps {
  children: ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  role?: 'status' | 'alert' | 'log';
  className?: string;
}

/**
 * Composant pour annoncer les changements dynamiques aux lecteurs d'écran
 *
 * Utilisation :
 *
 * // Pour les messages de succès (non urgent)
 * <LiveRegion politeness="polite" role="status">
 *   Client enregistré avec succès
 * </LiveRegion>
 *
 * // Pour les erreurs (urgent)
 * <LiveRegion politeness="assertive" role="alert">
 *   Erreur lors de l'enregistrement
 * </LiveRegion>
 *
 * @param politeness - Niveau d'urgence de l'annonce
 *   - "polite" : Annonce quand l'utilisateur a fini sa tâche en cours (par défaut)
 *   - "assertive" : Annonce immédiatement, interrompt l'utilisateur
 *   - "off" : Ne pas annoncer
 *
 * @param atomic - Si true, annonce tout le contenu de la région même si seule une partie a changé
 *
 * @param role - Rôle sémantique de la région
 *   - "status" : Information de statut (par défaut)
 *   - "alert" : Alerte importante
 *   - "log" : Journal de messages
 */
const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = true,
  role = 'status',
  className = '',
}) => {
  return (
    <div role={role} aria-live={politeness} aria-atomic={atomic} className={className}>
      {children}
    </div>
  );
};

export default LiveRegion;
