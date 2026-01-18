import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useWorkoutStore } from '../../../stores/workoutStore';
import { useDrag } from '@use-gesture/react';
import ExerciseHeader from '../../../components/client/workout-cylinder/ExerciseHeader';
import SetsCylinder from '../../../components/client/workout-cylinder/SetsCylinder';
import RestTimer from '../../../components/client/workout-cylinder/RestTimer';
import ActionButtons from '../../../components/client/workout-cylinder/ActionButtons';
import type { WorkoutExercise, Exercise, PerformanceSet } from '../../../types';

const WorkoutCylinderView: React.FC = () => {
  const navigate = useNavigate();
  const { user, exercises: exerciseDB } = useAuth();
  const {
    currentExerciseIndex,
    exercises,
    performanceData,
    initializeWorkout,
    nextExercise,
    previousExercise,
    isRestTimerActive,
    restTimeLeft,
    startRestTimer,
    stopRestTimer,
  } = useWorkoutStore();

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Récupérer le programme actuel
  const baseProgram = user?.assignedProgram;
  const currentWeek = user?.programWeek || 1;

  // Initialiser le workout au montage
  useEffect(() => {
    if (baseProgram) {
      const sessionsForWeek = baseProgram.sessionsByWeek[currentWeek] || baseProgram.sessionsByWeek[1];
      if (sessionsForWeek && sessionsForWeek.length > 0) {
        const firstSession = sessionsForWeek[0];
        if (firstSession.exercises) {
          initializeWorkout(firstSession.exercises);
        }
      }
    }
  }, [baseProgram, currentWeek, initializeWorkout]);

  // Exercice courant
  const currentExercise = useMemo(() => {
    if (!exercises || exercises.length === 0) return null;
    return exercises[currentExerciseIndex] || null;
  }, [exercises, currentExerciseIndex]);

  // Détails complets de l'exercice
  const fullExerciseDetails = useMemo(() => {
    if (!currentExercise) return null;
    return exerciseDB.find((ex) => ex.id === currentExercise.exerciseId) || null;
  }, [currentExercise, exerciseDB]);

  // Unité de charge
  const loadUnit = useMemo(() => {
    if (!currentExercise?.details?.length) return 'kg';
    const firstUnit = currentExercise.details[0]?.load?.unit || 'kg';
    return currentExercise.details.every((d) => d.load.unit === firstUnit)
      ? firstUnit.toUpperCase()
      : 'kg';
  }, [currentExercise]);

  // Performances précédentes (semaine dernière)
  const previousPerformances = useMemo(() => {
    // TODO: Récupérer depuis performanceLog
    return {};
  }, []);

  // Vérifier si toutes les séries sont complétées
  const canCompleteExercise = useMemo(() => {
    if (!currentExercise) return false;
    const exerciseId = currentExercise.id.toString();
    const exercisePerformanceData = performanceData[exerciseId] || [];
    const totalSets = parseInt(currentExercise.sets, 10) || 0;
    
    return exercisePerformanceData
      .slice(0, totalSets)
      .every((set) => set.reps && set.load);
  }, [currentExercise, performanceData]);

  // Gestion du swipe horizontal (changement d'exercice)
  const bind = useDrag(
    ({ direction: [dx], velocity: [vx], last }) => {
      if (!last) return;

      const threshold = 0.5;
      if (Math.abs(vx) > threshold) {
        if (dx > 0) {
          // Swipe right → Exercice précédent
          previousExercise();
        } else {
          // Swipe left → Exercice suivant
          nextExercise();
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      threshold: 10,
      rubberband: true,
    }
  );

  const handleCompleteExercise = () => {
    if (!canCompleteExercise) return;

    // TODO: Sauvegarder les performances dans Supabase
    console.log('Exercice complété:', currentExercise?.name);
    console.log('Performances:', performanceData[currentExercise?.id.toString() || '']);

    // Démarrer le timer de repos si ce n'est pas le dernier exercice
    if (currentExerciseIndex < exercises.length - 1) {
      const restDuration = parseInt(currentExercise?.details?.[0]?.rest || '90', 10);
      startRestTimer(restDuration);
      
      // Passer à l'exercice suivant après le timer
      setTimeout(() => {
        nextExercise();
      }, restDuration * 1000);
    } else {
      // Dernier exercice → Aller au récapitulatif
      navigate('/client/workout');
    }
  };

  if (!currentExercise) {
    return (
      <div className="h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-primary text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-primary flex flex-col" {...bind()}>
      {/* Header fixe */}
      <ExerciseHeader
        exercise={currentExercise}
        fullExerciseDetails={fullExerciseDetails}
        onBack={() => navigate('/client/workout')}
        onOptionsClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
        onVideoClick={() => setIsVideoModalOpen(true)}
        onAlternativesClick={() => {/* TODO */}}
      />

      {/* Zone cylindre */}
      <div className="flex-1 relative overflow-hidden">
        <SetsCylinder
          exercise={currentExercise}
          previousPerformances={previousPerformances}
          loadUnit={loadUnit}
          onVideoClick={() => setIsVideoModalOpen(true)}
          onNotesClick={() => setIsNotesModalOpen(true)}
        />
      </div>

      {/* Boutons d'action */}
      <ActionButtons
        onComplete={handleCompleteExercise}
        onNext={nextExercise}
        isLastExercise={currentExerciseIndex === exercises.length - 1}
        canComplete={canCompleteExercise}
      />

      {/* Timer de repos flottant */}
      <RestTimer
        isActive={isRestTimerActive}
        duration={restTimeLeft}
        onComplete={stopRestTimer}
        onStop={stopRestTimer}
      />

      {/* TODO: Modals (Video, Notes, Options) */}
    </div>
  );
};

export default WorkoutCylinderView;
