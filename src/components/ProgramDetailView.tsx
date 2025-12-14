import React, { useMemo, useState } from 'react';
import { WorkoutProgram, WorkoutSession, WorkoutExercise } from '../types';
import Accordion from './Accordion';

// Helper function for deep comparison of sessions. Using JSON.stringify for simplicity.
const areSessionsIdentical = (
  sessionsA: WorkoutSession[],
  sessionsB: WorkoutSession[]
): boolean => {
  if (sessionsA.length !== sessionsB.length) return false;
  try {
    // Normalise les séances pour la comparaison : ignore les identifiants internes et autres champs techniques
    const normalizeSession = (session: WorkoutSession) => {
      const { 
        id: _ignoredId, 
        dbId: _ignoredDbId, 
        templateSessionId: _ignoredTemplateId,
        weekNumber: _ignoredWeekNumber,
        sessionOrder: _ignoredSessionOrder,
        ...restSession 
      } = session as any;
      
      return {
        name: session.name,
        exercises: session.exercises.map((exercise) => {
          const { 
            id: _exId, 
            dbId: _exDbId,
            ...restExercise 
          } = exercise as any;
          return restExercise;
        }),
      };
    };

    const comparableA = sessionsA.map(normalizeSession);
    const comparableB = sessionsB.map(normalizeSession);
    
    const stringA = JSON.stringify(comparableA);
    const stringB = JSON.stringify(comparableB);
    
    console.log('[areSessionsIdentical] Comparing:', stringA === stringB);
    if (stringA !== stringB) {
      console.log('[areSessionsIdentical] Diff detected');
      console.log('[areSessionsIdentical] A:', stringA.substring(0, 200));
      console.log('[areSessionsIdentical] B:', stringB.substring(0, 200));
    }
    
    return stringA === stringB;
  } catch (e) {
    console.error('Could not compare sessions:', e);
    return false;
  }
};

interface ProgramDetailViewProps {
  program: WorkoutProgram;
}

const getDisplayValue = (details: WorkoutExercise['details'], key: 'reps' | 'tempo' | 'rest') => {
  if (!details || details.length === 0) return 'N/A';
  const firstValue = details[0][key];
  const allSame = details.every((d) => d[key] === firstValue);
  if (allSame) return firstValue;
  return details.map((d) => d[key]).join(' / ');
};

const getLoadDisplayValue = (details: WorkoutExercise['details']) => {
  if (!details || details.length === 0) return 'N/A';
  const firstLoad = details[0].load;
  const allSame = details.every(
    (d) => d.load.value === firstLoad.value && d.load.unit === firstLoad.unit
  );
  if (allSame) return `${firstLoad.value} ${firstLoad.unit}`;
  return details.map((d) => d.load.value).join(' / ') + ` ${firstLoad.unit}`;
};

