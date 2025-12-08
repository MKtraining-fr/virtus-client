import React, { useState, useEffect } from 'react';
import Modal from './Modal.tsx';
import ProgramPerformanceDetail from './ProgramPerformanceDetail.tsx';
import { getClientPerformanceLogs } from '../services/coachClientProgramService.ts';

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

  const modalTitle = programData
    ? `Historique de performance pour : ${programData.program.name}`
    : 'Historique de performance';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="xl">
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
