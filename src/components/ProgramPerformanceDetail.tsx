import React, { useState, useMemo } from 'react';
import { PerformanceLog, WorkoutProgram, WorkoutExercise, PerformanceSet } from '../types.ts';

// --- ICONS ---
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);
const UnviewedDot = () => <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" title="Non visualisé"></span>;
const ChatBubbleLeftIcon = (props: React.SVGProps<SVGSVGElement> & { title?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        {props.title && <title>{props.title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.53-.372A5.962 5.962 0 0 1 5.41 18.736a5.962 5.962 0 0 1-2.19-2.19c-.243-.63.264-1.282.895-1.282h3.532c.571 0 1.058-.448 1.135-1.02a8.25 8.25 0 0 0 0-4.92c-.077-.572-.564-1.02-1.135-1.02H4.115c-.63 0-1.138.652-.895 1.282A5.962 5.962 0 0 1 5.41 6.264a5.962 5.962 0 0 1 2.19-2.19c.63-.243 1.282.264 1.282.895v3.532c0 .571.448 1.058 1.02 1.135a8.25 8.25 0 0 0 4.92 0c.572-.077 1.02-.564 1.02-1.135V4.115c0-.63-.652-1.138-1.282-.895a5.962 5.962 0 0 1-2.19 2.19c-.63.243-.264 1.282.895 1.282h3.532c.571 0 1.058.448 1.135 1.02a8.25 8.25 0 0 0 0 4.92c.077.572.564-1.02 1.135 1.02h.001c.63 0 1.138-.652.895-1.282a5.962 5.962 0 0 1-2.19-2.19c-.243-.63.264-1.282.895-1.282h-3.532Z" />
    </svg>
);


// --- HELPERS ---
const calculateAverage = (sets: PerformanceSet[], field: 'reps' | 'load'): number | null => {
    if (!sets || sets.length === 0) return null;
    const validSets = sets.map(s => parseFloat(s[field])).filter(v => !isNaN(v));
    if (validSets.length === 0) return null;
    const sum = validSets.reduce((sum, val) => sum + val, 0);
    return sum / validSets.length;
};

const getComparisonClass = (current?: number | null, previous?: number | null): string => {
    if (current === null || previous === null || current === undefined || previous === undefined || current === 0 || previous === 0) return 'text-gray-800';
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-800';
};

const formatValue = (value: number | null): string => {
    if (value === null || value === undefined) return '-';
    // Use toFixed(1) for floats, but not for integers.
    return `${Number.isInteger(value) ? value : value.toFixed(1)}`;
};

interface HorizontalExerciseRowProps {
    exercise: WorkoutExercise;
    exerciseIndex: number;
    weekCount: number;
    logsByWeekAndSession: Map<number, Map<string, PerformanceLog>>;
    sessionName: string;
}

const HorizontalExerciseRow: React.FC<HorizontalExerciseRowProps> = ({ exercise, exerciseIndex, weekCount, logsByWeekAndSession, sessionName }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const totalSets = Math.max(0, parseInt(exercise.sets, 10) || 0);

    const isEven = exerciseIndex % 2 === 0;
    const rowBgClass = isEven ? 'bg-white' : 'bg-gray-50';
    const hoverBgClass = 'hover:bg-blue-50';

    return (
        <React.Fragment>
            {/* Summary Row */}
            <tr className={`${rowBgClass} ${hoverBgClass}`}>
                <td className={`sticky left-0 ${rowBgClass} p-2 font-medium text-black border-r w-48 min-w-[192px]`}>
                    <div className="flex items-center">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-gray-500 hover:text-primary mr-2">
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <span>{exercise.name}</span>
                    </div>
                </td>
                {[...Array(weekCount)].map((_, weekIndex) => {
                    const week = weekIndex + 1;
                    const log = logsByWeekAndSession.get(week)?.get(sessionName);
                    const prevLog = logsByWeekAndSession.get(week - 1)?.get(sessionName);

                    const exerciseLogInLog = log?.exerciseLogs.find(e => e.exerciseName === exercise.name);
                    const prevExerciseLogInLog = prevLog?.exerciseLogs.find(e => e.exerciseName === exercise.name);

                    const avgReps = calculateAverage(exerciseLogInLog?.loggedSets || [], 'reps');
                    const avgLoad = calculateAverage(exerciseLogInLog?.loggedSets || [], 'load');
                    const prevAvgReps = calculateAverage(prevExerciseLogInLog?.loggedSets || [], 'reps');
                    const prevAvgLoad = calculateAverage(prevExerciseLogInLog?.loggedSets || [], 'load');

                    const repsClass = getComparisonClass(avgReps, prevAvgReps);
                    const loadClass = getComparisonClass(avgLoad, prevAvgLoad);
                    const hasUnviewedSets = exerciseLogInLog?.loggedSets.some(s => s.viewedByCoach === false);
                    const hasCommentsInLog = exerciseLogInLog?.loggedSets.some(s => !!s.comment);
                    
                    return (
                        <td key={week} className="p-2 text-left border-l min-w-[192px]">
                            {exerciseLogInLog ? (
                                <div className="flex items-center w-full">
                                    <div className="w-5 shrink-0 flex items-center justify-center">
                                        {hasUnviewedSets && <UnviewedDot />}
                                    </div>
                                    <span className={`w-10 text-right pr-1 font-mono ${repsClass}`}>{formatValue(avgReps)}</span>
                                    <span className="text-gray-700 mr-2 shrink-0">reps</span>
                                    <span className={`w-12 text-right pr-1 font-mono ${loadClass}`}>{formatValue(avgLoad)}</span>
                                    <span className="text-gray-700 shrink-0">{exercise.details[0]?.load.unit || 'kg'}</span>
                                    <div className="flex-grow flex justify-end pl-2">
                                        {hasCommentsInLog && (
                                            <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400 shrink-0" title="Des commentaires sont présents dans cette séance" />
                                        )}
                                    </div>
                                </div>
                            ) : '-'}
                        </td>
                    );
                })}
            </tr>
            {/* Detail Rows */}
            {isExpanded && [...Array(totalSets)].map((_, setIndex) => (
                 <tr key={setIndex} className={`${rowBgClass} text-sm`}>
                    <td className={`sticky left-0 ${rowBgClass} p-2 pl-12 text-gray-700 italic border-r w-48 min-w-[192px]`}>
                        — Série {setIndex + 1}
                    </td>
                    {[...Array(weekCount)].map((_, weekIndex) => {
                         const week = weekIndex + 1;
                         const set = logsByWeekAndSession.get(week)?.get(sessionName)?.exerciseLogs.find(e => e.exerciseName === exercise.name)?.loggedSets[setIndex];
                         const prevSet = logsByWeekAndSession.get(week - 1)?.get(sessionName)?.exerciseLogs.find(e => e.exerciseName === exercise.name)?.loggedSets[setIndex];

                         const repsClass = getComparisonClass(set ? parseFloat(set.reps) : null, prevSet ? parseFloat(prevSet.reps) : null);
                         const loadClass = getComparisonClass(set ? parseFloat(set.load) : null, prevSet ? parseFloat(prevSet.load) : null);

                        return (
                             <td key={week} className="p-2 text-left border-l align-top min-w-[192px]">
                                {set ? (
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center">
                                            <div className="w-5 shrink-0 flex items-center justify-center">
                                                {set.viewedByCoach === false && <UnviewedDot />}
                                            </div>
                                            <span className={`w-10 text-right pr-1 font-mono ${repsClass}`}>{set.reps}</span>
                                            <span className="text-gray-700 mr-2 shrink-0">reps</span>
                                            <span className={`w-12 text-right pr-1 font-mono ${loadClass}`}>{set.load}</span>
                                            <span className="text-gray-700 shrink-0">{exercise.details[0]?.load.unit || 'kg'}</span>
                                        </div>
                                        {set.comment && (
                                            <div className="relative group">
                                                <ChatBubbleLeftIcon className="w-5 h-5 text-gray-400 hover:text-primary cursor-pointer" />
                                                <div className="absolute bottom-full right-0 mb-2 w-max max-w-xs p-2 text-sm text-white bg-gray-900 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10 pointer-events-none text-left whitespace-pre-wrap">
                                                    {set.comment}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : '-'}
                            </td>
                        )
                    })}
                </tr>
            ))}
        </React.Fragment>
    );
};


interface ProgramPerformanceDetailProps {
    program: WorkoutProgram;
    performanceLogs: PerformanceLog[];
}

const ProgramPerformanceDetail: React.FC<ProgramPerformanceDetailProps> = ({ program, performanceLogs }) => {
    const [selectedSessionName, setSelectedSessionName] = useState<string | 'all'>('all');
    
    const logsByWeekAndSession = useMemo(() => {
        const map = new Map<number, Map<string, PerformanceLog>>();

        for (const log of performanceLogs) {
            if (!log.week || log.programName !== program.name) continue;

            const weekNumber = log.week;

            if (!map.has(weekNumber)) {
                map.set(weekNumber, new Map<string, PerformanceLog>());
            }
            map.get(weekNumber)!.set(log.sessionName, log);
        }

        return map;
    }, [performanceLogs, program.name]);

    const sessions = useMemo(() => {
        const allSessions = new Map<string, WorkoutExercise[]>();
        Object.values(program.sessionsByWeek).forEach(weekSessions => {
            weekSessions.forEach(session => {
                if (!allSessions.has(session.name)) {
                    allSessions.set(session.name, session.exercises);
                }
            });
        });
        return Array.from(allSessions, ([name, exercises]) => ({ name, exercises }));
    }, [program]);

    const filteredSessions = useMemo(() => {
        if (selectedSessionName === 'all') {
            return sessions;
        }
        return sessions.filter(s => s.name === selectedSessionName);
    }, [sessions, selectedSessionName]);
    
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <label htmlFor="session-filter" className="font-semibold">Filtrer par séance:</label>
                <select 
                    id="session-filter"
                    value={selectedSessionName}
                    onChange={(e) => setSelectedSessionName(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                >
                    <option value="all">Toutes les séances</option>
                    {sessions.map(session => (
                        <option key={session.name} value={session.name}>{session.name}</option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto border rounded-lg max-h-[65vh]">
                <table className="w-full text-sm table-auto border-collapse">
                    <thead className="sticky top-0 bg-gray-200 z-10">
                        <tr>
                            <th className="sticky left-0 bg-gray-200 p-2 text-left font-semibold border-r w-48 min-w-[192px] text-black">Exercice</th>
                            {[...Array(program.weekCount)].map((_, i) => (
                                <th key={i} className="p-2 text-left font-semibold border-l min-w-[192px] text-black">Semaine {i + 1}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSessions.map(session => (
                             <React.Fragment key={session.name}>
                                {selectedSessionName === 'all' && (
                                     <tr className="bg-gray-100">
                                        <td colSpan={program.weekCount + 1} className="p-2 font-bold text-black sticky left-0 bg-gray-100 border-r">
                                            {session.name}
                                        </td>
                                    </tr>
                                )}
                                {session.exercises.map((exercise, exerciseIndex) => (
                                    <HorizontalExerciseRow 
                                        key={exercise.id}
                                        exercise={exercise}
                                        exerciseIndex={exerciseIndex}
                                        weekCount={program.weekCount}
                                        logsByWeekAndSession={logsByWeekAndSession}
                                        sessionName={session.name}
                                    />
                                ))}
                             </React.Fragment>
                        ))}
                    </tbody>
                </table>
                 {filteredSessions.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        Aucun exercice dans cette séance.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgramPerformanceDetail;
