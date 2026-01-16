import React from 'react';
import { getTemplate, type TemplateType, type TemplateConfig } from '../types/intensityTemplates';

interface TemplateConfigEditorProps {
  templateId: TemplateType;
  config: TemplateConfig;
  onChange: (config: TemplateConfig) => void;
}

/**
 * Composant pour éditer la configuration d'une technique selon son template
 * Utilisé dans le WorkoutBuilder par le coach
 */
const TemplateConfigEditor: React.FC<TemplateConfigEditorProps> = ({
  templateId,
  config,
  onChange,
}) => {
  const template = getTemplate(templateId);

  // Template 'simple' n'a pas de configuration
  if (templateId === 'simple' || template.fields.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Cette technique n'a pas de configuration supplémentaire.
      </div>
    );
  }

  const handleFieldChange = (fieldKey: string, value: any) => {
    onChange({
      ...config,
      [fieldKey]: value,
    } as TemplateConfig);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        {template.description}
      </div>

      {template.fields.map((field) => {
        const currentValue = config ? (config as any)[field.key] : '';

        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.unit && <span className="text-gray-500 ml-1">({field.unit})</span>}
            </label>

            {field.type === 'number' && (
              <input
                type="number"
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                min={field.min}
                max={field.max}
                step={field.step}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              />
            )}

            {field.type === 'text' && (
              <input
                type="text"
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              />
            )}

            {field.type === 'select' && field.options && (
              <select
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="">Sélectionner...</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* Aide contextuelle */}
            {field.min !== undefined && field.max !== undefined && (
              <div className="text-xs text-gray-500 mt-1">
                Valeur entre {field.min} et {field.max}
                {field.unit && ` ${field.unit}`}
              </div>
            )}
          </div>
        );
      })}

      {/* Aperçu de la configuration */}
      {config && Object.keys(config).length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Configuration :
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {template.fields.map((field) => {
              const value = (config as any)[field.key];
              if (value === undefined || value === null || value === '') return null;
              return (
                <div key={field.key}>
                  <span className="font-medium">{field.label}:</span> {value}
                  {field.unit && ` ${field.unit}`}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateConfigEditor;
