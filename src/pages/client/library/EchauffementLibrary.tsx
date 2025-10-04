import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ExerciseListPage from './ExerciseListPage';

const EchauffementLibrary: React.FC = () => {
    const { user, exercises } = useAuth();
    
    const echauffementExercises = useMemo(() => {
        return exercises.filter(ex => 
            ex.category === 'Échauffement' &&
            (ex.coachId === 'system' || ex.coachId === user?.coachId)
        );
    }, [exercises, user]);

    return (
        <ExerciseListPage 
            title="Échauffement" 
            exercises={echauffementExercises}
        />
    );
};

export default EchauffementLibrary;
