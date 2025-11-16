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
        className={`px-3 py-1 text-sm rounded-full border transition-all ${selected ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'}`}
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
        <Card className="p-4 max-h-screen flex flex-col">
            <h2 className="text-xl font-bold mb-4">Filtres</h2>
            <Input 
                placeholder="Rechercher un mouvement" 
                className="mb-4"
                aria-label="Rechercher un mouvement"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            
            {equipmentTypes.length > 0 && <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-700">Types d'équipement :</h3>
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

            {muscleGroups.length > 0 && <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-700">Groupes musculaires :</h3>
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
            
            <hr className="my-4" />
            
            <h3 className="font-semibold mb-2 text-gray-700">Résultats ({filteredResults.length})</h3>
            <div className="space-y-3 overflow-y-auto flex-grow pr-2">
                {filteredResults.map(ex => (
                    <div 
                        key={ex.id} 
                        className="cursor-grab group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
                        draggable
                        onDragStart={(e) => handleDragStart(e, ex)}
                    >
                        <img 
                          src={ex.illustrationUrl || DEFAULT_ILLUSTRATION} 
                          alt={ex.name} 
                          className="w-16 h-16 object-contain rounded-md bg-white border border-gray-200 flex-shrink-0"
                        />
                        <p className="font-semibold text-gray-800 group-hover:text-primary flex-grow">{ex.name}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default ExerciseFilterSidebar;
