import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useWorkoutStore } from '../../../stores/workoutStore';
import WorkoutTrackingIronTrack from './WorkoutTrackingIronTrack';

/**
 * Wrapper component that loads workout data and initializes the workoutStore
 * before rendering the IronTrack interface
 */
const WorkoutTrackingLoader: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { initializeWorkout, exercises } = useWorkoutStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string>('Séance en cours');

  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get assigned program
        const program = user?.assignedProgram;
        if (!program) {
          setError('Aucun programme assigné');
          return;
        }

        // Get current week
        const currentWeek = user?.programWeek || 1;
        
        // Get sessions for current week
        const sessionsThisWeek = program.sessionsByWeek?.[currentWeek] || [];
        
        if (sessionsThisWeek.length === 0) {
          setError('Aucune séance disponible pour cette semaine');
          return;
        }

        // Find the next pending session or the first session
        let activeSession = sessionsThisWeek.find((s: any) => s.status === 'pending' || !s.status);
        
        // If no pending session, take the first one
        if (!activeSession) {
          activeSession = sessionsThisWeek[0];
        }

        if (!activeSession || !activeSession.exercises || activeSession.exercises.length === 0) {
          setError('La séance ne contient aucun exercice');
          return;
        }

        // Set session name
        setSessionName(activeSession.name || 'Séance en cours');

        // Initialize workout store with exercises and session name
        initializeWorkout(activeSession.exercises, activeSession.name || 'Séance en cours');

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading workout data:', err);
        setError('Erreur lors du chargement de la séance');
        setIsLoading(false);
      }
    };

    loadWorkoutData();
  }, [user, initializeWorkout]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
          <p className="text-white text-lg">Chargement de la séance...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">Erreur</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/app/workout')}
            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render the IronTrack interface with session name
  return <WorkoutTrackingIronTrack />;
};

export default WorkoutTrackingLoader;
