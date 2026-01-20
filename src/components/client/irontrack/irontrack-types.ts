export enum SetType {
  WARMUP = 'WARMUP',
  WORKING = 'WORKING',
  DROP = 'DROP',
  FAILURE = 'FAILURE'
}

export interface ExerciseSet {
  id: string | number;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  type: SetType;
  previousBest?: string; // e.g. "100kg x 8"
  userNote?: string;
  userVideoUri?: string;
}

export interface Exercise {
  id?: string;
  name: string;
  targetMuscle?: string;
  videoUrl?: string; // Placeholder or generated
  protocol: {
    targetSets: number;
    targetReps: string; // e.g., "8-12"
    tempo: string; // e.g., "3-0-1-0"
    restSeconds: number;
  };
  sets: ExerciseSet[];
}

export interface CoachTip {
  text: string;
  type: 'MOTIVATION' | 'TECHNICAL' | 'LOAD_ADJUSTMENT';
}