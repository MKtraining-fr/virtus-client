import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const ClientWorkout: React.FC = () => {
  const { user } = useAuth();

  const program = user?.assignedProgram;
  const hasAssignedProgram = !!program;
  const hasAccessToFormations = user?.grantedFormationIds && user.grantedFormationIds.length > 0;
  const hasCoach = !!user?.coachId;

  const currentWeek = user?.programWeek || 1;
  const totalWeeks = program?.weekCount || 1;
  
  // Calculer le nombre de séances complétées et totales pour la semaine actuelle
  const sessionsThisWeek = program?.sessionsByWeek?.[currentWeek] || program?.sessionsByWeek?.[1] || [];
  const completedSessionsThisWeek = sessionsThisWeek.filter((s: any) => s.status === 'completed').length;
  const totalSessionsThisWeek = sessionsThisWeek.length || 1;
  
  const currentSession = completedSessionsThisWeek;
  const totalSessions = totalSessionsThisWeek;

  const ActionButton: React.FC<{
    title: string;
    subtitle: string;
    to: string;
    disabled?: boolean;
  }> = ({ title, subtitle, to, disabled }) => (
    <Link
      to={disabled ? '#' : to}
      className={`bg-white dark:bg-client-card rounded-lg p-4 flex justify-between items-center w-full transition-colors group border border-gray-200 dark:border-transparent ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10 dark:hover:bg-primary/20'}`}
      onClick={(e) => disabled && e.preventDefault()}
    >
      <div>
        <p className="font-bold text-gray-800 dark:text-client-light text-lg">{title}</p>
        <p className="text-sm text-gray-500 dark:text-client-subtle">{subtitle}</p>
      </div>
      {!disabled && (
        <ChevronRightIcon className="w-6 h-6 text-gray-400 dark:text-client-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      )}
    </Link>
  );

  return (
    <div className="space-y-6">
      {hasAssignedProgram && program ? (
        <Link
          to="/app/workout/current-program"
          className="block bg-white dark:bg-client-card rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-primary/10 transition-colors group border border-gray-200 dark:border-transparent"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-client-light text-lg">
                Programme en cours
              </h3>
              <p className="text-sm text-primary font-semibold">{program.name}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-client-light">
              <span className="text-sm font-semibold">Commencer</span>
              <ChevronRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center bg-gray-100 dark:bg-client-dark p-3 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 dark:text-client-subtle">Semaine</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-client-light">
                {currentWeek}
                <span className="text-xl text-gray-400 dark:text-client-subtle">/{totalWeeks}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-client-subtle">Séance</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-client-light">
                {currentSession}
                <span className="text-xl text-gray-400 dark:text-client-subtle">
                  /{totalSessions}
                </span>
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <div className="bg-white dark:bg-client-card rounded-lg p-6 text-center border border-gray-200 dark:border-transparent">
          <h3 className="font-bold text-gray-800 dark:text-client-light text-lg">
            Programme en cours
          </h3>
          <p className="text-sm text-gray-500 dark:text-client-subtle mt-2">
            {hasCoach
              ? "Aucun programme ne vous a été assigné pour le moment. Contactez votre coach pour commencer !"
              : "Vous n'avez pas encore de programme en cours. Utilisez le Workout Builder pour créer votre première séance !"}
          </p>
        </div>
      )}

      {/* Bouton BETA pour tester la nouvelle interface */}
      <Link
        to={hasAssignedProgram ? "/app/workout/tracking" : "/app/workout/tracking-demo"}
        className="block bg-gradient-to-r from-violet-600 to-violet-800 rounded-lg p-4 hover:from-violet-700 hover:to-violet-900 transition-all group border border-violet-500/50 shadow-lg"
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-lg uppercase tracking-tight">
                🎯 Nouvelle Interface 3D
              </h3>
              <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded-full">BETA</span>
            </div>
            <p className="text-sm text-violet-200 mt-1">Découvrez le nouveau design cylindre immersif</p>
          </div>
          <ChevronRightIcon className="w-6 h-6 text-white transition-transform group-hover:translate-x-1" />
        </div>
      </Link>

      <div className="grid grid-cols-1 gap-4">
        <ActionButton
          to="/app/workout/my-programs"
          title="Mes programmes"
          subtitle="Consultez vos programmes créés"
        />
        {(user?.canUseWorkoutBuilder ?? true) && (
          <ActionButton
            to="/app/workout/builder"
            title="Workout Builder"
            subtitle="Créez une séance personnalisée"
          />
        )}
        {hasAccessToFormations && (
          <ActionButton
            to="/app/library/formation"
            title="Formation"
            subtitle="Accédez à vos formations débloquées"
          />
        )}
      </div>
    </div>
  );
};

export default ClientWorkout;
