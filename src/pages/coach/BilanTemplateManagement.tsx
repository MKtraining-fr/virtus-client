import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BilanTemplate } from '../../types';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import BilanTemplateBuilder from '../../components/coach/BilanTemplateBuilder';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'list' | 'create' | 'edit';

const BilanTemplateManagement: React.FC = () => {
  const { bilanTemplates, user, deleteBilanTemplate, addBilanTemplate } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<BilanTemplate | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const coachTemplates = useMemo(
    () =>
      bilanTemplates
        .filter((t) => t.coachId === 'system' || t.coachId === user?.id)
        .sort((a, b) => {
          if (a.coachId === 'system' && b.coachId !== 'system') return -1;
          if (a.coachId !== 'system' && b.coachId === 'system') return 1;
          return a.name.localeCompare(b.name);
        }),
    [bilanTemplates, user]
  );

  const handleSaveSuccess = useCallback(() => {
    setViewMode('list');
    setSelectedTemplate(undefined);
  }, []);

  const handleEdit = useCallback((template: BilanTemplate) => {
    setSelectedTemplate(template);
    setViewMode('edit');
  }, []);

  const handleDelete = useCallback(
    async (templateId: string) => {
      if (
        window.confirm(
          'Êtes-vous sûr de vouloir supprimer ce template ? Cette action est irréversible.'
        )
      ) {
        setIsDeleting(templateId);
        try {
          await deleteBilanTemplate(templateId);
        } catch (error) {
          alert(
            `Erreur lors de la suppression : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
          );
        } finally {
          setIsDeleting(null);
        }
      }
    },
    [deleteBilanTemplate]
  );

  const handleDuplicate = useCallback(
    async (template: BilanTemplate) => {
      if (!user?.id) {
        alert('Vous devez être connecté pour dupliquer un template.');
        return;
      }

      if (window.confirm(`Voulez-vous dupliquer le template "${template.name}" ?`)) {
        try {
          const newTemplate: Omit<BilanTemplate, 'id'> = {
            name: `${template.name} (Copie)`,
            coachId: user.id,
            sections: template.sections,
          };
          await addBilanTemplate(newTemplate);
          alert('Template dupliqué avec succès !');
        } catch (error) {
          alert(
            `Erreur lors de la duplication : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
          );
        }
      }
    },
    [user, addBilanTemplate]
  );

  const renderTemplateList = () => (
    <div className="space-y-4">
      {coachTemplates.map((template) => (
        <Card key={template.id} className="p-4 flex justify-between items-center shadow-md">
          <div>
            <h3 className="text-lg font-semibold">{template.name}</h3>
            <p
              className={`text-sm ${template.coachId === 'system' ? 'text-blue-600' : 'text-gray-500'}`}
            >
              {template.coachId === 'system' ? 'Template Système' : 'Mon Template'}
            </p>
            <p className="text-xs text-gray-400">
              {template.sections.length} sections,{' '}
              {template.sections.reduce((acc, s) => acc + s.fields.length, 0)} champs
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDuplicate(template)}
              icon={<DocumentDuplicateIcon className="w-4 h-4" />}
            >
              Dupliquer
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleEdit(template)}
              icon={<PencilIcon className="w-4 h-4" />}
              disabled={template.coachId === 'system'}
            >
              Modifier
            </Button>
            {template.coachId !== 'system' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(template.id)}
                icon={<TrashIcon className="w-4 h-4" />}
                isLoading={isDeleting === template.id}
              >
                Supprimer
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestion des Templates de Bilans</h1>

      <Button
        variant="primary"
        onClick={() => setViewMode('create')}
        icon={<PlusIcon className="w-5 h-5" />}
      >
        Créer un Nouveau Template
      </Button>

      {viewMode === 'list' && renderTemplateList()}

      {/* Modal pour la création/modification */}
      <Modal
        isOpen={viewMode === 'create' || viewMode === 'edit'}
        onClose={() => setViewMode('list')}
        title={
          viewMode === 'create' ? 'Créer un Nouveau Template' : `Modifier ${selectedTemplate?.name}`
        }
        size="xl"
      >
        <BilanTemplateBuilder
          initialTemplate={selectedTemplate}
          onSaveSuccess={handleSaveSuccess}
          onCancel={() => setViewMode('list')}
        />
      </Modal>
    </div>
  );
};

export default BilanTemplateManagement;
