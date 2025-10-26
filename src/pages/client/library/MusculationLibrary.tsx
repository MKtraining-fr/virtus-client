import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ExerciseListPage from './ExerciseListPage';

const MusculationLibrary: React.FC = () => {
  const { user, exercises } = useAuth();

  const musculationExercises = useMemo(() => {
    return exercises.filter(
      (ex) =>
        ex.category === 'Musculation' &&
        (ex.coachId === 'system' || ex.coachId === user?.coachId || !ex.coachId)
    );
  }, [exercises, user]);

  return <ExerciseListPage title="Musculation" exercises={musculationExercises} />;
};

export default MusculationLibrary;
