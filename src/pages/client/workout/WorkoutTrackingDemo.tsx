import React, { useEffect } from 'react';
import { useWorkoutStore } from '../../../stores/workoutStore';
import WorkoutTrackingIronTrack from './WorkoutTrackingIronTrack';
import type { WorkoutExercise } from '../../../types';

/**
 * Demo version with mocked data for testing the IronTrack interface
 */
const WorkoutTrackingDemo: React.FC = () => {
  const { initializeWorkout } = useWorkoutStore();

  useEffect(() => {
    // Mock workout exercises
    const mockExercises: WorkoutExercise[] = [
      {
        id: 1,
        exerciseId: 'ex1',
        name: 'Développé Couché',
        illustrationUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop',
        sets: 5,
        reps: '8-12',
        load: '80',
        tempo: '3-0-1-0',
        restTime: '90',
        intensification: [],
      },
      {
        id: 2,
        exerciseId: 'ex2',
        name: 'Développé Incliné Haltères',
        illustrationUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop',
        sets: 4,
        reps: '10-12',
        load: '30',
        tempo: '3-0-1-0',
        restTime: '75',
        intensification: [],
      },
      {
        id: 3,
        exerciseId: 'ex3',
        name: 'Dips',
        illustrationUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
        sets: 3,
        reps: '12-15',
        load: '0',
        tempo: '2-0-1-0',
        restTime: '60',
        intensification: [],
      },
      {
        id: 4,
        exerciseId: 'ex4',
        name: 'Écartés Poulie Vis-à-vis',
        illustrationUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        sets: 4,
        reps: '12-15',
        load: '15',
        tempo: '2-0-2-0',
        restTime: '60',
        intensification: [],
      },
    ];

    // Initialize workout store with mock data
    initializeWorkout(mockExercises, 'Séance Push A - DÉMO');
  }, [initializeWorkout]);

  return <WorkoutTrackingIronTrack />;
};

export default WorkoutTrackingDemo;
