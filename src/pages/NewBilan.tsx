import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Accordion from '../components/Accordion';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { Client, BilanField, BilanTemplate, BilanResult } from '../types';

const DynamicField: React.FC<{ field: BilanField; value: any; onChange: (value: any) => void; }> = ({ field, value, onChange }) => {
    const commonProps = {
        id: field.id,
        label: field.label,
        name: field.id,
        value: value || '',
        placeholder: field.placeholder || '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(e.target.value),
    };

    switch (field.type) {
        case 'textarea':
            return (
                <div>
                    <label htmlFor={commonProps.id} className="block text-sm font-medium text-gray-700 mb-1">{commonProps.label}</label>
                    <textarea {...commonProps} rows={4} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                </div>
            );
        case 'select':
            return (
                <Select {...commonProps}>
                    <option value="">-- Sélectionnez --</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </Select>
            );
        case 'checkbox':
             return (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    <div className="space-y-2">
                        {field.options?.map(opt => {
                            const isChecked = Array.isArray(value) && value.includes(opt);
                            const handleCheckboxChange = () => {
                                const currentValue = value || [];
                                const newValue = isChecked
                                    ? currentValue.filter((item: string) => item !== opt)
                                    : [...currentValue, opt];
                                onChange(newValue);
                            };
                            return (
                                <label key={opt} className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={handleCheckboxChange}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="ml-2 text-gray-700">{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            );
        case 'radio_yes_no':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    <div className="flex items-center gap-x-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name={field.id}
                                value="Oui"
                                checked={value === 'Oui'}
                                onChange={(e) => onChange(e.target.value)}
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="ml-2 text-gray-700">Oui</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name={field.id}
                                value="Non"
                                checked={value === 'Non'}
                                onChange={(e) => onChange(e.target.value)}
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="ml-2 text-gray-700">Non</span>
                        </label>
                    </div>
                </div>
            );
        case 'scale':
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <label key={num} className="flex flex-col items-center cursor-pointer p-2 rounded-md hover:bg-gray-100 w-12">
                                <span className="text-sm font-medium text-gray-600 mb-1">{num}</span>
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={num.toString()}
                                    checked={value === num.toString()}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="h-5 w-5 border-gray-300 text-primary focus:ring-primary"
                                />
                            </label>
                        ))}
                    </div>
                </div>
            );
        case 'number':
             return <Input {...commonProps} type="number" />;
        case 'date':
            return <Input {...commonProps} type="date" />;
        case 'text':
        default:
            return <Input {...commonProps} type="text" />;
    }
};

