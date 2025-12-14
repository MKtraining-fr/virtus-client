import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClientAssignedPrograms, getCompletedSessionsCountForWeek } from '../../services/clientProgramService';
import { WorkoutProgram } from '../../types';
import { useAuth } from '../../context/AuthContext';

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
  const [assignedProgram, setAssignedProgram] = useState<WorkoutProgram | null>(
    user?.assignedProgram || user?.assignedPrograms?.[0] || null
  );
  const [isLoadingProgram, setIsLoadingProgram] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const [hasFetchedPrograms, setHasFetchedPrograms] = useState(false);
  const [completedSessionsThisWeek, setCompletedSessionsThisWeek] = useState<number>(0);

  useEffect(() => {
    setAssignedProgram(user?.assignedProgram || user?.assignedPrograms?.[0] || null);
    setHasFetchedPrograms(false);
  }, [user?.assignedProgram, user?.assignedPrograms]);

  useEffect(() => {
    const fetchAssignedPrograms = async () => {
      if (!user?.id || assignedProgram || isLoadingProgram || hasFetchedPrograms) return;

      setIsLoadingProgram(true);
      setProgramError(null);

      try {
        const programs = await getClientAssignedPrograms(user.id);
        const activeProgram =
          programs.find((p) => p.status === 'active') || programs[0] || null;
        setAssignedProgram(activeProgram);
      } catch (error) {
        setProgramError(
          "Impossible de charger votre programme pour le moment. Veuillez réessayer."
        );
        console.error('Erreur lors du chargement des programmes assignés :', error);
      } finally {
        setHasFetchedPrograms(true);
        setIsLoadingProgram(false);
      }
    };

    void fetchAssignedPrograms();
  }, [assignedProgram, hasFetchedPrograms, isLoadingProgram, user?.id]);

  const program = useMemo(() => assignedProgram, [assignedProgram]);
  const hasAssignedProgram = !!program;
  const hasAccessToFormations = user?.grantedFormationIds && user.grantedFormationIds.length > 0;

  const currentWeek = program?.currentWeek || user?.programWeek || 1;
  const totalWeeks = program?.weekCount || 1;
  // ✅ FIX: Ne pas fallback sur semaine 1 si currentWeek n'existe pas
  const totalSessions =
    (program?.sessionsByWeek?.[currentWeek] || []).length || 0;

  // Charger le nombre de séances complétées pour la semaine actuelle
  useEffect(() => {
    const fetchCompletedSessions = async () => {
      if (!program?.id) {
        setCompletedSessionsThisWeek(0);
        return;
      }

      try {
        const count = await getCompletedSessionsCountForWeek(program.id, currentWeek);
        setCompletedSessionsThisWeek(count);
      } catch (error) {
        console.error('Erreur lors du chargement des séances complétées:', error);
        setCompletedSessionsThisWeek(0);
      }
    };

    void fetchCompletedSessions();
  }, [program?.id, currentWeek]);

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
                {completedSessionsThisWeek}
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
          {programError ? (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{programError}</p>
          ) : isLoadingProgram ? (
            <p className="text-sm text-gray-500 dark:text-client-subtle mt-2">Chargement en cours...</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-client-subtle mt-2">
              Aucun programme ne vous a été assigné pour le moment. Contactez votre coach pour
              commencer !
            </p>
          )}
        </div>
      )}

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
