import React, { useState, useMemo, useEffect } from 'react';
import { Client, WorkoutProgram } from '../types';
import ProgramDetailView from './ProgramDetailView';
import { useAuth } from '../context/AuthContext';
import { markProgramAsViewedByCoach } from '../services/coachProgramViewService';
import { markCompletedSessionsAsViewed } from '../services/clientProgramService';

// --- ICONS ---
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />{' '}
  </svg>
);
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    {' '}
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />{' '}
  </svg>
);
const ArrowUpRightOnBoxIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
    />
  </svg>
);

interface ClientHistoryModalProps {
  clientId: string;
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
}

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  clientId,
  isOpen,
  isMinimized,
  onMinimize,
  onRestore,
  onClose,
}) => {
  const { clients } = useAuth();
  const client = useMemo(() => clients.find((c) => c.id === clientId), [clientId, clients]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);

  // Marquer toutes les séances complétées du client comme vues quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && !isMinimized && client?.assignedPrograms) {
      client.assignedPrograms.forEach(async (program) => {
        // Marquer les séances complétées comme vues
        await markCompletedSessionsAsViewed(program.id);
        // Aussi marquer le programme comme vu (pour compatibilité)
        if (!program.viewedByCoach) {
          await markProgramAsViewedByCoach(program.id);
        }
      });
    }
  }, [isOpen, isMinimized, client]);

  const handleSelectProgram = (programId: string) => {
    setSelectedProgramIds((prev) => {
      if (prev.includes(programId)) {
        return prev.filter((id) => id !== programId);
      }
      if (prev.length < 3) {
        return [...prev, programId];
      }
      // Optional: notify user they can only select 3
      alert('Vous ne pouvez comparer que 3 programmes à la fois.');
      return prev;
    });
  };

  const selectedPrograms = useMemo(() => {
    return client?.assignedPrograms?.filter((p) => selectedProgramIds.includes(p.id)) || [];
  }, [client, selectedProgramIds]);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-10 w-80 h-12 bg-white rounded-t-lg shadow-2xl flex justify-between items-center px-4 z-50 border border-gray-300">
        <span className="font-semibold text-gray-800">Historique de {client?.firstName}</span>
        <button onClick={onRestore} className="text-gray-500 hover:text-primary">
          <ArrowUpRightOnBoxIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 z-40 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-light-bg rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg">
          <h2 className="text-xl font-bold">
            Historique de {client?.firstName} {client?.lastName}
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={onMinimize} className="text-gray-500 hover:text-gray-800 p-1">
              <MinusIcon className="w-6 h-6" />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Program List Sidebar */}
          <div className="w-1/5 bg-white border-r p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3">Programmes assignés</h3>
            <ul className="space-y-2">
              {client?.assignedPrograms?.map((program) => (
                <li key={program.id}>
                  <label className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                      checked={selectedProgramIds.includes(program.id)}
                      onChange={() => handleSelectProgram(program.id)}
                      disabled={
                        !selectedProgramIds.includes(program.id) && selectedProgramIds.length >= 3
                      }
                    />
                    <span className="ml-3 text-sm font-medium">{program.name}</span>
                  </label>
                </li>
              ))}
              {(!client?.assignedPrograms || client.assignedPrograms.length === 0) && (
                <p className="text-sm text-gray-500 text-center">
                  Aucun programme dans l'historique.
                </p>
              )}
            </ul>
          </div>

          {/* Comparison View */}
          <div className="w-4/5 p-6 overflow-y-auto">
            {selectedPrograms.length > 0 ? (
              <div className={`grid grid-cols-1 md:grid-cols-${selectedPrograms.length} gap-6`}>
                {selectedPrograms.map((program) => (
                  <div key={program.id}>
                    <ProgramDetailView program={program} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Sélectionnez jusqu'à 3 programmes à comparer.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientHistoryModal;
