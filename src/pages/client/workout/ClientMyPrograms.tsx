import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { WorkoutProgram } from '../../../types';
import Button from '../../../components/Button';
import { ArrowLeftIcon } from '../../../constants/icons';
import Modal from '../../../components/Modal';
import ProgramDetailView from '../../../components/ProgramDetailView';


const ProgramCard: React.FC<{ program: WorkoutProgram; isNext?: boolean; onView: () => void; }> = ({ program, isNext = false, onView }) => (
    <div className="bg-white dark:bg-client-card rounded-lg p-4 flex flex-col justify-between relative shadow-sm border border-gray-200 dark:border-transparent">
         {isNext && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full z-10">
                Prochain programme
            </div>
        )}
        <div>
            <h3 className="font-bold text-lg text-primary pr-24">{program.name}</h3>
            <p className="text-sm text-gray-500 dark:text-client-subtle mt-1">{program.objective}</p>
        </div>
        <div className="mt-4">
             <div className="flex justify-between items-center mt-4 text-sm">
                <span className="text-gray-800 dark:text-client-light">{program.sessionsByWeek[1]?.length || 0} séance(s)</span>
                <span className="text-gray-800 dark:text-client-light">{program.weekCount} semaine(s)</span>
            </div>
            <Button className="w-full mt-4" onClick={onView}>
                Consulter
            </Button>
        </div>
    </div>
);

const ClientMyPrograms: React.FC = () => {
    const { user, theme } = useAuth();
    const navigate = useNavigate();
    const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
    
    const assignedByCoach = user?.assignedPrograms || [];
    const savedByClient = user?.savedPrograms || [];

    // The current program is assignedPrograms[0], which is shown on the main workout page.
    // The rest are shown here.
    const otherAssignedPrograms = assignedByCoach.slice(1);

    const handleView = (program: WorkoutProgram) => {
        setSelectedProgram(program);
    };

    const handleCloseModal = () => {
        setSelectedProgram(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-client-card rounded-full text-gray-800 dark:text-client-light hover:bg-gray-100 dark:hover:bg-primary/20 border border-gray-300 dark:border-gray-700">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-client-light">Mes Programmes</h1>
            </div>

             {otherAssignedPrograms.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-500 dark:text-client-subtle">Assignés par votre coach</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {otherAssignedPrograms.map((program, index) => (
                            <ProgramCard key={program.id} program={program} isNext={index === 0} onView={() => handleView(program)} />
                        ))}
                    </div>
                </div>
            )}
            
            {savedByClient.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-500 dark:text-client-subtle">Créés par moi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedByClient.map(program => <ProgramCard key={program.id} program={program} onView={() => handleView(program)} />)}
                    </div>
                </div>
            )}

            {otherAssignedPrograms.length === 0 && savedByClient.length === 0 && (
                 <div className="text-center py-10 bg-white dark:bg-client-card rounded-lg shadow-sm border border-gray-200 dark:border-transparent">
                    <p className="text-gray-900 dark:text-client-light">Vous n'avez aucun programme sauvegardé.</p>
                    <p className="text-gray-500 dark:text-client-subtle text-sm mt-2">Utilisez le Workout Builder pour créer votre premier programme !</p>
                    <Button onClick={() => navigate('/app/workout/builder')} className="mt-4">
                        Créer une séance
                    </Button>
                </div>
            )}
            
            {selectedProgram && (
                <Modal
                    isOpen={!!selectedProgram}
                    onClose={handleCloseModal}
                    title={selectedProgram.name}
                    size="xl"
                    theme={theme}
                >
                    <ProgramDetailView program={selectedProgram} />
                </Modal>
            )}
        </div>
    );
};

export default ClientMyPrograms;