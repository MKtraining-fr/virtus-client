import React, { useState, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BilanTemplate, BilanSection, BilanField, BilanFieldType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Input from '../Input';
import Button from '../Button';
import Card from '../Card';
import Select from '../Select';
import { TrashIcon, PlusIcon, DuplicateIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface BilanTemplateBuilderProps {
    initialTemplate?: BilanTemplate;
    onSaveSuccess: () => void;
    onCancel: () => void;
}

const defaultField: BilanField = {
    id: uuidv4(),
    label: 'Nouvelle Question',
    type: 'text',
    placeholder: '',
};

const defaultSection: BilanSection = {
    id: uuidv4(),
    title: 'Nouvelle Section',
    isRemovable: true,
    fields: [defaultField],
};

const fieldTypes: { value: BilanFieldType, label: string }[] = [
    { value: 'text', label: 'Texte court' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'number', label: 'Nombre' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'checkbox', label: 'Cases à cocher' },
    { value: 'radio_yes_no', label: 'Oui/Non' },
    { value: 'scale', label: 'Échelle (1-10)' },
];

const BilanTemplateBuilder: React.FC<BilanTemplateBuilderProps> = ({ initialTemplate, onSaveSuccess, onCancel }) => {
    const { addBilanTemplate, updateBilanTemplate, user } = useAuth();
    const [template, setTemplate] = useState<BilanTemplate>(initialTemplate || {
        id: uuidv4(),
        name: 'Nouveau Template',
        coachId: user?.id || 'system',
        sections: [defaultSection],
    });
    const [isSaving, setIsSaving] = useState(false);

    const isSystemTemplate = template.coachId === 'system';

    // Liste des champs pour la logique conditionnelle
    const allFields = useMemo(() => template.sections.flatMap(s => s.fields), [template.sections]);
    const fieldOptions = allFields.map(f => ({ value: f.id, label: `${f.label} (${f.id})` }));

    // --- Gestion des Sections ---
    const addSection = useCallback(() => {
        setTemplate(prev => ({
            ...prev,
            sections: [...prev.sections, { ...defaultSection, id: uuidv4() }],
        }));
    }, []);

    const removeSection = useCallback((sectionId: string) => {
        setTemplate(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== sectionId),
        }));
    }, []);

    const updateSectionTitle = useCallback((sectionId: string, title: string) => {
        setTemplate(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, title } : s),
        }));
    }, []);

    const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
        setTemplate(prev => {
            const index = prev.sections.findIndex(s => s.id === sectionId);
            if (index === -1) return prev;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prev.sections.length) return prev;

            const newSections = [...prev.sections];
            [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
            return { ...prev, sections: newSections };
        });
    }, []);

    // --- Gestion des Champs ---
    const addField = useCallback((sectionId: string) => {
        setTemplate(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, fields: [...s.fields, { ...defaultField, id: uuidv4() }] } : s),
        }));
    }, []);

    const removeField = useCallback((sectionId: string, fieldId: string) => {
        setTemplate(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s),
        }));
    }, []);

    const updateField = useCallback((sectionId: string, fieldId: string, updates: Partial<BilanField>) => {
        setTemplate(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, fields: s.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) } : s),
        }));
    }, []);
    
    // --- Sauvegarde ---
    const handleSave = async () => {
        if (isSystemTemplate) {
            alert("Impossible de modifier le template système. Veuillez le dupliquer pour créer votre propre version.");
            return;
        }
        
        if (!template.name.trim()) {
            alert("Le nom du template est requis.");
            return;
        }
        
        if (template.sections.length === 0 || template.sections.some(s => s.fields.length === 0)) {
            alert("Le template doit contenir au moins une section avec au moins un champ.");
            return;
        }

        setIsSaving(true);
        try {
            if (initialTemplate) {
                // Mise à jour
                await updateBilanTemplate(template.id, {
                    name: template.name,
                    sections: template.sections,
                });
            } else {
                // Création
                await addBilanTemplate({
                    name: template.name,
                    coachId: user?.id || 'system', // Assurer que le coachId est bien celui du coach
                    sections: template.sections,
                });
            }
            onSaveSuccess();
        } catch (error) {
            alert(`Erreur lors de la sauvegarde du template : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Rendu des champs ---
    const renderField = (sectionId: string, field: BilanField) => (
        <Card key={field.id} className="p-4 border-l-4 border-primary-500 space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-700">Champ: {field.label}</h4>
                <div className="flex space-x-1">
                    <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => removeField(sectionId, field.id)}
                        icon={<TrashIcon className="w-4 h-4" />}
                        disabled={isSystemTemplate}
                    />
                </div>
            </div>
            
            <Input 
                label="Libellé du champ"
                value={field.label}
                onChange={e => updateField(sectionId, field.id, { label: e.target.value })}
                disabled={isSystemTemplate}
            />
            
            <Select
                label="Type de champ"
                value={field.type}
                onChange={e => updateField(sectionId, field.id, { type: e.target.value as BilanFieldType, options: undefined, conditionalOn: undefined, conditionalValue: undefined })}
                disabled={isSystemTemplate}
            >
                {fieldTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </Select>

            {(field.type === 'select' || field.type === 'checkbox') && (
                <Input
                    label="Options (séparées par des virgules)"
                    value={field.options?.join(', ') || ''}
                    onChange={e => updateField(sectionId, field.id, { options: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                    placeholder="Option 1, Option 2, Option 3"
                    disabled={isSystemTemplate}
                />
            )}
            
            <Input 
                label="Placeholder (Texte d'aide)"
                value={field.placeholder || ''}
                onChange={e => updateField(sectionId, field.id, { placeholder: e.target.value })}
                disabled={isSystemTemplate}
            />
            
            <div className="border-t pt-3 mt-3 space-y-3">
                <h5 className="text-sm font-semibold text-gray-700">Logique Conditionnelle (Optionnel)</h5>
                
                <Select
                    label="Afficher si le champ..."
                    value={field.conditionalOn || ''}
                    onChange={e => updateField(sectionId, field.id, { conditionalOn: e.target.value || undefined, conditionalValue: undefined })}
                    disabled={isSystemTemplate}
                >
                    <option value="">-- Aucun --</option>
                    {fieldOptions.filter(opt => opt.value !== field.id).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </Select>
                
                {field.conditionalOn && (
                    <Input
                        label={`...a la valeur (ex: Oui, ou une option de liste)`}
                        value={field.conditionalValue || ''}
                        onChange={e => updateField(sectionId, field.id, { conditionalValue: e.target.value || undefined })}
                        disabled={isSystemTemplate}
                    />
                )}
            </div>
        </Card>
    );

    // --- Rendu des sections ---
    const renderSection = (section: BilanSection, index: number) => (
        <Card key={section.id} className="p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-start border-b pb-3">
                <Input
                    label="Titre de la Section"
                    value={section.title}
                    onChange={e => updateSectionTitle(section.id, e.target.value)}
                    className="text-xl font-bold"
                    disabled={isSystemTemplate}
                />
                <div className="flex space-x-2 ml-4">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => moveSection(section.id, 'up')}
                        icon={<ArrowUpIcon className="w-4 h-4" />}
                        disabled={isSystemTemplate || index === 0}
                    />
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => moveSection(section.id, 'down')}
                        icon={<ArrowDownIcon className="w-4 h-4" />}
                        disabled={isSystemTemplate || index === template.sections.length - 1}
                    />
                    {section.isRemovable && (
                        <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => removeSection(section.id)}
                            icon={<TrashIcon className="w-4 h-4" />}
                            disabled={isSystemTemplate}
                        />
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {section.fields.map(field => renderField(section.id, field))}
            </div>

            <Button 
                variant="secondary" 
                onClick={() => addField(section.id)}
                icon={<PlusIcon className="w-5 h-5" />}
                disabled={isSystemTemplate}
            >
                Ajouter un champ
            </Button>
        </Card>
    );

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                    {initialTemplate ? `Modifier le Template: ${initialTemplate.name}` : "Créer un Nouveau Template de Bilan"}
                </h2>
                
                {isSystemTemplate && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                        <p className="font-bold">Template Système</p>
                        <p>Ce template est un modèle système et ne peut pas être modifié. Veuillez le dupliquer pour créer votre propre version.</p>
                    </div>
                )}

                <Input
                    label="Nom du Template"
                    value={template.name}
                    onChange={e => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="text-3xl font-extrabold mb-4"
                    disabled={isSystemTemplate}
                />
            </Card>

            <div className="space-y-8">
                {template.sections.map((section, index) => renderSection(section, index))}
            </div>

            <div className="flex justify-between items-center">
                <Button 
                    variant="secondary" 
                    onClick={addSection}
                    icon={<PlusIcon className="w-5 h-5" />}
                    disabled={isSystemTemplate}
                >
                    Ajouter une Section
                </Button>

                <div className="flex space-x-4">
                    <Button variant="secondary" onClick={onCancel}>
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || isSystemTemplate}
                        isLoading={isSaving}
                    >
                        {initialTemplate ? "Sauvegarder les modifications" : "Créer le Template"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BilanTemplateBuilder;
