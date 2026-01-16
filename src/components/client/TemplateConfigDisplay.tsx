import React from 'react';
import { getTemplate, type TemplateType, type TemplateConfig } from '../../types/intensityTemplates';

interface TemplateConfigDisplayProps {
  templateId: TemplateType;
  config: TemplateConfig;
}

/**
 * Composant pour afficher la configuration d'une technique selon son template
 * Utilisé côté client pour voir les paramètres définis par le coach
 */
const TemplateConfigDisplay: React.FC<TemplateConfigDisplayProps> = ({
  templateId,
  config,
}) => {
  const template = getTemplate(templateId);

  // Template 'simple' n'a pas de configuration
  if (templateId === 'simple' || template.fields.length === 0 || !config) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2">
        Paramètres de la technique :
      </div>
      <div className="space-y-1">
        {template.fields.map((field) => {
          const value = (config as any)[field.key];
          if (value === undefined || value === null || value === '') return null;

          return (
            <div key={field.key} className="flex items-center justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                {field.label}:
              </span>
              <span className="text-amber-900 dark:text-amber-100">
                {value}
                {field.unit && ` ${field.unit}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateConfigDisplay;
