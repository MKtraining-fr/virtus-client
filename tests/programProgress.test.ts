/**
 * Tests unitaires pour la logique de progression des programmes
 * 
 * Ce fichier contient des tests pour valider :
 * - Le calcul de la progression (séances/semaines)
 * - La gestion des cas limites (undefined, tableaux vides)
 * - La logique de passage à la semaine suivante
 */

import { describe, it, expect } from '@jest/globals';

// Types simulés (à adapter selon les vrais types de l'application)
interface WorkoutProgram {
  id: string;
  name: string;
  weekCount: number;
  sessionsByWeek: Record<number, WorkoutSession[]>;
  currentWeek?: number;
  currentSession?: number;
}

interface WorkoutSession {
  id: number;
  name: string;
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: number;
  name: string;
  sets: number | string;
  details?: Array<{
    reps: string;
    load: { value: string; unit: 'kg' | 'lbs' | '%' };
    tempo: string;
    rest: string;
  }>;
  intensification?: { id: number; value: string }[];
}

// Fonction pure pour calculer la progression
function computeProgramProgress(
  program: WorkoutProgram | null | undefined,
  userProgramWeek: number | undefined,
  userSessionProgress: number | undefined
): {
  currentWeek: number;
  totalWeeks: number;
  currentSession: number;
  totalSessions: number;
  progressPercentage: number;
  isCompleted: boolean;
} {
  if (!program) {
    return {
      currentWeek: 1,
      totalWeeks: 1,
      currentSession: 1,
      totalSessions: 1,
      progressPercentage: 0,
      isCompleted: false,
    };
  }

  const currentWeek = program.currentWeek || userProgramWeek || 1;
  const totalWeeks = program.weekCount || 1;
  const currentSession = program.currentSession || userSessionProgress || 1;
  
  const sessionsForCurrentWeek =
    program.sessionsByWeek?.[currentWeek] || program.sessionsByWeek?.[1] || [];
  const totalSessions = sessionsForCurrentWeek.length || 1;

  // Calcul du pourcentage global
  // (semaines complétées + progression de la semaine en cours) / total semaines
  const weeksCompleted = currentWeek - 1;
  const currentWeekProgress = Math.min(currentSession / totalSessions, 1);
  const progressPercentage = ((weeksCompleted + currentWeekProgress) / totalWeeks) * 100;

  const isCompleted = currentWeek >= totalWeeks && currentSession >= totalSessions;

  return {
    currentWeek,
    totalWeeks,
    currentSession,
    totalSessions,
    progressPercentage: Math.round(progressPercentage),
    isCompleted,
  };
}

// Fonction pour sécuriser l'accès aux détails d'un exercice
function getExerciseTargetValues(
  exercise: WorkoutExercise | null | undefined,
  setIndex: number
): {
  targetReps: string;
  targetLoad: string;
  loadUnit: string;
} {
  if (!exercise) {
    return { targetReps: '0', targetLoad: '0', loadUnit: 'KG' };
  }

  const targetReps =
    exercise.details?.[setIndex]?.reps || exercise.details?.[0]?.reps || '0';
  const targetLoad =
    exercise.details?.[setIndex]?.load?.value ||
    exercise.details?.[0]?.load?.value ||
    '0';
  
  const loadUnit =
    exercise.details?.[0]?.load?.unit?.toUpperCase() || 'KG';

  return { targetReps, targetLoad, loadUnit };
}