const NewBilan: React.FC = () => {
    const { user, addUser, bilanTemplates } = useAuth();
    const navigate = useNavigate();
    
    const coachTemplates = useMemo(() => 
        bilanTemplates.filter(t => t.coachId === 'system' || t.coachId === user?.id), 
    [bilanTemplates, user]);

    const [selectedTemplateId, setSelectedTemplateId] = useState(coachTemplates[0]?.id || '');
    
    const [answers, setAnswers] = useState<Record<string, any>>({
        firstName: 'John', lastName: 'Prospect', dob: '1990-05-15', sex: 'Homme', address: '10 Test Street', email: `prospect-${Date.now()}@test.com`, phone: '0123456789',
        height: '180', weight: '75', energyExpenditureLevel: 'Actif',
        fld_objectif: 'Test Objective', fld_profession: 'Tester',
        fld_allergies: 'Aucune', fld_aversions: 'Rien', fld_habits: 'Bonnes habitudes',
    });

    const selectedTemplate = useMemo(() => 
        coachTemplates.find(t => t.id === selectedTemplateId),
    [coachTemplates, selectedTemplateId]);
    
    const isInitialBilanSelected = selectedTemplate?.coachId === 'system';

    const handleAnswerChange = (fieldId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = async (status: 'active' | 'prospect') => {
        // Since Bilan Initial is the only one with civility fields, it's the only one that can create a user.
        if (isInitialBilanSelected) {
            if (!answers.firstName || !answers.lastName || !answers.email) {
                alert('Prénom, nom et email sont requis pour le bilan initial.');
                return;
            }
        } else {
             // For now, custom templates also create new users, but they must have the required fields.
             // This logic can be expanded later to handle existing clients.
             if (!answers.firstName || !answers.lastName || !answers.email) {
                alert('Ce modèle de bilan ne peut pas être utilisé pour créer un nouvel utilisateur car les champs Prénom, Nom et Email sont manquants.');
                return;
            }
        }
        
        const dataToSubmit: Partial<Client> = {
            firstName: answers.firstName,
            lastName: answers.lastName,
            dob: answers.dob,
            age: answers.dob ? Math.floor((new Date().getTime() - new Date(answers.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0,
            sex: answers.sex as Client['sex'],
            address: answers.address,
            email: answers.email,
            phone: answers.phone,
            height: answers.height ? Number(answers.height) : undefined,
            weight: answers.weight ? Number(answers.weight) : undefined,
            energyExpenditureLevel: answers.energyExpenditureLevel as Client['energyExpenditureLevel'],
            
            objective: answers['fld_objectif'] || '',
            lifestyle: { profession: answers['fld_profession'] || '' },
            medicalInfo: { history: '', allergies: answers['fld_allergies'] || '' },
            notes: '',
            nutrition: {
                measurements: {}, weightHistory: [], calorieHistory: [], 
                macros: { protein: 0, carbs: 0, fat: 0 },
                foodAversions: answers['fld_aversions'] || '',
                generalHabits: answers['fld_habits'] || '',
                historyLog: [],
            },
            bilans: [{
                id: `bilan-${Date.now()}`,
                templateId: selectedTemplateId,
                templateName: selectedTemplate?.name || 'Bilan Initial',
                status: 'completed',
                assignedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                answers: answers
            }],
        };

        try {
            await addUser({ ...dataToSubmit, role: 'client', status, coachId: user?.id });
            alert(status === 'active' ? 'Client validé avec succès !' : 'Prospect archivé avec succès !');
            navigate(status === 'active' ? '/app/clients' : '/app/bilan/archive');
        } catch (error: any) {
            alert(`Erreur : ${error.message}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Nouveau Bilan</h1>
            
            <Card className="p-8">
                <div>
                     <Select label="Modèle de questionnaire" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="mb-6">
                        {coachTemplates.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                    </Select>

                    {selectedTemplate?.sections.map(section => {
                        // Conditional rendering based on user request
                        if (section.isCivility && !isInitialBilanSelected) {
                            return null;
                        }
                        return (
                            <Accordion key={section.id} title={section.title} isOpenDefault={true}>
                                <div className={`grid grid-cols-1 ${section.isCivility ? 'md:grid-cols-2' : ''} gap-4`}>
                                    {section.fields.map(field => {
                                        // Gérer les champs conditionnels
                                        if (field.conditionalOn && field.conditionalValue) {
                                            const parentValue = answers[field.conditionalOn];
                                            const shouldShow = Array.isArray(parentValue) 
                                                ? parentValue.includes(field.conditionalValue)
                                                : parentValue === field.conditionalValue;
                                            
                                            if (!shouldShow) {
                                                return null;
                                            }
                                        }
                                        
                                        return (
                                            <DynamicField 
                                                key={field.id}
                                                field={field}
                                                value={answers[field.id]}
                                                onChange={(value) => handleAnswerChange(field.id, value)}
                                            />
                                        );
                                    })}
                                </div>
                            </Accordion>
                        );
                    })}
                </div>

                <div className="flex justify-end mt-8 space-x-2">
                     <Button variant="secondary" onClick={() => handleSubmit('prospect')}>
                        Archiver
                     </Button>
                     <Button onClick={() => handleSubmit('active')}>
                        Valider le Bilan
                     </Button>
                </div>
            </Card>
        </div>
    );
};

export default NewBilan;