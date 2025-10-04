
import React, { useState, useMemo, useEffect } from 'react';
import { Exercise } from '../../types';
import Modal from '../Modal';
import Button from '../Button';
import InteractiveBodyDiagram from './InteractiveBodyDiagram';
import { useAuth } from '../../context/AuthContext';

const FilterChip: React.FC<{ label: string, selected: boolean, onClick: () => void }> = ({ label, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-sm rounded-full border transition-all ${selected ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-client-dark text-gray-700 dark:text-client-light border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
        {label}
    </button>
);

interface ClientExerciseFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    allExercises: Exercise[];
    activeFilters: { equipments: string[]; muscleGroups: string[] };
    onApplyFilters: (filters: { equipments: string[]; muscleGroups: string[] }) => void;
}

const ClientExerciseFilterModal: React.FC<ClientExerciseFilterModalProps> = ({ isOpen, onClose, allExercises, activeFilters, onApplyFilters }) => {
    const { theme } = useAuth();
    const [localFilters, setLocalFilters] = useState(activeFilters);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(activeFilters);
        }
    }, [isOpen, activeFilters]);

    const equipmentTypes = useMemo(() => Array.from(new Set(allExercises.map(e => e.equipment).filter(Boolean))), [allExercises]) as string[];
    const muscleGroups = useMemo(() => Array.from(new Set(allExercises.flatMap(e => e.muscleGroups).filter(Boolean))), [allExercises]) as string[];
    
    const toggleSelection = (item: string, type: 'equipments' | 'muscleGroups') => {
        setLocalFilters(prev => ({
            ...prev,
            [type]: prev[type].includes(item)
                ? prev[type].filter(i => i !== item)
                : [...prev[type], item],
        }));
    };
    
    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({ equipments: [], muscleGroups: [] });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Filtres" theme={theme}>
            <div className="space-y-6">
                <InteractiveBodyDiagram 
                    selectedGroups={localFilters.muscleGroups}
                    onToggleGroup={(group) => toggleSelection(group, 'muscleGroups')}
                />
                
                {equipmentTypes.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2 text-gray-800 dark:text-client-light">Équipement</h3>
                        <div className="flex flex-wrap gap-2">
                            {equipmentTypes.map(type => (
                                <FilterChip 
                                    key={type}
                                    label={type}
                                    selected={localFilters.equipments.includes(type)}
                                    onClick={() => toggleSelection(type, 'equipments')}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {muscleGroups.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2 text-gray-800 dark:text-client-light">Groupes musculaires</h3>
                        <div className="flex flex-wrap gap-2">
                            {muscleGroups.map(group => (
                                <FilterChip 
                                    key={group}
                                    label={group}
                                    selected={localFilters.muscleGroups.includes(group)}
                                    onClick={() => toggleSelection(group, 'muscleGroups')}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-client-card">
                    <Button variant="secondary" onClick={handleReset}>Réinitialiser</Button>
                    <Button onClick={handleApply}>Appliquer</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ClientExerciseFilterModal;
