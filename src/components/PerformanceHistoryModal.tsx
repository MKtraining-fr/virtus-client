import React, { useState, useEffect } from 'react';
import Modal from './Modal.tsx';
import ProgramPerformanceDetail from './ProgramPerformanceDetail.tsx';
import { getClientPerformanceLogs, markSessionsAsViewed } from '../services/coachClientProgramService.ts';

interface PerformanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
}

const PerformanceHistoryModal: React.FC<PerformanceHistoryModalProps> = ({
  isOpen,
  onClose,
  clientId,
}) => {
  const [programData, setProgramData] = useState<{
    program: any;
    performanceLogs: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !clientId) {
      setProgramData(null);
      return;
    }

    const loadPerformanceData = async () => {
      setIsLoading(true);
      console.log('[PerformanceHistoryModal] 🔄 Chargement des données pour clientId:', clientId);

      try {
        const data = await getClientPerformanceLogs(clientId);
        console.log('[PerformanceHistoryModal] ✅ Données chargées:', data);
        
        // Collecter les IDs de toutes les séances chargées
        const ids = data?.performanceLogs.map((log: any) => log.sessionId).filter(Boolean) || [];
        setSessionIds(ids);
        console.log('[PerformanceHistoryModal] 📋 IDs de séances collectés:', ids);
        
        setProgramData(data);
      } catch (error) {
        console.error('[PerformanceHistoryModal] ❌ Erreur lors du chargement:', error);
        setProgramData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [isOpen, clientId]);

  const handleClose = async () => {
    // Marquer les séances comme vues avant de fermer
    if (sessionIds.length > 0) {
      console.log('[PerformanceHistoryModal] 🔄 Marquage des séances comme vues avant fermeture');
      await markSessionsAsViewed(sessionIds);
    }
    onClose();
  };

  const modalTitle = programData
    ? `Historique de performance pour : ${programData.program.name}`
    : 'Historique de performance';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="xl">
      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Chargement de l'historique...</p>
        </div>
      ) : programData ? (
        <ProgramPerformanceDetail
          program={programData.program}
          performanceLogs={programData.performanceLogs}
        />
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">
            Aucun historique de performance à afficher pour ce client.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default PerformanceHistoryModal;
