import { Exercise, SetType } from './types';

export const MOCK_EXERCISE: Exercise = {
  id: 'ex-1',
  name: 'Incline Dumbbell Press',
  targetMuscle: 'Upper Chest',
  videoUrl: 'https://picsum.photos/seed/dumbbell/800/450',
  protocol: {
    targetSets: 4,
    targetReps: '8-10',
    tempo: '3-0-1-0',
    restSeconds: 90,
  },
  sets: [
    {
      id: 's1',
      setNumber: 1,
      weight: 30,
      reps: 12,
      completed: true,
      type: SetType.WARMUP,
      previousBest: '28kg x 12',
    },
    {
      id: 's2',
      setNumber: 2,
      weight: 34,
      reps: 10,
      completed: true,
      type: SetType.WORKING,
      previousBest: '34kg x 9',
    },
    {
      id: 's3',
      setNumber: 3,
      weight: 34,
      reps: 0, // Current active set
      completed: false,
      type: SetType.WORKING,
      previousBest: '34kg x 8',
    },
    {
      id: 's4',
      setNumber: 4,
      weight: 34,
      reps: 0,
      completed: false,
      type: SetType.WORKING,
      previousBest: '32kg x 10',
    },
  ],
};
