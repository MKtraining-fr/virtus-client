import React from 'react';
import Modal from './Modal';
import IntensityTechniqueConfigurator from './IntensityTechniqueConfigurator';
import type { IntensityTechnique } from '../types/intensityTechnique';
import type { IntensityConfig } from '../types/intensityConfig';

interface IntensityTechniqueConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  technique: IntensityTechnique;
  config: IntensityConfig | null;
  onChange: (config: IntensityConfig) => void;
}

const IntensityTechniqueConfigModal: React.FC<IntensityTechniqueConfigModalProps> = ({
  isOpen,
  onClose,
  technique,
  config,
  onChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configuration : ${technique.name}`}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {technique.description}
        </p>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <IntensityTechniqueConfigurator
            technique={technique}
            config={config}
            onChange={onChange}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            Valider
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default IntensityTechniqueConfigModal;
