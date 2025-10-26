import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorkoutProgram } from '../../types';

const ProgramCard: React.FC<{ program: WorkoutProgram }> = ({ program }) => (
  <div className="bg-client-card rounded-lg p-4">
    <h3 className="font-bold text-lg text-primary">{program.name}</h3>
    <p className="text-sm text-client-subtle mt-1">{program.objective}</p>
    <div className="flex justify-between items-center mt-4 text-sm">
      <span className="text-client-light">
        {(program.sessionsByWeek[1] || []).length} séances / semaine
      </span>
      <span className="text-client-light">{program.weekCount} semaines</span>
    </div>
    <button className="w-full bg-primary text-white font-bold py-2 mt-4 rounded-lg hover:bg-violet-700 transition-colors">
      Voir le programme
    </button>
  </div>
);

const ClientProgram: React.FC = () => {
  const { user } = useAuth();
  const programs = user?.assignedPrograms || [];

  return (
    <div className="space-y-4">
      {programs.length > 0 ? (
        programs.map((program) => <ProgramCard key={program.id} program={program} />)
      ) : (
        <div className="text-center py-10">
          <p className="text-client-light">Aucun programme ne vous a été assigné.</p>
          <p className="text-client-subtle text-sm mt-1">Contactez votre coach pour commencer.</p>
        </div>
      )}
    </div>
  );
};

export default ClientProgram;