const WeekContent: React.FC<{ sessions: WorkoutSession[] }> = ({ sessions }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100 text-black uppercase text-xs">
        <tr>
          <th className="py-1 px-3 w-12 font-semibold">Séance</th>
          <th className="py-1 px-3 font-semibold">Exercice</th>
          <th className="py-1 px-3 font-semibold">Séries</th>
          <th className="py-1 px-3 font-semibold">Reps</th>
          <th className="py-1 px-3 font-semibold">Charge</th>
          <th className="py-1 px-3 font-semibold">Tempo</th>
          <th className="py-1 px-3 font-semibold">Repos</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session, sessionIndex) => (
          <React.Fragment key={session.id}>
            {session.exercises.length > 0 ? (
              session.exercises.map((ex, exerciseIndex) => (
                <tr
                  key={ex.id}
                  className={`bg-white ${exerciseIndex === 0 ? 'border-t-2 border-gray-300' : ''} ${sessionIndex === 0 && exerciseIndex === 0 ? '!border-t-0' : ''}`}
                >
                  {exerciseIndex === 0 ? (
                    <td
                      rowSpan={session.exercises.length}
                      className="py-1 px-3 align-middle font-bold text-lg text-center text-primary border-r"
                    >
                      S{sessionIndex + 1}
                    </td>
                  ) : null}
                  <td className="py-1 px-3 font-medium text-black">{ex.name}</td>
                  <td className="py-1 px-3 text-black">{ex.sets}</td>
                  <td className="py-1 px-3 text-black">{getDisplayValue(ex.details, 'reps')}</td>
                  <td className="py-1 px-3 text-black">{getLoadDisplayValue(ex.details)}</td>
                  <td className="py-1 px-3 text-black">{getDisplayValue(ex.details, 'tempo')}</td>
                  <td className="py-1 px-3 text-black">{getDisplayValue(ex.details, 'rest')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-1 px-3 align-middle font-bold text-lg text-center text-primary border-r">
                  S{sessionIndex + 1}
                </td>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Cette séance est vide.
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
        {sessions.length === 0 && (
          <tr>
            <td colSpan={7} className="text-center py-4 text-gray-500">
              Aucune séance pour cette semaine.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const ProgramDetailView: React.FC<ProgramDetailViewProps> = ({ program }) => {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [showAllWeeks, setShowAllWeeks] = useState<boolean>(false);

  const weeks = Object.keys(program.sessionsByWeek)
    .map(Number)
    .sort((a, b) => a - b);
  
  // La semaine de référence est toujours la semaine 1
  const firstWeekSessions = program.sessionsByWeek[1] || [];

  // Déterminer quelles semaines sont différentes de la semaine 1
  const weekDifferences = useMemo(() => {
    console.log('[ProgramDetailView] Calculating week differences for program:', program.name);
    
    const differences: Record<number, boolean> = {};
    
    weeks.forEach((weekNumber) => {
      if (weekNumber === 1) {
        differences[weekNumber] = false; // La semaine 1 est la référence
      } else {
        const currentWeekSessions = program.sessionsByWeek[weekNumber] || [];
        const isDifferent = !areSessionsIdentical(firstWeekSessions, currentWeekSessions);
        differences[weekNumber] = isDifferent;
        console.log(`[ProgramDetailView] Week ${weekNumber} different from week 1?`, isDifferent);
      }
    });
    
    return differences;
  }, [program.sessionsByWeek, weeks, firstWeekSessions]);

  const allWeeksIdentical = useMemo(() => {
    console.log('[ProgramDetailView] Checking if weeks are identical for program:', program.name);
    console.log('[ProgramDetailView] Weeks:', weeks);
    console.log('[ProgramDetailView] First week sessions:', firstWeekSessions);
    
    if (weeks.length <= 1) {
      console.log('[ProgramDetailView] Only one week, returning true');
      return true;
    }

    // Vérifier si au moins une semaine est différente
    const hasDifferences = Object.values(weekDifferences).some(isDiff => isDiff);
    console.log('[ProgramDetailView] Has differences?', hasDifferences);
    
    return !hasDifferences;
  }, [weekDifferences, weeks.length, firstWeekSessions]);

  if (weeks.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white">
        <h3 className="p-3 text-lg font-bold bg-gray-50 border-b">{program.name}</h3>
        <p className="p-4 text-center text-gray-500">
          Ce programme n'a pas encore de semaines définies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="p-3 text-lg font-bold bg-gray-50 border rounded-t-lg -mb-2">{program.name}</h3>
      
      {allWeeksIdentical ? (
        // Scénario 1 : Toutes les semaines sont identiques
        <Accordion
          title={weeks.length > 1 ? `Semaines 1 à ${weeks.length} (identiques)` : 'Semaine 1'}
          isOpenDefault={true}
        >
          <WeekContent sessions={firstWeekSessions} />
        </Accordion>
      ) : (
        // Scénario 2 : Les semaines sont différentes
        <div className="space-y-3">
          {/* Indicateur "Semaines variables" */}
          {!showAllWeeks && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-blue-800 font-medium">Semaines variables</span>
              </div>
              <button
                onClick={() => setShowAllWeeks(true)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
              >
                Voir toutes les semaines
              </button>
            </div>
          )}

          {/* Navigation par onglets (si showAllWeeks est true) */}
          {showAllWeeks && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Sélectionner une semaine :</span>
                <button
                  onClick={() => setShowAllWeeks(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Masquer
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {weeks.map((weekNumber) => (
                  <button
                    key={weekNumber}
                    onClick={() => setSelectedWeek(weekNumber)}
                    className={`
                      relative px-4 py-2 rounded-lg font-medium text-sm transition-colors
                      ${selectedWeek === weekNumber
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    Semaine {weekNumber}
                    {weekDifferences[weekNumber] && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" title="Différente de la semaine 1"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Affichage de la semaine sélectionnée */}
          <Accordion
            title={`Semaine ${selectedWeek}`}
            isOpenDefault={true}
          >
            <WeekContent sessions={program.sessionsByWeek[selectedWeek]} />
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default ProgramDetailView;
