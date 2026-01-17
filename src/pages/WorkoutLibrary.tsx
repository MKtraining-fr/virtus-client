import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { WorkoutProgram, WorkoutSession, SessionExercise as SupabaseSessionExercise } from '../types';

import { reconstructWorkoutProgram } from '../utils/workoutMapper';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Input from '../components/Input';
import ProgramDetailView from '../components/ProgramDetailView';
import { assignProgramToClient, getAssignmentCountByProgram } from '../services/programAssignmentService';
import {
  getProgramsByCoachId,
  getSessionsByProgramId,
  getSessionExercisesBySessionId,
  getExercisesByIds,
  deleteProgram,
} from '../services/programService';
import { deleteSession } from '../services/sessionService';

// DEBUG: Log au niveau du module
console.error('[WorkoutLibrary] 📦 Module loaded!');

const WorkoutLibrary: React.FC = () => {
  const { user, clients, setClients, addNotification } = useAuth();
  
  // DEBUG: Log pour vérifier le user ID
  console.error('[WorkoutLibrary] 🚀 Component mounted, user ID:', user?.id);
  const {
    programs,
    sessions,
    isLoading,
    removeProgramFromState,
    removeSessionFromState,
  } = useSupabaseWorkoutData(user?.id, addNotification);

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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [programToPreview, setProgramToPreview] = useState<WorkoutProgram | null>(null);
  const [programToDelete, setProgramToDelete] = useState<WorkoutProgram | null>(null);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

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
    console.log('[handleAssign] 🚀 Début de l\'assignation');
    console.log('[handleAssign] itemToAssign:', itemToAssign);
    console.log('[handleAssign] selectedClientsForAssign:', selectedClientsForAssign);
    console.log('[handleAssign] user:', user);
    
    if (!itemToAssign || selectedClientsForAssign.length === 0 || !user) {
      console.log('[handleAssign] ❌ Vérification initiale échouée');
      return;
    }

    // Vérifier si c'est une séance isolée ou un programme
    console.log('[handleAssign] Vérification du type d\'item...');
    console.log('[handleAssign] exercises in itemToAssign:', 'exercises' in itemToAssign);
    console.log('[handleAssign] sessionsByWeek in itemToAssign:', 'sessionsByWeek' in itemToAssign);
    
    if ('exercises' in itemToAssign && !('sessionsByWeek' in itemToAssign)) {
      console.log('[handleAssign] ❌ Séance isolée détectée');
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
    
    console.log('[handleAssign] 📋 Données d\'assignation:');
    console.log('[handleAssign] templateId:', templateId);
    console.log('[handleAssign] coachId:', coachId);
    console.log('[handleAssign] startDate:', startDate);
    console.log('[handleAssign] Nombre de clients:', selectedClientsForAssign.length);

    let successCount = 0;
    let errorCount = 0;

    // Assigner le programme à chaque client sélectionné
    console.log('[handleAssign] 🔄 Début de la boucle d\'assignation...');
    for (const clientId of selectedClientsForAssign) {
      console.log(`[handleAssign] 📤 Assignation pour client: ${clientId}`);
      try {
        const result = await assignProgramToClient(templateId, clientId, coachId, startDate);
        console.log(`[handleAssign] 📥 Résultat reçu:`, result);
        
        if (result && result.success) {
          console.log(`[handleAssign] ✅ Succès pour client ${clientId}`);
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
          console.log(`[handleAssign] ❌ Échec pour client ${clientId}:`, result);
          errorCount++;
        }
      } catch (error) {
        console.error(`[handleAssign] 💥 Exception pour client ${clientId}:`, error);
        errorCount++;
      }
    }
    
    console.log('[handleAssign] 📊 Résultats finaux:');
    console.log('[handleAssign] successCount:', successCount);
    console.log('[handleAssign] errorCount:', errorCount);

    // Afficher le résultat
    console.log('[handleAssign] 📢 Affichage des notifications...');
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

    console.log('[handleAssign] 🏁 Fin de l\'assignation');
    setIsAssignModalOpen(false);
    setSelectedClientsForAssign([]);
  };

  const getTotalSessions = (program: WorkoutProgram) => {
    return Object.values(program.sessionsByWeek || {}).reduce(
      (total, weekSessions) => total + weekSessions.length,
      0
    );
  };

  const getSessionsPerWeek = (program: WorkoutProgram) => {
    const sessionsByWeek = program.sessionsByWeek || {};
    const weekCount = program.weekCount || 1;
    const totalSessions = getTotalSessions(program);
    return Math.round(totalSessions / weekCount);
  };

  const handleOpenPreviewModal = (program: WorkoutProgram) => {
    setProgramToPreview(program);
    setIsPreviewModalOpen(true);
  };

  const executeProgramDeletion = async (
    program: WorkoutProgram,
    { skipPrompt = false }: { skipPrompt?: boolean } = {}
  ) => {
    if (!skipPrompt) {
      const confirmed = window.confirm(
        `Voulez-vous vraiment supprimer le programme "${program.name}" ? Cette action est définitive.`
      );
      if (!confirmed) return;
    }

    setDeletingProgramId(program.id);
    const { success, affectedClientIds } = await deleteProgram(program.id);

    if (success) {
      removeProgramFromState(program.id);
      setAssignmentCounts((prev) => {
        const { [program.id]: _removed, ...rest } = prev;
        return rest;
      });
      addNotification({
        message: `Programme "${program.name}" supprimé avec succès.`,
        type: 'success',
      });

      affectedClientIds.forEach((clientId) => {
        addNotification({
          userId: clientId,
          fromName: `${user?.firstName ?? 'Votre'} ${user?.lastName ?? 'coach'}`.trim(),
          type: 'program_deleted',
          title: 'Programme supprimé',
          message: `Votre coach a supprimé le programme "${program.name}". Toutes les données liées ont été effacées et le programme n'est plus accessible, même s'il était en cours.`,
          link: '/app/workout',
        });
      });
    } else {
      addNotification({
        message: 'Erreur lors de la suppression du programme.',
        type: 'error',
      });
    }

    setProgramToDelete(null);
    setDeletingProgramId(null);
  };

  const handleDeleteProgram = (program: WorkoutProgram) => {
    const assignedCount = assignmentCounts[program.id] || 0;

    if (assignedCount > 0) {
      setProgramToDelete(program);
      return;
    }

    executeProgramDeletion(program);
  };

  const handleDeleteSession = async (session: WorkoutSession) => {
    if (!session.dbId) {
      addNotification({
        message: 'Impossible de supprimer cette séance : identifiant manquant.',
        type: 'error',
      });
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la séance "${session.name}" ? Cette action est définitive.`
    );
    if (!confirmed) return;

    setDeletingSessionId(session.dbId);
    const success = await deleteSession(session.dbId);

    if (success) {
      removeSessionFromState(session.dbId);
      addNotification({
        message: `Séance "${session.name}" supprimée avec succès.`,
        type: 'success',
      });
    } else {
      addNotification({
        message: 'Erreur lors de la suppression de la séance.',
        type: 'error',
      });
    }

    setDeletingSessionId(null);
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
                      {getSessionsPerWeek(program)} séances/semaine · {program.weekCount} semaines
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 flex justify-end space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenPreviewModal(program)}
                    >
                      Visualiser
                    </Button>
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
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteProgram(program)}
                      isLoading={deletingProgramId === program.id}
                    >
                      Supprimer
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
                <Card key={session.dbId || session.id} className="flex flex-col">
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
                          `/app/musculation/createur?editProgramId=${session.programId}&editSessionId=${session.dbId || session.id}`
                        )
                      }
                    >
                      Voir
                    </Button>
                    <Button size="sm" onClick={() => handleOpenAssignModal(session)}>
                      Assigner
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteSession(session)}
                      isLoading={deletingSessionId === session.dbId}
                      disabled={!session.dbId}
                    >
                      Supprimer
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

      {isPreviewModalOpen && programToPreview && (
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`Aperçu de "${programToPreview.name}"`}
          size="xl"
        >
          <div className="space-y-4">
            <ProgramDetailView program={programToPreview} />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setIsPreviewModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {programToDelete && (
        <Modal
          isOpen={Boolean(programToDelete)}
          onClose={() => setProgramToDelete(null)}
          title="Supprimer un programme assigné ?"
        >
          <div className="space-y-4">
            <p>
              Ce programme est actuellement assigné à{' '}
              <strong>{assignmentCounts[programToDelete.id] || 0}</strong> client(s). Si vous le supprimez,
              toutes les données associées (sessions, progrès, suivis) seront définitivement effacées pour ces clients.
            </p>
            <p className="text-sm text-gray-600">
              Les clients concernés recevront une notification et ne pourront plus accéder au programme, même s'il était en
              cours.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setProgramToDelete(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                isLoading={deletingProgramId === programToDelete.id}
                onClick={() => executeProgramDeletion(programToDelete, { skipPrompt: true })}
              >
                Confirmer la suppression
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

  const fetchProgramsAndSessions = useCallback(async () => {
    if (!coachId) {
      return;
    }
    setIsLoading(true);
    try {
      const supabasePrograms = await getProgramsByCoachId(coachId);
      
      // Traiter tous les programmes en parallèle
      const allWorkoutPrograms = await Promise.all(
        supabasePrograms.map(async (program) => {
          const supabaseSessions = await getSessionsByProgramId(program.id);
          
          // Charger tous les exercices de toutes les sessions en parallèle
          const sessionExercisesPromises = supabaseSessions.map(async (session) => ({
            sessionId: session.id,
            exercises: await getSessionExercisesBySessionId(session.id)
          }));
          
          const sessionExercisesResults = await Promise.all(sessionExercisesPromises);
          
          // Construire la map des exercices par session
          const allSessionExercises: Map<string, SupabaseSessionExercise[]> = new Map();
          const exerciseIds = new Set<string>();
          
          sessionExercisesResults.forEach(({ sessionId, exercises }) => {
            allSessionExercises.set(sessionId, exercises);
            exercises.forEach((ex) => {
              if (ex.exercise_id) exerciseIds.add(ex.exercise_id);
            });
          });
          
          // Charger les détails des exercices
          const exerciseDetails = await getExercisesByIds(Array.from(exerciseIds));
          
          // Reconstruire le programme
          return reconstructWorkoutProgram(
            program,
            supabaseSessions,
            allSessionExercises,
            exerciseDetails
          );
        })
      );
      
      // Extraire toutes les sessions
      const allWorkoutSessions: WorkoutSession[] = [];
      allWorkoutPrograms.forEach((program) => {
        Object.values(program.sessionsByWeek).forEach((weekSessions) => {
          allWorkoutSessions.push(...weekSessions);
        });
      });
      
      setPrograms(allWorkoutPrograms);
      setSessions(allWorkoutSessions);
    } catch (error) {
      console.error('[WorkoutLibrary] Error loading programs:', error);
      addNotification({
        message: 'Erreur lors du chargement des programmes et sessions.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [coachId, addNotification]);

  useEffect(() => {
    if (!coachId) {
      // Si coachId est undefined, on reste en loading
      setIsLoading(true);
      return;
    }
    fetchProgramsAndSessions();
  }, [coachId, fetchProgramsAndSessions]);

  // Effet pour définir isLoading à false si coachId reste undefined après 5 secondes
  useEffect(() => {
    if (!coachId) {
      const timeout = setTimeout(() => {
        console.error('[WorkoutLibrary] ⚠️ Coach ID still missing after 5s, stopping loading');
        setIsLoading(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [coachId]);

  const removeProgramFromState = useCallback((programId: string) => {
    setPrograms((prev) => prev.filter((program) => program.id !== programId));
    setSessions((prev) => prev.filter((session) => session.programId !== programId));
  }, []);

  const removeSessionFromState = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.dbId !== sessionId));
  }, []);

  return { programs, sessions, isLoading, removeProgramFromState, removeSessionFromState };
};
