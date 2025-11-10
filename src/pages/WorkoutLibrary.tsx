import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  WorkoutProgram,
  WorkoutSession,
  Client,
  Program as SupabaseProgram,
  Session as SupabaseSession,
  SessionExercise as SupabaseSessionExercise,
} from '../types';

import { reconstructWorkoutProgram } from '../utils/workoutMapper';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { assignProgramToClient, getAssignmentCountByProgram } from '../services/programAssignmentService';

const WorkoutLibrary: React.FC = () => {
  const { user, clients, setClients, addNotification } = useAuth();
  const { programs, sessions, isLoading } = useSupabaseWorkoutData(user?.id, addNotification);

  // Charger les comptes d'assignement
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user?.id || programs.length === 0) return;
      const counts = await getAssignmentCountByProgram(user.id);
      setAssignmentCounts(counts);
    };
    fetchCounts();
  }, [user?.id, programs]);

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('programs');

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [itemToAssign, setItemToAssign] = useState<WorkoutProgram | WorkoutSession | null>(null);
  const [selectedClientsForAssign, setSelectedClientsForAssign] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});

  const myClients = useMemo(() => {
    return clients.filter(
      (c) => c.role === 'client' && c.status === 'active' && c.coachId === user?.id
    );
  }, [clients, user]);

  const filteredClientsForModal = useMemo(() => {
    if (!searchTerm) return myClients;
    const lowercasedFilter = searchTerm.toLowerCase();
    return myClients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(lowercasedFilter) ||
        c.lastName.toLowerCase().includes(lowercasedFilter)
    );
  }, [myClients, searchTerm]);

  const handleOpenAssignModal = (item: WorkoutProgram | WorkoutSession) => {
    setItemToAssign(item);
    setIsAssignModalOpen(true);
    setSelectedClientsForAssign([]);
    setSearchTerm('');
  };

  const handleToggleClientSelection = (clientId: string) => {
    setSelectedClientsForAssign((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleAssign = async () => {
    if (!itemToAssign || selectedClientsForAssign.length === 0 || !user) return;

    // Vérifier si c'est une séance isolée ou un programme
    if ('exercises' in itemToAssign && !('sessionsByWeek' in itemToAssign)) {
      addNotification({
        message: "L'assignement de séances isolées n'est pas encore supporté. Veuillez créer un programme contenant cette séance.",
        type: 'warning',
      });
      return;
    }

    const programToAssign = itemToAssign as WorkoutProgram;
    const templateId = programToAssign.id;
    const coachId = user.id;
    const startDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    let successCount = 0;
    let errorCount = 0;

    // Assigner le programme à chaque client sélectionné
    for (const clientId of selectedClientsForAssign) {
      try {
        const result = await assignProgramToClient(templateId, clientId, coachId, startDate);
        
        if (result) {
          successCount++;
          
          // Notifier le client
          addNotification({
            userId: clientId,
            fromName: `${user.firstName} ${user.lastName}`,
            type: 'program_assigned',
            message: `vous a assigné le programme : ${programToAssign.name}.`,
            link: `/app/workout`,
          });
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Erreur lors de l'assignement pour le client ${clientId}:`, error);
        errorCount++;
      }
    }

    // Afficher le résultat
    if (successCount > 0) {
      addNotification({
        message: `Programme assigné avec succès à ${successCount} client(s).`,
        type: 'success',
      });
    }
    
    if (errorCount > 0) {
      addNotification({
        message: `Échec de l'assignement pour ${errorCount} client(s).`,
        type: 'error',
      });
    }

    setIsAssignModalOpen(false);
    setSelectedClientsForAssign([]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Bibliothèque d'entraînements</h1>
        <Button onClick={() => navigate('/app/musculation/createur')}>Nouveau programme</Button>
      </div>
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('programs')}
              className={`${activeTab === 'programs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Programmes
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`${activeTab === 'sessions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Séances
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p className="text-gray-500">Chargement des programmes...</p>
          ) : programs.length === 0 ? (
            <p className="text-gray-500">Aucun programme enregistré pour le moment.</p>
          ) : (
            <>
              {programs.map((program) => (
                <Card key={program.id} className="flex flex-col">
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                      {assignmentCounts[program.id] > 0 && (
                        <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                          Assigné à {assignmentCounts[program.id]} client(s)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {program.sessionsByWeek[1]?.length || 0} séances · {program.weekCount}{' '}
                      semaines
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 flex justify-end space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(`/app/musculation/createur?editProgramId=${program.id}`)
                      }
                    >
                      Modifier
                    </Button>
                    <Button size="sm" onClick={() => handleOpenAssignModal(program)}>
                      Assigner
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p className="text-gray-500">Chargement des séances...</p>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500">Aucune séance enregistrée pour le moment.</p>
          ) : (
            <>
              {sessions.map((session: WorkoutSession) => (
                <Card key={session.id} className="flex flex-col">
                  <div className="p-6 flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {session.exercises.length} exercices
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 flex justify-end space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/app/musculation/createur?editProgramId=${session.programId}&editSessionId=${session.id}`
                        )
                      }
                    >
                      Voir
                    </Button>
                    <Button size="sm" onClick={() => handleOpenAssignModal(session)}>
                      Assigner
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {isAssignModalOpen && itemToAssign && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assigner "${itemToAssign.name}"`}
        >
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredClientsForModal.length > 0 ? (
                filteredClientsForModal.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                      checked={selectedClientsForAssign.includes(client.id)}
                      onChange={() => handleToggleClientSelection(client.id)}
                    />
                    <span className="ml-3 text-sm font-medium">
                      {client.firstName} {client.lastName}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-center text-gray-500 p-4">Aucun client trouvé.</p>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAssign} disabled={selectedClientsForAssign.length === 0}>
                Assigner
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkoutLibrary;

// Hook to fetch and process programs/sessions from Supabase
const useSupabaseWorkoutData = (
  coachId: string | undefined,
  addNotification: (notification: {
    message: string;
    type: 'success' | 'error' | 'warning';
  }) => void
) => {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgramsAndSessions = async () => {
      if (!coachId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const supabasePrograms = await getProgramsByCoachId(coachId);
        const allWorkoutPrograms: WorkoutProgram[] = [];
        const allWorkoutSessions: WorkoutSession[] = [];

        for (const program of supabasePrograms) {
          const supabaseSessions = await getSessionsByProgramId(program.id);
          const allSessionExercises: Map<string, SupabaseSessionExercise[]> = new Map();
          const exerciseIds = new Set<string>();

          for (const session of supabaseSessions) {
            const exercises = await getSessionExercisesBySessionId(session.id);
            allSessionExercises.set(session.id, exercises);
            exercises.forEach((ex) => {
              if (ex.exercise_id) exerciseIds.add(ex.exercise_id);
            });
          }

          const exerciseDetails = await getExercisesByIds(Array.from(exerciseIds));
          const exerciseNamesMap = new Map<string, { name: string; illustrationUrl: string }>();
          exerciseDetails.forEach((ex) =>
            exerciseNamesMap.set(ex.id, {
              name: ex.name,
              illustrationUrl: ex.illustration_url || '',
            })
          );

          const workoutProgram = reconstructWorkoutProgram(
            program,
            supabaseSessions,
            allSessionExercises,
            exerciseNamesMap
          );
          allWorkoutPrograms.push(workoutProgram);

          Object.values(workoutProgram.sessionsByWeek).forEach((weekSessions) => {
            allWorkoutSessions.push(...weekSessions);
          });
        }
        setPrograms(allWorkoutPrograms);
        setSessions(allWorkoutSessions);
      } catch (error) {
        console.error('Erreur lors du chargement des programmes/sessions depuis Supabase:', error);
        addNotification({
          message: 'Erreur lors du chargement des programmes et sessions.',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgramsAndSessions();
  }, [coachId, addNotification]);

  return { programs, sessions, isLoading };
};
