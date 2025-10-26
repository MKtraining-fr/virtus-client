import React from 'react';
import { useAuth } from '../../context/AuthContext';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data for display, replace with real data from user object later
  const program = user?.assignedPrograms?.[0] || {
    name: 'Mon Programme',
    weekCount: 8,
    sessionsByWeek: {
      '1': [
        { id: 1, name: 'Séance 1', exercises: [] },
        { id: 2, name: 'Séance 2', exercises: [] },
        { id: 3, name: 'Séance 3', exercises: [] },
      ],
    },
  };
  const currentWeek = user?.programWeek || 1;
  const sessionProgress = user?.sessionProgress || 0;
  const sessionsForCurrentWeek =
    program.sessionsByWeek[currentWeek] ?? program.sessionsByWeek[1] ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-client-light">Bonjour, {user?.firstName} !</h2>
        <p className="text-client-subtle">Prêt à vous entraîner ?</p>
      </div>

      <div className="bg-client-card rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3 text-client-light">Votre programme en cours</h3>
        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="text-primary font-bold text-xl">{program.name}</p>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-sm text-client-subtle">Semaine</p>
              <p className="text-2xl font-bold text-client-light">
                {currentWeek}
                <span className="text-lg text-client-subtle">/{program.weekCount}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-client-subtle">Séance</p>
              <p className="text-2xl font-bold text-client-light">
                {sessionProgress}
                <span className="text-lg text-client-subtle">/{sessionsForCurrentWeek.length}</span>
              </p>
            </div>
            <button className="bg-primary text-white font-bold py-2 px-4 rounded-lg text-sm">
              Commencer
            </button>
          </div>
        </div>
      </div>
      <div className="bg-client-card rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-2 text-client-light">Statistiques rapides</h3>
        <p className="text-client-subtle text-sm">Bientôt disponible.</p>
      </div>
    </div>
  );
};

export default ClientDashboard;
