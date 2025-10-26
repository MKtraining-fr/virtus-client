import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import Modal from './Modal.tsx';
import ProgramPerformanceDetail from './ProgramPerformanceDetail.tsx';
import { WorkoutProgram } from '../types.ts';

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
  const { clients, programs } = useAuth();

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const programToShowData = useMemo(() => {
    if (!client) return null;

    if (!client.performanceLog || client.performanceLog.length === 0) {
      const program = client.assignedPrograms?.[0];
      return program ? { program, logs: [] } : null;
    }

    const sortedLogs = [...client.performanceLog].sort(
      (a, b) =>
        new Date(b.date.split('/').reverse().join('-')).getTime() -
        new Date(a.date.split('/').reverse().join('-')).getTime()
    );
    const latestLog = sortedLogs[0];
    const programName = latestLog.programName;

    const programFromAssigned = client.assignedPrograms?.find((p) => p.name === programName);
    const programFromLibrary = programs.find((p) => p.name === programName);
    const program = programFromAssigned || programFromLibrary;

    if (!program) return null;

    const logsForProgram = client.performanceLog.filter((log) => log.programName === program.name);

    return { program, logs: logsForProgram };
  }, [client, programs]);

  const modalTitle = programToShowData
    ? `Historique de performance pour : ${programToShowData.program.name}`
    : 'Historique de performance';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="xl">
      {programToShowData ? (
        <ProgramPerformanceDetail
          program={programToShowData.program}
          performanceLogs={programToShowData.logs}
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