describe('Logique de progression des programmes', () => {
  describe('computeProgramProgress', () => {
    it('devrait gérer un programme undefined', () => {
      const result = computeProgramProgress(undefined, undefined, undefined);
      expect(result).toEqual({
        currentWeek: 1,
        totalWeeks: 1,
        currentSession: 1,
        totalSessions: 1,
        progressPercentage: 0,
        isCompleted: false,
      });
    });

    it('devrait gérer un programme null', () => {
      const result = computeProgramProgress(null, undefined, undefined);
      expect(result).toEqual({
        currentWeek: 1,
        totalWeeks: 1,
        currentSession: 1,
        totalSessions: 1,
        progressPercentage: 0,
        isCompleted: false,
      });
    });

    it('devrait calculer correctement la progression au début du programme', () => {
      const program: WorkoutProgram = {
        id: '1',
        name: 'Programme Force 8 semaines',
        weekCount: 8,
        sessionsByWeek: {
          1: [
            { id: 1, name: 'Séance 1', exercises: [] },
            { id: 2, name: 'Séance 2', exercises: [] },
            { id: 3, name: 'Séance 3', exercises: [] },
          ],
        },
      };

      const result = computeProgramProgress(program, 1, 1);
      expect(result.currentWeek).toBe(1);
      expect(result.totalWeeks).toBe(8);
      expect(result.currentSession).toBe(1);
      expect(result.totalSessions).toBe(3);
      expect(result.progressPercentage).toBe(4); // (0 + 1/3) / 8 * 100 ≈ 4%
      expect(result.isCompleted).toBe(false);
    });

    it('devrait calculer correctement la progression en milieu de programme', () => {
      const program: WorkoutProgram = {
        id: '1',
        name: 'Programme Force 8 semaines',
        weekCount: 8,
        sessionsByWeek: {
          1: [
            { id: 1, name: 'Séance 1', exercises: [] },
            { id: 2, name: 'Séance 2', exercises: [] },
            { id: 3, name: 'Séance 3', exercises: [] },
          ],
          4: [
            { id: 10, name: 'Séance 1', exercises: [] },
            { id: 11, name: 'Séance 2', exercises: [] },
            { id: 12, name: 'Séance 3', exercises: [] },
          ],
        },
      };

      const result = computeProgramProgress(program, 4, 2);
      expect(result.currentWeek).toBe(4);
      expect(result.totalWeeks).toBe(8);
      expect(result.currentSession).toBe(2);
      expect(result.totalSessions).toBe(3);
      expect(result.progressPercentage).toBe(46); // (3 + 2/3) / 8 * 100 ≈ 46%
      expect(result.isCompleted).toBe(false);
    });

    it('devrait détecter un programme terminé', () => {
      const program: WorkoutProgram = {
        id: '1',
        name: 'Programme Force 8 semaines',
        weekCount: 8,
        sessionsByWeek: {
          1: [
            { id: 1, name: 'Séance 1', exercises: [] },
            { id: 2, name: 'Séance 2', exercises: [] },
            { id: 3, name: 'Séance 3', exercises: [] },
          ],
          8: [
            { id: 22, name: 'Séance 1', exercises: [] },
            { id: 23, name: 'Séance 2', exercises: [] },
            { id: 24, name: 'Séance 3', exercises: [] },
          ],
        },
      };

      const result = computeProgramProgress(program, 8, 3);
      expect(result.currentWeek).toBe(8);
      expect(result.totalWeeks).toBe(8);
      expect(result.currentSession).toBe(3);
      expect(result.totalSessions).toBe(3);
      expect(result.progressPercentage).toBe(100);
      expect(result.isCompleted).toBe(true);
    });

    it('devrait utiliser le fallback sur semaine 1 si la semaine courante n\'existe pas', () => {
      const program: WorkoutProgram = {
        id: '1',
        name: 'Programme Force 8 semaines',
        weekCount: 8,
        sessionsByWeek: {
          1: [
            { id: 1, name: 'Séance 1', exercises: [] },
            { id: 2, name: 'Séance 2', exercises: [] },
          ],
        },
      };

      // Semaine 5 n'existe pas dans sessionsByWeek
      const result = computeProgramProgress(program, 5, 1);
      expect(result.totalSessions).toBe(2); // Fallback sur semaine 1
    });
  });

  describe('getExerciseTargetValues', () => {
    it('devrait gérer un exercice undefined', () => {
      const result = getExerciseTargetValues(undefined, 0);
      expect(result).toEqual({
        targetReps: '0',
        targetLoad: '0',
        loadUnit: 'KG',
      });
    });

    it('devrait gérer un exercice null', () => {
      const result = getExerciseTargetValues(null, 0);
      expect(result).toEqual({
        targetReps: '0',
        targetLoad: '0',
        loadUnit: 'KG',
      });
    });

    it('devrait gérer un exercice sans détails', () => {
      const exercise: WorkoutExercise = {
        id: 1,
        name: 'Développé couché',
        sets: 4,
      };

      const result = getExerciseTargetValues(exercise, 0);
      expect(result).toEqual({
        targetReps: '0',
        targetLoad: '0',
        loadUnit: 'KG',
      });
    });

    it('devrait gérer un exercice avec details vide', () => {
      const exercise: WorkoutExercise = {
        id: 1,
        name: 'Développé couché',
        sets: 4,
        details: [],
      };

      const result = getExerciseTargetValues(exercise, 0);
      expect(result).toEqual({
        targetReps: '0',
        targetLoad: '0',
        loadUnit: 'KG',
      });
    });

    it('devrait récupérer les valeurs correctes pour un exercice complet', () => {
      const exercise: WorkoutExercise = {
        id: 1,
        name: 'Développé couché',
        sets: 4,
        details: [
          { reps: '10', load: { value: '80', unit: 'kg' }, tempo: '2-0-1-0', rest: '90s' },
          { reps: '8', load: { value: '85', unit: 'kg' }, tempo: '2-0-1-0', rest: '90s' },
          { reps: '6', load: { value: '90', unit: 'kg' }, tempo: '2-0-1-0', rest: '120s' },
        ],
      };

      // Série 0
      const result0 = getExerciseTargetValues(exercise, 0);
      expect(result0).toEqual({
        targetReps: '10',
        targetLoad: '80',
        loadUnit: 'KG',
      });

      // Série 1
      const result1 = getExerciseTargetValues(exercise, 1);
      expect(result1).toEqual({
        targetReps: '8',
        targetLoad: '85',
        loadUnit: 'KG',
      });

      // Série inexistante (fallback sur série 0)
      const result5 = getExerciseTargetValues(exercise, 5);
      expect(result5).toEqual({
        targetReps: '10',
        targetLoad: '80',
        loadUnit: 'KG',
      });
    });

    it('devrait gérer un exercice avec détails incomplets', () => {
      const exercise: WorkoutExercise = {
        id: 1,
        name: 'Développé couché',
        sets: 4,
        details: [
          { reps: '10', load: { value: '', unit: 'kg' }, tempo: '2-0-1-0', rest: '90s' },
        ],
      };

      const result = getExerciseTargetValues(exercise, 0);
      expect(result.targetReps).toBe('10');
      expect(result.targetLoad).toBe(''); // Valeur vide mais pas undefined
      expect(result.loadUnit).toBe('KG');
    });
  });
});

