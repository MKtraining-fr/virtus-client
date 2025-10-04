import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Accordion from '../components/Accordion';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../src/context/AuthContext';
import { Client, BilanField, BilanResult } from '../types';

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

    const handleAnswerChange = (fieldId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = async (status: 'active' | 'prospect') => {
        if (!answers.firstName || !answers.lastName || !answers.email) {
            alert('Prénom, nom et email sont requis.');
            return;
        }

        const bilanResult: BilanResult = {
            id: `bilan-${Date.now()}`,
            templateId: selectedTemplateId,
            templateName: selectedTemplate?.name || 'Bilan Initial',
            status: 'completed',
            assignedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            answers: answers
        };

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
            bilans: [bilanResult],
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

                    {selectedTemplate?.sections.map(section => (
                        <Accordion key={section.id} title={section.title} isOpenDefault={true}>
                            <div className={`grid grid-cols-1 ${section.isCivility ? 'md:grid-cols-2' : ''} gap-4`}>
                                {section.fields.map(field => (
                                    <DynamicField 
                                        key={field.id}
                                        field={field}
                                        value={answers[field.id]}
                                        onChange={(value) => handleAnswerChange(field.id, value)}
                                    />
                                ))}
                            </div>
                        </Accordion>
                    ))}
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