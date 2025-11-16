import React, { useState, useMemo } from 'react';
import Card from './Card.tsx';
import Input from './Input.tsx';
import { Exercise } from '../types.ts';

interface ExerciseFilterSidebarProps {
  db: Exercise[];
}

const FilterChip = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
      selected
        ? 'bg-primary text-white border-primary shadow-sm'
        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

const ExerciseFilterSidebar: React.FC<ExerciseFilterSidebarProps> = ({ db }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
    
    const equipmentTypes = useMemo(() => Array.from(new Set(db.map(e => e.equipment).filter(Boolean))), [db]) as string[];
    const muscleGroups = useMemo(() => Array.from(new Set(db.flatMap(e => e.muscleGroups).filter(Boolean))), [db]) as string[];

    const toggleSelection = (item: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, exercise: Exercise) => {
        e.dataTransfer.setData('application/json', JSON.stringify(exercise));
    };

    const filteredResults = useMemo(() => {
        return db.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEquipment = selectedEquipments.length === 0 || (ex.equipment && selectedEquipments.includes(ex.equipment));
            const matchesMuscleGroups = selectedMuscleGroups.length === 0 || (ex.muscleGroups && selectedMuscleGroups.some(smg => ex.muscleGroups!.includes(smg)));
            
            return matchesSearch && matchesEquipment && matchesMuscleGroups;
        });
    }, [db, searchTerm, selectedEquipments, selectedMuscleGroups]);
    
    const DEFAULT_ILLUSTRATION = 'https://img.gymvisual.com/illustrations/1749/male-Bodyweight-Squat.png';

    return (
        <Card className="h-full flex flex-col p-4">
            <div className="space-y-3 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
                <Input
                    placeholder="Rechercher un mouvement"
                    className="w-full"
                    aria-label="Rechercher un mouvement"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="mt-4 flex flex-col flex-grow gap-4 overflow-hidden">
                <div className="flex flex-col flex-grow rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="text-center text-base font-semibold text-gray-800">Résultats ({filteredResults.length})</h3>
                    <div className="mt-3 space-y-3 overflow-y-auto flex-grow pr-2">
                        {filteredResults.map(ex => (
                            <div
                                key={ex.id}
                                className="cursor-grab group flex items-center gap-3 p-2 rounded-xl border border-gray-100 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                draggable
                                onDragStart={(e) => handleDragStart(e, ex)}
                            >
                                <img
                                  src={ex.illustrationUrl || DEFAULT_ILLUSTRATION}
                                  alt={ex.name}
                                  className="w-16 h-16 object-contain rounded-lg bg-white border border-gray-200 flex-shrink-0"
                                />
                                <p className="font-semibold text-gray-800 group-hover:text-primary flex-grow text-sm">{ex.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 pb-1">
                    {equipmentTypes.length > 0 && <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Types d'équipement</h3>
                        <div className="flex flex-wrap gap-2">
                            {equipmentTypes.map(type => (
                                <FilterChip
                                    key={type}
                                    label={type}
                                    selected={selectedEquipments.includes(type)}
                                    onClick={() => toggleSelection(type, selectedEquipments, setSelectedEquipments)}
                                />
                            ))}
                        </div>
                    </div>}

                    {muscleGroups.length > 0 && <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Groupes musculaires</h3>
                        <div className="flex flex-wrap gap-2">
                             {muscleGroups.map(part => (
                                <FilterChip
                                    key={part}
                                    label={part}
                                    selected={selectedMuscleGroups.includes(part)}
                                    onClick={() => toggleSelection(part, selectedMuscleGroups, setSelectedMuscleGroups)}
                                />
                            ))}
                        </div>
                    </div>}
                </div>
            </div>
        </Card>
    );
};

export default ExerciseFilterSidebar;
