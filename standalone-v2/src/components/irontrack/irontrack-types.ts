// Types pour IronTrack

export interface DropSet {
  weight: number;
  reps: number | 'échec';
  completed: boolean;
}

export interface ExerciseSet {
  id: number;
  setNumber: number;
  type: 'WARMUP' | 'WORKING' | 'DROP';
  weight: number;
  reps: number | 'échec';
  completed: boolean;
  previousBest?: string;
  drops?: DropSet[];
}

export interface ExerciseProtocol {
  targetSets: number;
  targetReps: string;
  tempo: string;
  restSeconds: number;
}

export interface Exercise {
  name: string;
  videoUrl: string;
  protocol: ExerciseProtocol;
  sets: ExerciseSet[];
}
