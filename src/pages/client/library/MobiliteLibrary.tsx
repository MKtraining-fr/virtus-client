import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ExerciseListPage from './ExerciseListPage';

const MobiliteLibrary: React.FC = () => {
    const { user, exercises } = useAuth();
    
    const mobiliteExercises = useMemo(() => {
        return exercises.filter(ex => 
            ex.category === 'Mobilité' &&
            (ex.coachId === 'system' || ex.coachId === user?.coachId)
        );
    }, [exercises, user]);

    return (
        <ExerciseListPage 
            title="Mobilité" 
            exercises={mobiliteExercises}
        />
    );
};

export default MobiliteLibrary;
