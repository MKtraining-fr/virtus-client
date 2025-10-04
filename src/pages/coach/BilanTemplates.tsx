import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BilanTemplate, BilanSection, BilanField, BilanFieldType, Client, BilanResult } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /> </svg> );
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> </svg> );
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /> </svg> );

const BilanTemplates: React.FC = () => {
    const { user, bilanTemplates, setBilanTemplates, clients, addNotification, setClients } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editModalStep, setEditModalStep] = useState<'select' | 'edit'>('select');
    const [currentTemplate, setCurrentTemplate] = useState<Partial<BilanTemplate> | null>(null);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [templateToAssign, setTemplateToAssign] = useState<BilanTemplate | null>(null);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [assignmentFrequency, setAssignmentFrequency] = useState<'once' | 'weekly' | 'biweekly' | 'monthly'>('once');
    const [clientSearchTerm, setClientSearchTerm] = useState('');

    const coachTemplates = useMemo(() => 
        bilanTemplates.filter(t => t.coachId === 'system' || t.coachId === user?.id),
    [bilanTemplates, user]);
    
    const [templateToCopy, setTemplateToCopy] = useState<string>(coachTemplates[0]?.id || '');
    const addMenuRef = useRef<HTMLDivElement>(null);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    const myClients = useMemo(() => {
        return clients.filter(c => c.role === 'client' && c.status === 'active' && c.coachId === user?.id);
    }, [clients, user]);

    const filteredClientsForModal = useMemo(() => {
        if (!clientSearchTerm) return myClients;
        const lowercasedFilter = clientSearchTerm.toLowerCase();
        return myClients.filter(c => 
            c.firstName.toLowerCase().includes(lowercasedFilter) ||
            c.lastName.toLowerCase().includes(lowercasedFilter)
        );
    }, [myClients, clientSearchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openEditModal = (template: BilanTemplate) => {
        const templateCopy = JSON.parse(JSON.stringify(template));
        if (template.coachId === 'system') {
            handleDuplicate(template.id, `Copie de ${template.name}`);
        } else {
            if (templateCopy.sections.length > 1) {
                const allFields = templateCopy.sections.flatMap((s: BilanSection) => s.fields);
                templateCopy.sections = [{
                    id: templateCopy.sections[0].id,
                    title: 'Questions',
                    isRemovable: false,
                    fields: allFields
                }];
            }
            setCurrentTemplate(templateCopy);
            setEditModalStep('edit');
            setIsEditModalOpen(true);
        }
    };

    const openCreateModal = () => {
        setEditModalStep('select');
        setCurrentTemplate(null);
        setIsEditModalOpen(true);
    };

    const handleCreateBlank = () => {
        setCurrentTemplate({
            name: 'Nouveau modèle',
            coachId: user?.id,
            sections: [{
                id: `sec-${Date.now()}`,
                title: 'Questions',
                isRemovable: false,
                fields: []
            }]
        });
        setEditModalStep('edit');
    };

    const handleDuplicate = (idToCopy?: string, newName?: string) => {
        const finalIdToCopy = idToCopy || templateToCopy;
        const template = bilanTemplates.find(t => t.id === finalIdToCopy);
        if (template) {
            const duplicatedTemplate = JSON.parse(JSON.stringify(template));
            const allFields = duplicatedTemplate.sections.flatMap((s: BilanSection) => s.fields);

            delete duplicatedTemplate.id;
            duplicatedTemplate.name = newName || `Copie de ${template.name}`;
            duplicatedTemplate.coachId = user?.id;
            duplicatedTemplate.sections = [{
                id: `sec-merged-${Date.now()}`,
                title: 'Questions',
                isRemovable: false,
                fields: allFields
            }];
            setCurrentTemplate(duplicatedTemplate);
            setEditModalStep('edit');
            if (!isEditModalOpen) setIsEditModalOpen(true);
        }
    };

    const handleSave = () => {
        if (!currentTemplate || !currentTemplate.name) {
            alert("Le nom du modèle est obligatoire.");
            return;
        }

        if (currentTemplate.id) { // Edit
            setBilanTemplates(bilanTemplates.map(t => t.id === currentTemplate!.id ? currentTemplate as BilanTemplate : t));
        } else { // Add
            const newTemplate: BilanTemplate = {
                ...currentTemplate,
                id: `template-${Date.now()}`,
            } as BilanTemplate;
            setBilanTemplates([...bilanTemplates, newTemplate]);
        }
        setIsEditModalOpen(false);
    };
    
    const handleDelete = (templateId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
            setBilanTemplates(bilanTemplates.filter(t => t.id !== templateId));
        }
    };
    
    // --- Assign Modal Handlers ---
    const handleOpenAssignModal = (template: BilanTemplate) => {
        setTemplateToAssign(template);
        setSelectedClientIds([]);
        setAssignmentFrequency('once');
        setClientSearchTerm('');
        setIsAssignModalOpen(true);
    };
    
    const handleAssign = () => {
        if (!templateToAssign || selectedClientIds.length === 0 || !user) return;
        
        const newBilan: BilanResult = {
            id: `bilan-${Date.now()}`,
            templateId: templateToAssign.id,
            templateName: templateToAssign.name,
            status: 'pending',
            assignedAt: new Date().toISOString(),
        };

        const updatedClients = clients.map(client => {
            if (selectedClientIds.includes(client.id)) {
                const updatedBilans = [...(client.bilans || []), newBilan];
                return { ...client, bilans: updatedBilans };
            }
            return client;
        });
        setClients(updatedClients);

        selectedClientIds.forEach(clientId => {
            addNotification({
                userId: clientId,
                fromName: `${user.firstName} ${user.lastName}`,
                type: 'assignment',
                message: `vous a assigné un nouveau bilan à remplir : ${templateToAssign.name}.`,
                link: '/app/profile'
            });
        });
        
        alert(`Bilan "${templateToAssign.name}" assigné à ${selectedClientIds.length} client(s).`);
        setIsAssignModalOpen(false);
    };

    // --- Modal form handlers ---
    const addField = (sectionId: string) => {
        const newField: BilanField = { id: `fld-${Date.now()}`, label: 'Nouvelle question', type: 'text' };
        setCurrentTemplate(prev => prev ? {
            ...prev,
            sections: prev.sections?.map(s => s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s)
        } : null);
    };
    
    const updateField = (sectionId: string, fieldId: string, updatedField: BilanField) => {
        setCurrentTemplate(prev => prev ? {
            ...prev,
            sections: prev.sections?.map(s => s.id === sectionId ? {
                ...s,
                fields: s.fields.map(f => f.id === fieldId ? updatedField : f)
            } : s)
        } : null);
    };

    const removeField = (sectionId: string, fieldId: string) => {
        setCurrentTemplate(prev => prev ? {
            ...prev,
            sections: prev.sections?.map(s => s.id === sectionId ? {
                ...s,
                fields: s.fields.filter(f => f.id !== fieldId)
            } : s)
        } : null);
    };

    const modalTitle = currentTemplate?.id ? 'Modifier le modèle' : 'Créer un modèle';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Modèles de Bilan</h1>
                <Button onClick={openCreateModal}>Créer un modèle</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coachTemplates.map(template => (
                    <Card key={template.id} className="flex flex-col">
                        <div className="p-6 flex-grow">
                            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{template.sections.reduce((acc, s) => acc + s.fields.length, 0)} question(s)</p>
                        </div>
                        <div className="bg-gray-50 p-4 flex justify-end space-x-2">
                            {template.coachId !== 'system' ? (
                                <>
                                <Button size="sm" onClick={() => handleOpenAssignModal(template)}>Assigner</Button>
                                <Button variant="secondary" size="sm" onClick={() => openEditModal(template)}>Modifier</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(template.id)}>Supprimer</Button>
                                </>
                            ) : (
                                <Button variant="secondary" size="sm" onClick={() => openEditModal(template)}>Dupliquer & Modifier</Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={modalTitle} size="xl">
                {editModalStep === 'select' ? (
                    <div className="text-center space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Comment voulez-vous commencer ?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                                <h3 className="text-xl font-semibold mb-4">Partir de zéro</h3>
                                <p className="text-gray-600 mb-6">Créez un questionnaire entièrement personnalisé à partir d'une feuille blanche.</p>
                                <Button onClick={handleCreateBlank}>Créer un modèle vierge</Button>
                            </div>
                            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                                <h3 className="text-xl font-semibold mb-4">Dupliquer un modèle</h3>
                                <p className="text-gray-600 mb-4">Gagnez du temps en partant d'un modèle existant que vous pourrez ensuite modifier.</p>
                                <div className="space-y-4">
                                    <Select value={templateToCopy} onChange={e => setTemplateToCopy(e.target.value)}>
                                        {coachTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </Select>
                                    <Button onClick={() => handleDuplicate()} disabled={!templateToCopy}>Dupliquer et modifier</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : currentTemplate && (
                    <>
                    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                        <Input label="Nom du modèle" value={currentTemplate.name || ''} onChange={(e) => setCurrentTemplate(p => p ? {...p, name: e.target.value} : null)} />
                        <hr className="my-4"/>
                        
                         {currentTemplate.sections && currentTemplate.sections.length > 0 && (() => {
                            const mainSection = currentTemplate.sections![0];
                            return (
                                <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Questions</h3>
                                    {mainSection.fields.map(field => (
                                        <div key={field.id} className="p-3 border bg-white rounded-md grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-4"><Input label="Question" value={field.label} onChange={e => updateField(mainSection.id, field.id, {...field, label: e.target.value})} /></div>
                                            <div className="col-span-3">
                                                <Select label="Type" value={field.type} onChange={e => updateField(mainSection.id, field.id, {...field, type: e.target.value as BilanFieldType})}>
                                                    <option value="text">Réponse courte</option>
                                                    <option value="textarea">Réponse longue</option>
                                                    <option value="number">Nombre</option>
                                                    <option value="select">Liste déroulante</option>
                                                    <option value="checkbox">Sélection multiple</option>
                                                    <option value="radio_yes_no">Oui/Non</option>
                                                    <option value="scale">Échelle (1-10)</option>
                                                </Select>
                                            </div>
                                            <div className="col-span-4">
                                                {(field.type === 'select' || field.type === 'checkbox') ? (
                                                    <Input label="Options (séparées par des virgules)" value={field.options?.join(',') || ''} onChange={e => updateField(mainSection.id, field.id, {...field, options: e.target.value.split(',').map(s => s.trim())})} />
                                                ) : (field.type === 'text' || field.type === 'textarea' || field.type === 'number') ? (
                                                    <Input label="Texte d'aide (optionnel)" value={field.placeholder || ''} onChange={e => updateField(mainSection.id, field.id, {...field, placeholder: e.target.value})} />
                                                ) : null}
                                            </div>
                                            <div className="col-span-1"><Button variant="secondary" size="sm" className="!p-2" onClick={() => removeField(mainSection.id, field.id)}><TrashIcon className="w-4 h-4" /></Button></div>
                                        </div>
                                    ))}
                                    <Button size="sm" variant="secondary" onClick={() => addField(mainSection.id)}><PlusIcon className="w-4 h-4 mr-1"/> Ajouter une question</Button>
                                </div>
                            );
                        })()}
                    </div>
                     <div className="flex justify-end pt-6 space-x-2 border-t mt-4">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave}>Enregistrer</Button>
                    </div>
                    </>
                )}
            </Modal>

            {isAssignModalOpen && templateToAssign && (
                <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assigner "${templateToAssign.name}"`}>
                    <div className="space-y-4">
                        <Input 
                            type="text"
                            placeholder="Rechercher un client..."
                            value={clientSearchTerm}
                            onChange={e => setClientSearchTerm(e.target.value)}
                        />
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            {filteredClientsForModal.length > 0 ? (
                                filteredClientsForModal.map(client => (
                                    <label key={client.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                                            checked={selectedClientIds.includes(client.id)}
                                            onChange={() => setSelectedClientIds(prev => prev.includes(client.id) ? prev.filter(id => id !== client.id) : [...prev, client.id])}
                                        />
                                        <span className="ml-3 text-sm font-medium">{client.firstName} {client.lastName}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 p-4">Aucun client trouvé.</p>
                            )}
                        </div>
                        <Select label="Fréquence d'envoi" value={assignmentFrequency} onChange={e => setAssignmentFrequency(e.target.value as any)}>
                            <option value="once">Envoi unique</option>
                            <option value="weekly">Toutes les semaines</option>
                            <option value="biweekly">Toutes les deux semaines</option>
                            <option value="monthly">Tous les mois</option>
                        </Select>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Annuler</Button>
                            <Button onClick={handleAssign} disabled={selectedClientIds.length === 0}>Assigner</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BilanTemplates;