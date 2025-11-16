import React, { useState, useMemo } from 'react';
import Input from './Input.tsx';
import { Exercise } from '../types.ts';

interface InlineExerciseSearchProps {
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

const InlineExerciseSearch: React.FC<InlineExerciseSearchProps> = ({ db }) => {
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

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedEquipments([]);
        setSelectedMuscleGroups([]);
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Rechercher un exercice</h3>
                    {(searchTerm || selectedEquipments.length > 0 || selectedMuscleGroups.length > 0) && (
                        <button 
                            onClick={handleClearFilters}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>
                <Input
                    placeholder="Rechercher un mouvement"
                    className="w-full"
                    aria-label="Rechercher un mouvement"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Section des filtres */}
            <div className="mt-4 space-y-3">
                {equipmentTypes.length > 0 && <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Types d'équipement</h4>
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
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Groupes musculaires</h4>
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

            {/* Section des résultats */}
            <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">Résultats ({filteredResults.length})</h4>
                    <span className="text-xs text-gray-500">Glissez-déposez un exercice ci-dessous</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {filteredResults.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Aucun exercice trouvé</p>
                    ) : (
                        filteredResults.map(ex => (
                            <div
                                key={ex.id}
                                className="cursor-grab group flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                draggable
                                onDragStart={(e) => handleDragStart(e, ex)}
                            >
                                <img
                                  src={ex.illustrationUrl || DEFAULT_ILLUSTRATION}
                                  alt={ex.name}
                                  className="w-14 h-14 object-contain rounded-lg bg-white border border-gray-200 flex-shrink-0"
                                />
                                <p className="font-semibold text-gray-800 group-hover:text-primary flex-grow text-sm">{ex.name}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default InlineExerciseSearch;
