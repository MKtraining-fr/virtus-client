import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Client, DataPoint, WorkoutProgram, PerformanceLog, NutritionLogEntry, Measurement, NutritionPlan, MealItem, NutritionDay } from '../types.ts';
import Accordion from '../components/Accordion.tsx';
import Card from '../components/Card.tsx';
import Modal from '../components/Modal.tsx';
import { useAuth } from '../src/context/AuthContext';
import ProgramDetailView from '../components/ProgramDetailView.tsx';
import ProgramPerformanceDetail from '../components/ProgramPerformanceDetail.tsx';
import Input from '../components/Input.tsx';
import Select from '../components/Select.tsx';
import Button from '../components/Button.tsx';

// --- ICONS ---
const EnvelopeIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>);
const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z" /></svg>);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>);
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>);

// --- COMPONENTS ---
const CoachNutritionPlanView: React.FC<{ plan: NutritionPlan }> = ({ plan }) => {
    const [selectedWeek, setSelectedWeek] = useState(1);
    const weekDays = plan.daysByWeek[selectedWeek] || [];

    const mealNames = useMemo(() => {
        const names = new Set<string>();
        Object.values(plan.daysByWeek).flat().forEach((day: NutritionDay) => {
            day.meals.forEach(meal => names.add(meal.name));
        });

        const standardOrder: { [key: string]: number } = {
            'Petit-déjeuner': 1,
            'Collation 1': 2,
            'Collation du matin': 2,
            'Déjeuner': 3,
            'Collation 2': 4,
            "Collation de l'après-midi": 4,
            'Collation': 4,
            'Dîner': 5,
            'Collation 3': 6,
            'Collation du soir': 6
        };
        
        return Array.from(names).sort((a, b) => (standardOrder[a] || 99) - (standardOrder[b] || 99));
    }, [plan.daysByWeek]);

    const calculateMacros = (items: MealItem[]) => {
        return items.reduce((acc, item) => {
            if (!item.food) return acc;
            const ratio = item.quantity / 100;
            acc.calories += (item.food.calories || 0) * ratio;
            acc.protein += (item.food.protein || 0) * ratio;
            acc.carbs += (item.food.carbs || 0) * ratio;
            acc.fat += (item.food.fat || 0) * ratio;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    };

    return (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white last:mb-0">
            <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
            <p className="text-sm text-gray-600 mb-4 italic">{plan.objective}</p>
            
            {plan.weekCount > 1 && (
                <div className="mb-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Weeks">
                        {[...Array(plan.weekCount)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setSelectedWeek(i + 1)}
                                className={`${selectedWeek === i + 1 ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                            >
                                Semaine {i + 1}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">Jour</th>
                            {mealNames.map(name => (
                                <th key={name} className="p-2 text-left font-semibold text-gray-600 min-w-[220px]">{name}</th>
                            ))}
                            <th className="p-2 text-left font-semibold text-gray-600 min-w-[150px]">Totaux Journaliers</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {weekDays.map(day => {
                            const dailyTotals = calculateMacros(day.meals.flatMap(m => m.items));

                            return (
                                <tr key={day.id}>
                                    <td className="p-2 font-bold align-top sticky left-0 bg-white">{day.name}</td>
                                    {mealNames.map(mealName => {
                                        const meal = day.meals.find(m => m.name === mealName);
                                        const mealMacros = meal ? calculateMacros(meal.items) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
                                        
                                        return (
                                            <td key={mealName} className="p-2 align-top border-l">
                                                {meal && meal.items.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {meal.items.map(item => (
                                                            <div key={item.id} className="flex justify-between text-gray-800">
                                                                <span className="pr-2">{item.food.name}</span>
                                                                <span className="font-medium text-gray-900 whitespace-nowrap">{item.quantity}{item.unit}</span>
                                                            </div>
                                                        ))}
                                                        <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold space-y-0.5">
                                                            <div>{Math.round(mealMacros.calories)} kcal</div>
                                                            <div className="flex justify-between flex-wrap gap-x-2">
                                                                <span className="text-red-500">P: {Math.round(mealMacros.protein)}g</span>
                                                                <span className="text-green-600">G: {Math.round(mealMacros.carbs)}g</span>
                                                                <span className="text-yellow-500">L: {Math.round(mealMacros.fat)}g</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 align-top font-bold border-l">
                                        <div>{Math.round(dailyTotals.calories)} kcal</div>
                                        <div className="font-normal text-xs space-y-0.5 mt-1">
                                            <div className="text-red-600">P: {Math.round(dailyTotals.protein)}g</div>
                                            <div className="text-green-700">G: {Math.round(dailyTotals.carbs)}g</div>
                                            <div className="text-yellow-600">L: {Math.round(dailyTotals.fat)}g</div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {weekDays.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Aucun jour défini pour cette semaine.</p>
                )}
            </div>
        </div>
    );
};

const InfoItem: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
    </div>
);

const renderAxes = (width: number, height: number, margin: any, yMin: number, yMax: number, data: any[], yUnit: string, xUnit: string) => {
    const yTickCount = 5;
    const yTicks = [];
    if (yMax > yMin) {
        const tickStep = (yMax - yMin) / (yTickCount - 1);
        for (let i = 0; i < yTickCount; i++) {
            yTicks.push(yMin + i * tickStep);
        }
    } else {
        yTicks.push(yMin);
    }
    
    return (
        <>
            {/* Y-axis */}
            {yTicks.map((tick, i) => {
                let yValue = height - margin.bottom;
                if (yMax > yMin) {
                    yValue = margin.top + (height - margin.top - margin.bottom) * (1 - (tick - yMin) / (yMax - yMin));
                }
                return (
                    <g key={`y-tick-${i}`} className="text-gray-400">
                        <line x1={margin.left} x2={width - margin.right} y1={yValue} y2={yValue} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                        <text x={margin.left - 8} y={yValue} dy="0.32em" textAnchor="end" fontSize="10" fill="currentColor">{Math.round(tick)}</text>
                    </g>
                );
            })}
            <text transform={`translate(${margin.left / 3}, ${height / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="currentColor" className="font-semibold">{yUnit}</text>
            
            {/* X-axis */}
            {data.map((d, i) => {
                 const x = margin.left + (i / (data.length - 1)) * (width - margin.left - margin.right);
                 if (i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) {
                     return (
                         <g key={`x-tick-${i}`} className="text-gray-500">
                            <text x={x} y={height - margin.bottom + 15} textAnchor="middle" fontSize="10">{d.date}</text>
                         </g>
                     )
                 }
                 return null;
            })}
             <text x={width/2} y={height - margin.bottom + 28} textAnchor="middle" fontSize="10" fill="currentColor" className="font-semibold">{xUnit}</text>
        </>
    )
}

const SimpleLineChart: React.FC<{ data: DataPoint[]; color: string; unit: string; }> = ({ data, color, unit }) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const svgWidth = 400;
    const svgHeight = 200;
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;
    
    if (!data || data.length < 2) {
        return <div style={{ height: svgHeight }} className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">Données insuffisantes.</div>;
    }

    const allValues = data.map(d => d.value);
    const yMinRaw = Math.min(...allValues);
    const yMaxRaw = Math.max(...allValues);
    const yPadding = (yMaxRaw - yMinRaw) * 0.1 || 2;
    const yMin = Math.max(0, yMinRaw - yPadding);
    const yMax = yMaxRaw + yPadding;

    const points = data
        .map((d, i) => {
            const x = margin.left + (i / (data.length - 1)) * chartWidth;
            let yValue = chartHeight;
            if (yMax > yMin) {
               yValue = chartHeight - ((d.value - yMin) / (yMax - yMin)) * chartHeight;
            }
            const y = margin.top + yValue;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            {renderAxes(svgWidth, svgHeight, margin, yMin, yMax, data, unit, '')}
            <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
        </svg>
    );
};

const MacroStackedBarChart: React.FC<{ data: { date: string; protein: number; carbs: number; fat: number }[] }> = ({ data }) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const svgWidth = 400;
    const svgHeight = 200;
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    if (!data || data.length === 0) {
        return <div style={{ height: svgHeight }} className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">Données insuffisantes.</div>;
    }
    
    const chartData = data.map(d => ({
        ...d,
        proteinKcal: (d.protein || 0) * 4,
        carbsKcal: (d.carbs || 0) * 4,
        fatKcal: (d.fat || 0) * 9,
        totalKcal: ((d.protein || 0) * 4) + ((d.carbs || 0) * 4) + ((d.fat || 0) * 9),
    }));

    const yMax = Math.max(...chartData.map(d => d.totalKcal), 1) * 1.1; // Add 1 to avoid yMax being 0
    const barWidth = chartWidth / chartData.length * 0.8;
    const barSpacing = chartWidth / chartData.length * 0.2;
    
    // Y-axis ticks calculation
    const yTickCount = 5;
    const yTicks = [];
    const yMin = 0;
    if (yMax > yMin) {
        const tickStep = (yMax - yMin) / (yTickCount - 1);
        for (let i = 0; i < yTickCount; i++) {
            yTicks.push(yMin + i * tickStep);
        }
    } else if (yMax > 0) {
        yTicks.push(yMin, yMax);
    }

    return (
        <div>
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                {/* Y-axis Grid and Labels */}
                {yTicks.map((tick, i) => {
                    const yValue = margin.top + chartHeight * (1 - (tick - yMin) / (yMax - yMin));
                    return (
                        <g key={`y-tick-${i}`} className="text-gray-400">
                            <line x1={margin.left} x2={svgWidth - margin.right} y1={yValue} y2={yValue} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                            <text x={margin.left - 8} y={yValue} dy="0.32em" textAnchor="end" fontSize="10" fill="currentColor">{Math.round(tick)}</text>
                        </g>
                    );
                })}
                <text transform={`translate(${margin.left / 3}, ${svgHeight / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="currentColor" className="font-semibold">kcal</text>
                
                {/* Bars, Data Labels, and X-axis labels */}
                {chartData.map((d, i) => {
                    const x = margin.left + i * (barWidth + barSpacing);
                    const proteinHeight = yMax > 0 ? chartHeight * (d.proteinKcal / yMax) : 0;
                    const carbsHeight = yMax > 0 ? chartHeight * (d.carbsKcal / yMax) : 0;
                    const fatHeight = yMax > 0 ? chartHeight * (d.fatKcal / yMax) : 0;
                    
                    const proteinY = chartHeight + margin.top - proteinHeight;
                    const carbsY = proteinY - carbsHeight;
                    const fatY = carbsY - fatHeight;

                    const textX = barWidth / 2;
                    const textColor = "white";
                    const textSize = "10px";

                    return (
                        <g key={d.date} transform={`translate(${x}, 0)`}>
                            <title>{`${d.date}\nTotal: ${d.totalKcal.toFixed(0)} kcal\nP: ${d.protein}g, C: ${d.carbs}g, F: ${d.fat}g`}</title>
                            {/* Bars */}
                            <rect y={proteinY} width={barWidth} height={proteinHeight} fill="#ef4444" />
                            <rect y={carbsY} width={barWidth} height={carbsHeight} fill="#10b981" />
                            <rect y={fatY} width={barWidth} height={fatHeight} fill="#facc15" />

                            {/* Calorie text inside bars */}
                            {proteinHeight > 12 && (
                                <text x={textX} y={proteinY + proteinHeight / 2} dy="0.35em" textAnchor="middle" fill={textColor} fontSize={textSize} fontWeight="bold">
                                    {Math.round(d.proteinKcal)}
                                </text>
                            )}
                            {carbsHeight > 12 && (
                                <text x={textX} y={carbsY + carbsHeight / 2} dy="0.35em" textAnchor="middle" fill={textColor} fontSize={textSize} fontWeight="bold">
                                    {Math.round(d.carbsKcal)}
                                </text>
                            )}
                            {fatHeight > 12 && (
                                <text x={textX} y={fatY + fatHeight / 2} dy="0.35em" textAnchor="middle" fill={textColor} fontSize={textSize} fontWeight="bold">
                                    {Math.round(d.fatKcal)}
                                </text>
                            )}

                            {/* Date label below bar */}
                            <text x={barWidth / 2} y={svgHeight - margin.bottom + 15} textAnchor="middle" fontSize="10" fill="currentColor" className="text-gray-600">
                                {d.date.substring(0, 5)}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="flex justify-center items-center gap-4 text-xs mt-2">
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#ef4444] rounded-sm"></span> Protéines</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#10b981] rounded-sm"></span> Glucides</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#facc15] rounded-sm"></span> Lipides</div>
            </div>
        </div>
    );
};


const MeasurementsLineChart: React.FC<{ data: ({ date: string } & Partial<Measurement>)[], selectedMeasurements: Array<keyof Measurement>}> = ({ data, selectedMeasurements }) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const svgWidth = 400;
    const svgHeight = 200;
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;
    
    const colors: Record<keyof Measurement, string> = { neck: '#F87171', chest: '#60A5FA', l_bicep: '#34D399', r_bicep: '#A78BFA', waist: '#FBBF24', hips: '#EC4899', l_thigh: '#2DD4BF', r_thigh: '#818CF8' };
    const measurementLabels: Record<keyof Measurement, string> = { neck: 'Cou', chest: 'Poitrine', l_bicep: 'Biceps G.', r_bicep: 'Biceps D.', waist: 'Taille', hips: 'Hanches', l_thigh: 'Cuisse G.', r_thigh: 'Cuisse D.' };


    const chartData = useMemo(() => {
        return data.filter(d => selectedMeasurements.some(key => d[key] !== undefined && d[key] !== null));
    }, [data, selectedMeasurements]);

    if (!chartData || chartData.length < 2 || selectedMeasurements.length === 0) {
        return <div style={{ height: svgHeight }} className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">Sélectionnez une mesure pour voir le graphique.</div>;
    }

    const allValues = chartData.flatMap(d => selectedMeasurements.map(key => d[key] as number)).filter(v => v !== undefined && v !== null);
    const yMinRaw = Math.min(...allValues);
    const yMaxRaw = Math.max(...allValues);
    const yPadding = (yMaxRaw - yMinRaw) * 0.1 || 2;
    const yMin = Math.max(0, yMinRaw - yPadding);
    const yMax = yMaxRaw + yPadding;

    const getPointsForKey = (key: keyof Measurement) => {
        return chartData
            .map((d, i) => {
                const value = d[key];
                if (value === undefined || value === null) return null;
                const x = margin.left + (i / (chartData.length - 1)) * chartWidth;
                let yValue = chartHeight;
                if(yMax > yMin) {
                   yValue = chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
                }
                const y = margin.top + yValue;
                return `${x},${y}`;
            })
            .filter(Boolean)
            .join(' ');
    };

    return (
         <div>
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                {renderAxes(svgWidth, svgHeight, margin, yMin, yMax, chartData, 'cm', '')}
                {selectedMeasurements.map(key => (
                    <polyline key={String(key)} fill="none" stroke={colors[key]} strokeWidth="2.5" points={getPointsForKey(key)} />
                ))}
            </svg>
            <div className="flex justify-center flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
                 {selectedMeasurements.map(key => (
                    <div key={String(key)} className="flex items-center gap-1">
                        <span style={{ backgroundColor: colors[key] }} className="w-3 h-3 rounded-sm"></span> 
                        <span>{measurementLabels[key]}</span>
                    </div>
                 ))}
            </div>
         </div>
    );
};

const ClientProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { clients, programs, setClients } = useAuth();
    const navigate = useNavigate();
    const client = clients.find(p => p.id === id);
    
    const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedHistoricalProgram, setSelectedHistoricalProgram] = useState<{ program: WorkoutProgram; logs: PerformanceLog[] } | null>(null);
    
    const [editableMacros, setEditableMacros] = useState(client?.nutrition.macros || { protein: 0, carbs: 0, fat: 0 });
    const [initialMacros, setInitialMacros] = useState(client?.nutrition.macros || { protein: 0, carbs: 0, fat: 0 });
    const [tdee, setTdee] = useState<number | null>(null);

    const [editableData, setEditableData] = useState({
        notes: client?.notes || '',
        medicalInfo: {
            history: client?.medicalInfo.history || '',
            allergies: client?.medicalInfo.allergies || '',
        }
    });
    const [newNote, setNewNote] = useState('');
    const measurementLabels: Record<keyof Measurement, string> = { neck: 'Cou', chest: 'Poitrine', l_bicep: 'Biceps G.', r_bicep: 'Biceps D.', waist: 'Taille', hips: 'Hanches', l_thigh: 'Cuisse G.', r_thigh: 'Cuisse D.' };
    const [selectedMeasurements, setSelectedMeasurements] = useState<Array<keyof Measurement>>(['chest']);
    const [selectedNutritionPlan, setSelectedNutritionPlan] = useState<NutritionPlan | null>(null);

    useEffect(() => {
        if (client) {
            setEditableData({
                notes: client.notes || '',
                medicalInfo: { history: client.medicalInfo.history || '', allergies: client.medicalInfo.allergies || '' }
            });
        }
    }, [client]);

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const date = new Date().toLocaleDateString('fr-FR');
        const formattedNote = `--- ${date} ---\n${newNote.trim()}`;
        setEditableData(prev => ({ ...prev, notes: `${formattedNote}\n\n${prev.notes}`.trim() }));
        setNewNote('');
    };

    const handleMedicalChange = (field: 'history' | 'allergies', value: string) => {
        setEditableData(prev => ({ ...prev, medicalInfo: { ...prev.medicalInfo, [field]: value } }));
    };

    const hasInfoChanges = useMemo(() => {
        if (!client) return false;
        return (
            editableData.notes !== (client.notes || '') ||
            editableData.medicalInfo.history !== (client.medicalInfo.history || '') ||
            editableData.medicalInfo.allergies !== (client.medicalInfo.allergies || '')
        );
    }, [editableData, client]);

    const handleSaveInfoChanges = () => {
        if (!client) return;
        const updatedClients = clients.map(c =>
            c.id === client.id ? { ...c, notes: editableData.notes, medicalInfo: { ...c.medicalInfo, ...editableData.medicalInfo } } : c
        );
        setClients(updatedClients as Client[]);
        alert('Modifications enregistrées !');
    };

    const parsedNotes = useMemo(() => {
        if (!editableData.notes) return [];
        return editableData.notes.split(/(?=---.*?---)/).map(note => note.trim()).filter(note => note)
            .map((note, index) => {
                const match = note.match(/--- (.*?) ---\n(.*)/s);
                return match ? { id: index, date: match[1], content: match[2].trim() } : { id: index, date: 'Note', content: note };
            });
    }, [editableData.notes]);

    const activityMultipliers = { 'Sédentaire': 1.2, 'Légèrement actif': 1.375, 'Actif': 1.55, 'Très actif': 1.725 };

    const baseMetabolicData = useMemo(() => {
        if (!client || !client.weight || !client.height || !client.age || !client.sex || !client.energyExpenditureLevel) return null;
        const bmr = client.sex === 'Homme'
            ? 88.362 + (13.397 * client.weight) + (4.799 * client.height) - (5.677 * client.age)
            : 447.593 + (9.247 * client.weight) + (3.098 * client.height) - (4.330 * client.age);
        const baseTdee = bmr * activityMultipliers[client.energyExpenditureLevel];
        return { bmr: Math.round(bmr), baseTdee: Math.round(baseTdee) };
    }, [client]);

    useEffect(() => {
        if (client && baseMetabolicData) {
            const { protein, carbs, fat } = client.nutrition.macros;
            const areMacrosSet = protein !== 0 || carbs !== 0 || fat !== 0;
            if (areMacrosSet) {
                setEditableMacros(client.nutrition.macros);
                setInitialMacros(client.nutrition.macros);
                setTdee((protein * 4) + (carbs * 4) + (fat * 9));
            } else {
                const targetTdee = baseMetabolicData.baseTdee;
                const pG = Math.round((targetTdee * 0.15) / 4), fG = Math.round((targetTdee * 0.35) / 9);
                const cG = Math.round((targetTdee - (pG * 4) - (fG * 9)) / 4);
                const defaultMacros = { protein: pG, carbs: cG, fat: fG };
                setEditableMacros(defaultMacros);
                setInitialMacros(defaultMacros);
                setTdee((pG * 4) + (cG * 4) + (fG * 9));
            }
        }
    }, [client, baseMetabolicData]);
    
    const editableCalculatedData = useMemo(() => {
        if (tdee === null || !client) return null;
        const { protein, carbs, fat } = editableMacros;
        const pKcal = protein * 4, cKcal = carbs * 4, fKcal = fat * 9;
        const oCal = pKcal + cKcal + fKcal;
        return {
            objectifCalorique: oCal,
            surplusDeficit: Math.round(oCal - tdee),
            surplusDeficitPercent: tdee > 0 ? ((oCal - tdee) / tdee) * 100 : 0,
            pieChartPercentages: { protein: oCal > 0 ? (pKcal / oCal) * 100 : 0, carbs: oCal > 0 ? (cKcal / oCal) * 100 : 0, fat: oCal > 0 ? (fKcal / oCal) * 100 : 0 },
            macros: { protein: { g: protein, kcal: pKcal }, carbs: { g: carbs, kcal: cKcal }, fat: { g: fat, kcal: fKcal } }
        };
    }, [tdee, editableMacros, client]);
    
    const handleMacroChange = (macro: 'protein' | 'carbs' | 'fat', value: string) => {
        const numValue = parseInt(value, 10);
        if (value === '' || numValue >= 0) {
            setEditableMacros(prev => ({ ...prev, [macro]: value === '' ? 0 : numValue }));
        }
    };

    const handleMacroAdjustment = (macro: 'protein' | 'carbs' | 'fat', amount: number) => {
        setEditableMacros(prev => ({ ...prev, [macro]: Math.max(0, (prev[macro] || 0) + amount) }));
    };

    const handleSaveMacros = () => {
        if (!client || !editableMacros || !editableCalculatedData) return;
        const newLogEntry: NutritionLogEntry = {
            date: new Date().toLocaleDateString('fr-FR'),
            weight: client.weight ?? null,
            calories: editableCalculatedData.objectifCalorique,
            macros: { ...editableMacros },
        };
        const updatedClients = clients.map(c => c.id === client.id ? { ...c, nutrition: { ...c.nutrition, macros: editableMacros, historyLog: [newLogEntry, ...(c.nutrition.historyLog || [])] } } : c);
        setClients(updatedClients);
        setInitialMacros(editableMacros);
        alert('Macros mises à jour avec succès ! Un log a été créé.');
    };

    const gradientStyle = { background: `conic-gradient(#ef4444 0% ${editableCalculatedData?.pieChartPercentages.protein || 0}%, #10b981 ${editableCalculatedData?.pieChartPercentages.protein || 0}% ${ (editableCalculatedData?.pieChartPercentages.protein || 0) + (editableCalculatedData?.pieChartPercentages.carbs || 0)}%, #facc15 ${ (editableCalculatedData?.pieChartPercentages.protein || 0) + (editableCalculatedData?.pieChartPercentages.carbs || 0)}% 100%)` };

    const historicalPrograms = useMemo(() => {
        if (!client?.performanceLog || !programs) return [];
        const logsByProgramName = client.performanceLog.reduce((acc, log) => {
            if (!acc[log.programName]) acc[log.programName] = [];
            acc[log.programName].push(log);
            return acc;
        }, {} as Record<string, PerformanceLog[]>);
        return Object.entries(logsByProgramName).map(([programName, logs]) => {
            const program = programs.find(p => p.name === programName);
            return program ? { program, logs } : null;
        }).filter((p): p is { program: WorkoutProgram; logs: PerformanceLog[] } => p !== null)
          .sort((a, b) => new Date(b.logs[b.logs.length - 1].date.split('/').reverse().join('-')).getTime() - new Date(a.logs[a.logs.length - 1].date.split('/').reverse().join('-')).getTime());
    }, [client?.performanceLog, programs]);

    const availableMeasurementsForSelect = useMemo(() => {
        if (!client?.nutrition.historyLog) return [];
        const available = new Set<keyof Measurement>();
        client.nutrition.historyLog.forEach(log => {
            if (log.measurements) {
                (Object.keys(log.measurements) as Array<keyof Measurement>).forEach(key => {
                    if (log.measurements![key] !== undefined && log.measurements![key] !== null) {
                        available.add(key);
                    }
                });
            }
        });
        return Array.from(available);
    }, [client]);
    
    const macroHistoryForChart = useMemo(() => {
        if (!client?.nutrition.historyLog) return [];
        return [...client.nutrition.historyLog]
            .reverse()
            .map(log => ({
                date: log.date,
                ...log.macros,
            }));
    }, [client]);
    
    const measurementHistoryForChart = useMemo(() => {
        if (!client?.nutrition.historyLog) return [];
        return [...client.nutrition.historyLog]
            .filter(log => log.measurements)
            .reverse()
            .map(log => ({
                date: log.date,
                ...log.measurements,
            }));
    }, [client]);
    
    const handleToggleMeasurement = (key: keyof Measurement) => {
        setSelectedMeasurements(prev => 
            prev.includes(key) 
            ? prev.filter(m => m !== key)
            : [...prev, key]
        );
    };


    if (!id || !client) return <Navigate to="/app/clients" replace />;

    const openProgramModal = (program: WorkoutProgram) => { setSelectedProgram(program); setIsProgramModalOpen(true); };
    const closeProgramModal = () => { setSelectedProgram(null); setIsProgramModalOpen(false); };
    const openHistoryModal = (data: { program: WorkoutProgram; logs: PerformanceLog[] }) => { setSelectedHistoricalProgram(data); setIsHistoryModalOpen(true); };
    const closeHistoryModal = () => { setSelectedHistoricalProgram(null); setIsHistoryModalOpen(false); };
    const macrosHaveChanged = JSON.stringify(editableMacros) !== JSON.stringify(initialMacros);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                    <img src={client.avatar || `https://i.pravatar.cc/80?u=${client.id}`} alt={`${client.firstName} ${client.lastName}`} className="w-20 h-20 rounded-full" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{client.firstName} {client.lastName}</h1>
                        <p className="text-gray-500">{client.objective}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate(`/app/messagerie?clientId=${client.id}`)}><EnvelopeIcon className="w-5 h-5 mr-2"/> Messagerie</Button>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Accordion title="Informations générales">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InfoItem label="Âge" value={client.age} />
                            <InfoItem label="Sexe" value={client.sex} />
                            <InfoItem label="Taille" value={client.height ? `${client.height} cm` : 'N/A'} />
                            <InfoItem label="Poids" value={client.weight ? `${client.weight} kg` : 'N/A'} />
                            <InfoItem label="Dépense énergétique" value={client.energyExpenditureLevel} />
                            <InfoItem label="Date d'inscription" value={client.registrationDate} />
                            <InfoItem label="Email" value={client.email} />
                            <InfoItem label="Téléphone" value={client.phone} />
                            <InfoItem label="Adresse" value={client.address} />
                        </div>
                    </Accordion>
                    
                    <Accordion title="Notes et Médical">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Notes du coach</h3>
                                <div className="mb-4">
                                    <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ajouter une nouvelle note..." className="w-full p-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" rows={3} />
                                    <Button onClick={handleAddNote} size="sm" className="mt-2" disabled={!newNote.trim()}>Ajouter la note</Button>
                                </div>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border rounded-lg p-2 bg-gray-50">
                                    {parsedNotes.length > 0 ? parsedNotes.map(note => (
                                        <div key={note.id} className="bg-white p-3 rounded-md text-sm border">
                                            <p className="font-semibold text-gray-600 border-b pb-1 mb-1">{note.date}</p>
                                            <p className="whitespace-pre-wrap text-gray-800">{note.content}</p>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 text-center py-4">Aucune note pour ce client.</p>}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Informations Médicales</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">Antécédents</label>
                                        <textarea id="medicalHistory" value={editableData.medicalInfo.history} onChange={(e) => handleMedicalChange('history', e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-lg shadow-sm" rows={5} />
                                    </div>
                                    <div>
                                        <label htmlFor="medicalAllergies" className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                                        <textarea id="medicalAllergies" value={editableData.medicalInfo.allergies} onChange={(e) => handleMedicalChange('allergies', e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-lg shadow-sm" rows={3} />
                                    </div>
                                </div>
                        </div>
                        <div className="mt-6 flex justify-end"><Button onClick={handleSaveInfoChanges} disabled={!hasInfoChanges}>Enregistrer les modifications</Button></div>
                    </Accordion>
                    
                    <Accordion title="Entraînements assignés">
                        <div className="space-y-3">
                            {(client.assignedPrograms && client.assignedPrograms.length > 0) ? client.assignedPrograms.map(program => (
                                <Card key={program.id} className="p-4 flex justify-between items-center !shadow-none border">
                                    <div>
                                        <p className="font-semibold text-gray-800">{program.name}</p>
                                        <p className="text-sm text-gray-500">{program.sessionsByWeek['1']?.length || 0} séances · {program.weekCount} semaines</p>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => openProgramModal(program)}>Consulter</Button>
                                </Card>
                            )) : <p className="text-gray-500 text-center py-4">Aucun programme assigné.</p>}
                        </div>
                    </Accordion>

                    <Accordion title="Historique des performances">
                        <div className="space-y-3">
                            {historicalPrograms.length > 0 ? historicalPrograms.map(({ program, logs }) => (
                                <Card key={program.id} className="p-4 flex justify-between items-center !shadow-none border">
                                    <div>
                                        <p className="font-semibold text-gray-800">{program.name}</p>
                                        <p className="text-sm text-gray-500">{logs.length} séance(s) enregistrée(s)</p>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => openHistoryModal({ program, logs })}>Consulter l'historique</Button>
                                </Card>
                            )) : <p className="text-gray-500 text-center py-4">Aucun historique d'entraînement.</p>}
                        </div>
                    </Accordion>
                    
                    <Accordion title="Alimentation">
                        <Accordion title="Historique des macros et mensuration">
                            {(client.nutrition.historyLog && client.nutrition.historyLog.length > 0) ? (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="p-2 font-semibold">Date</th>
                                                <th className="p-2 font-semibold">Poids</th>
                                                <th className="p-2 font-semibold">Calories</th>
                                                <th className="p-2 font-semibold">Macros (P/G/L)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {client.nutrition.historyLog.map((log, index) => {
                                                const pKcal = log.macros.protein * 4;
                                                const cKcal = log.macros.carbs * 4;
                                                const fKcal = log.macros.fat * 9;

                                                return (
                                                    <tr key={index}>
                                                        <td className="p-2 text-gray-900">{log.date}</td>
                                                        <td className="p-2 text-gray-900">{log.weight !== null ? `${log.weight} kg` : '-'}</td>
                                                        <td className="p-2 text-gray-900">{log.calories} kcal</td>
                                                        <td className="p-2">
                                                            <div className="flex flex-col gap-1 text-xs">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-semibold text-red-600">P: {log.macros.protein}g ({pKcal} kcal)</span>
                                                                    <span className="bg-red-100 text-red-800 font-medium px-2 py-0.5 rounded-full">
                                                                        {log.calories > 0 ? ((pKcal / log.calories) * 100).toFixed(0) : 0}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-semibold text-green-600">G: {log.macros.carbs}g ({cKcal} kcal)</span>
                                                                    <span className="bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full">
                                                                        {log.calories > 0 ? ((cKcal / log.calories) * 100).toFixed(0) : 0}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-semibold text-yellow-500">L: {log.macros.fat}g ({fKcal} kcal)</span>
                                                                    <span className="bg-yellow-100 text-yellow-800 font-medium px-2 py-0.5 rounded-full">
                                                                        {log.calories > 0 ? ((fKcal / log.calories) * 100).toFixed(0) : 0}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p className="text-gray-500 text-center py-4">Aucun historique nutritionnel enregistré.</p>}
                        </Accordion>
                        <Accordion title="Journal alimentaire">
                            <p className="text-center text-gray-500">Le journal alimentaire sera bientôt disponible ici.</p>
                        </Accordion>
                        <Accordion title="Plan Alimentaire">
                            {(client.assignedNutritionPlans && client.assignedNutritionPlans.length > 0) ? (
                                client.assignedNutritionPlans.map(plan => (
                                    <Card key={plan.id} className="p-4 flex justify-between items-center !shadow-none border mb-2">
                                        <div>
                                            <p className="font-semibold text-gray-800">{plan.name}</p>
                                            <p className="text-sm text-gray-500">{plan.objective}</p>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => setSelectedNutritionPlan(plan)}>
                                            Consulter
                                        </Button>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">Aucun plan alimentaire assigné.</p>
                            )}
                        </Accordion>
                    </Accordion>
                </div>

                <div className="space-y-6">
                    {baseMetabolicData && (
                        <Card className="p-4">
                            <h3 className="font-bold text-lg mb-4 text-center">Données Physiologiques Calculées</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 text-center">
                                <InfoItem label="Métabolisme (BMR)" value={`${baseMetabolicData.bmr} kcal`} />
                                <InfoItem label="Maintien (TDEE)" value={`${tdee} kcal`} />
                            </div>
                        </Card>
                    )}
                    
                    {editableCalculatedData && (
                        <Card className="p-4">
                            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                                <h3 className="font-bold text-lg">Macros Cibles</h3>
                                {editableCalculatedData.surplusDeficit !== 0 && (
                                    <span className={`font-bold text-sm px-2 py-0.5 rounded-md ${editableCalculatedData.surplusDeficit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {editableCalculatedData.surplusDeficit > 0 ? '+' : ''}{editableCalculatedData.surplusDeficit} kcal ({editableCalculatedData.surplusDeficitPercent.toFixed(1)}%)
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-start items-center gap-4 sm:gap-6">
                                <div className="relative w-32 h-32 flex-shrink-0">
                                    <div className="w-full h-full rounded-full" style={gradientStyle} role="img" aria-label="Répartition des macronutriments"></div>
                                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center flex-col text-center">
                                        <span className="text-xs text-gray-500">Objectif</span>
                                        <span className="font-bold text-lg leading-tight">{editableCalculatedData.objectifCalorique}</span>
                                        <span className="text-sm text-gray-600">kcal</span>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm w-full max-w-sm">
                                    {(['protein', 'carbs', 'fat'] as const).map(macro => {
                                        const delta = editableMacros[macro] - (initialMacros[macro] || 0);
                                        return (
                                            <div key={macro} className="grid grid-cols-12 items-center gap-2">
                                                <div className="col-span-4 flex items-center gap-2">
                                                    <span className={`w-3 h-3 rounded-full ${macro === 'protein' ? 'bg-[#ef4444]' : macro === 'carbs' ? 'bg-[#10b981]' : 'bg-[#facc15]'} flex-shrink-0`}></span>
                                                    <label className="font-semibold text-gray-800 capitalize">{macro === 'protein' ? 'Protéines' : macro}</label>
                                                </div>
                                                <div className="col-span-2 text-left">{Math.abs(delta) > 0 && <span className={`font-bold text-sm ${delta > 0 ? 'text-green-500' : 'text-red-500'}`}>{`${delta > 0 ? '+' : ''}${delta.toFixed(0)}g`}</span>}</div>
                                                <div className="col-span-6 flex items-center justify-end">
                                                    <button onClick={() => handleMacroAdjustment(macro, -1)} className="p-1 rounded-l-md bg-gray-200 hover:bg-gray-300 h-9"><MinusIcon className="w-4 h-4" /></button>
                                                    <div className="relative w-20"><Input type="number" value={editableMacros[macro]} onChange={e => handleMacroChange(macro, e.target.value)} className="w-full text-center !p-1 h-9 !rounded-none" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-xs">g</span></div>
                                                    <button onClick={() => handleMacroAdjustment(macro, 1)} className="p-1 rounded-r-md bg-gray-200 hover:bg-gray-300 h-9"><PlusIcon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end"><Button onClick={handleSaveMacros} disabled={!macrosHaveChanged}>{macrosHaveChanged ? 'Valider' : 'Macros à jour'}</Button></div>
                        </Card>
                    )}
                    <Card className="p-4"><h3 className="font-bold text-lg mb-2">Suivi des Calories / Macros</h3><MacroStackedBarChart data={macroHistoryForChart} /></Card>
                    <Card className="p-4"><h3 className="font-bold text-lg mb-2">Suivi du Poids</h3><SimpleLineChart data={client.nutrition.weightHistory} color="#7A68FA" unit="kg" /></Card>
                    <Card className="p-4">
                        <h3 className="font-bold text-lg mb-4">Suivi des Mensurations</h3>
                        <MeasurementsLineChart data={measurementHistoryForChart} selectedMeasurements={selectedMeasurements} />
                         <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {availableMeasurementsForSelect.map(key => (
                                <label key={String(key)} className="flex items-center space-x-2 cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedMeasurements.includes(key)}
                                        onChange={() => handleToggleMeasurement(key)}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span>{measurementLabels[key]}</span>
                                </label>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {selectedProgram && <Modal isOpen={isProgramModalOpen} onClose={closeProgramModal} title={`Détail du programme: ${selectedProgram.name}`} size="xl"><ProgramDetailView program={selectedProgram} /></Modal>}
            {selectedHistoricalProgram && <Modal isOpen={isHistoryModalOpen} onClose={closeHistoryModal} title={`Historique pour : ${selectedHistoricalProgram.program.name}`} size="xl"><ProgramPerformanceDetail program={selectedHistoricalProgram.program} performanceLogs={selectedHistoricalProgram.logs} /></Modal>}
            {selectedNutritionPlan && (
                <Modal isOpen={!!selectedNutritionPlan} onClose={() => setSelectedNutritionPlan(null)} title={`Plan alimentaire: ${selectedNutritionPlan.name}`} size="xl">
                    <CoachNutritionPlanView plan={selectedNutritionPlan} />
                </Modal>
            )}
        </div>
    );
};

export default ClientProfile;
