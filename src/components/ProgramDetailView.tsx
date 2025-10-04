import React, { useMemo, useState } from 'react';
import { WorkoutProgram, WorkoutSession, WorkoutExercise } from '../types';
import Accordion from './Accordion';

// Helper function for deep comparison of sessions. Using JSON.stringify for simplicity.
const areSessionsIdentical = (sessionsA: WorkoutSession[], sessionsB: WorkoutSession[]): boolean => {
    if (sessionsA.length !== sessionsB.length) return false;
    try {
        // We remove 'id' from exercises for comparison as it can differ between weeks even if content is identical
        const comparableA = sessionsA.map(s => ({ ...s, exercises: s.exercises.map(({ id, ...ex }) => ex) }));
        const comparableB = sessionsB.map(s => ({ ...s, exercises: s.exercises.map(({ id, ...ex }) => ex) }));
        return JSON.stringify(comparableA) === JSON.stringify(comparableB);
    } catch (e) {
        console.error("Could not compare sessions:", e);
        return false;
    }
};

interface ProgramDetailViewProps {
    program: WorkoutProgram;
}

const getDisplayValue = (details: WorkoutExercise['details'], key: 'reps' | 'tempo' | 'rest') => {
    if (!details || details.length === 0) return 'N/A';
    const firstValue = details[0][key];
    const allSame = details.every(d => d[key] === firstValue);
    if (allSame) return firstValue;
    return details.map(d => d[key]).join(' / ');
};

const getLoadDisplayValue = (details: WorkoutExercise['details']) => {
    if (!details || details.length === 0) return 'N/A';
    const firstLoad = details[0].load;
    const allSame = details.every(d => d.load.value === firstLoad.value && d.load.unit === firstLoad.unit);
    if (allSame) return `${firstLoad.value} ${firstLoad.unit}`;
    return details.map(d => d.load.value).join(' / ') + ` ${firstLoad.unit}`;
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
                                <tr key={ex.id} className={`bg-white ${exerciseIndex === 0 ? 'border-t-2 border-gray-300' : ''} ${sessionIndex === 0 && exerciseIndex === 0 ? '!border-t-0' : ''}`}>
                                    {exerciseIndex === 0 ? (
                                        <td rowSpan={session.exercises.length} className="py-1 px-3 align-middle font-bold text-lg text-center text-primary border-r">
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
                        <td colSpan={7} className="text-center py-4 text-gray-500">Aucune séance pour cette semaine.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);


const ProgramDetailView: React.FC<ProgramDetailViewProps> = ({ program }) => {
    const weeks = Object.keys(program.sessionsByWeek).map(Number).sort((a,b) => a - b);
    const firstWeekSessions = program.sessionsByWeek[1] || [];

    const customizationStatus = useMemo(() => {
        const status = { allIdentical: true, customizedWeeks: new Set<number>() };
        if (weeks.length <= 1) return status;

        for (let i = 1; i < weeks.length; i++) {
            const weekNumber = weeks[i];
            if (!areSessionsIdentical(firstWeekSessions, program.sessionsByWeek[weekNumber] || [])) {
                status.allIdentical = false;
                status.customizedWeeks.add(weekNumber);
            }
        }
        return status;
    }, [program.sessionsByWeek, weeks, firstWeekSessions]);

    if (weeks.length === 0) {
        return (
             <div className="border border-gray-200 rounded-lg bg-white">
                <h3 className="p-3 text-lg font-bold bg-gray-50 border-b">{program.name}</h3>
                <p className="p-4 text-center text-gray-500">Ce programme n'a pas encore de semaines définies.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h3 className="p-3 text-lg font-bold bg-gray-50 border rounded-t-lg -mb-2">{program.name}</h3>
            {customizationStatus.allIdentical ? (
                 <Accordion 
                    title={weeks.length > 1 ? `Semaines 1 à ${weeks.length} (identiques)` : 'Semaine 1'} 
                    isOpenDefault={true}
                 >
                    <WeekContent sessions={firstWeekSessions} />
                </Accordion>
            ) : (
                weeks.map(weekNumber => {
                    const isCustomized = customizationStatus.customizedWeeks.has(weekNumber);
                    const titleNode = (
                        <div className="flex items-center gap-2">
                            <span>Semaine {weekNumber}</span>
                            {isCustomized && <span className="w-2.5 h-2.5 bg-primary rounded-full" title="Cette semaine est personnalisée"></span>}
                        </div>
                    );

                    return (
                        <Accordion 
                            key={weekNumber} 
                            title={titleNode} 
                            isOpenDefault={weekNumber === 1}
                        >
                            <WeekContent sessions={program.sessionsByWeek[weekNumber]} />
                        </Accordion>
                    );
                })
            )}
        </div>
    );
};

export default ProgramDetailView;