describe('Cas limites et edge cases', () => {
  it('ne devrait pas crasher avec un programme ayant sessionsByWeek undefined', () => {
    const program: any = {
      id: '1',
      name: 'Programme incomplet',
      weekCount: 8,
      sessionsByWeek: undefined,
    };

    const result = computeProgramProgress(program, 1, 1);
    expect(result.totalSessions).toBe(1); // Fallback
    expect(result.isCompleted).toBe(false);
  });

  it('ne devrait pas crasher avec weekCount = 0', () => {
    const program: WorkoutProgram = {
      id: '1',
      name: 'Programme invalide',
      weekCount: 0,
      sessionsByWeek: {},
    };

    const result = computeProgramProgress(program, 1, 1);
    expect(result.totalWeeks).toBe(0);
    // Pas de division par zéro car on utilise || 1 dans le calcul
  });

  it('ne devrait pas avoir de division par zéro dans le calcul de progression', () => {
    const program: WorkoutProgram = {
      id: '1',
      name: 'Programme sans séances',
      weekCount: 8,
      sessionsByWeek: {
        1: [], // Aucune séance
      },
    };

    const result = computeProgramProgress(program, 1, 1);
    expect(result.totalSessions).toBe(1); // Fallback sur 1
    expect(result.progressPercentage).not.toBeNaN();
    expect(result.progressPercentage).not.toBe(Infinity);
  });
});

console.log('✅ Tous les tests sont définis. Exécutez avec Jest pour valider.');
