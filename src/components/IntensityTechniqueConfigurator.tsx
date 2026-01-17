import React, { useState, useEffect } from 'react';
import type { IntensityTechnique } from '../types/intensityTechnique';
import type {
  DropSetConfig,
  RestPauseConfig,
  MyoRepsConfig,
  ClusterSetConfig,
  TempoConfig,
  IntensityConfig,
} from '../types/intensityConfig';
import {
  DEFAULT_DROP_SET_CONFIG,
  DEFAULT_REST_PAUSE_CONFIG,
  DEFAULT_MYO_REPS_CONFIG,
  DEFAULT_CLUSTER_SET_CONFIG,
  DEFAULT_TEMPO_CONFIG,
} from '../types/intensityConfig';
import type { TemplateType } from '../types/intensityTemplates';
import TemplateConfigEditor from './TemplateConfigEditor';
import Button from './Button';
import Input from './Input';
import Select from './Select';

interface IntensityTechniqueConfiguratorProps {
  technique: IntensityTechnique;
  config: IntensityConfig | null;
  onChange: (config: IntensityConfig) => void;
  disabled?: boolean;
}

const IntensityTechniqueConfigurator: React.FC<IntensityTechniqueConfiguratorProps> = ({
  technique,
  config,
  onChange,
  disabled = false,
}) => {
  const [localConfig, setLocalConfig] = useState<IntensityConfig | null>(config);
  const [isInitialized, setIsInitialized] = useState(false);

  // Synchroniser localConfig avec config quand il change de l'extérieur
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Initialiser avec la config par défaut UNIQUEMENT au premier render
  useEffect(() => {
    if (!isInitialized && !config && technique.config_schema) {
      // Vérifier si c'est un template personnalisé
      if (technique.config_schema.template) {
        // Pour les templates, initialiser avec un objet vide
        const defaultConfig = {} as IntensityConfig;
        setLocalConfig(defaultConfig);
        onChange(defaultConfig);
        setIsInitialized(true);
        return;
      }

      const schemaType = technique.config_schema.type;
      let defaultConfig: IntensityConfig;

      switch (schemaType) {
        case 'drop_set':
          defaultConfig = DEFAULT_DROP_SET_CONFIG;
          break;
        case 'rest_pause':
          defaultConfig = DEFAULT_REST_PAUSE_CONFIG;
          break;
        case 'myo_reps':
          defaultConfig = DEFAULT_MYO_REPS_CONFIG;
          break;
        case 'cluster_set':
          defaultConfig = DEFAULT_CLUSTER_SET_CONFIG;
          break;
        case 'tempo':
          defaultConfig = DEFAULT_TEMPO_CONFIG;
          break;
        default:
          setIsInitialized(true);
          return;
      }

      setLocalConfig(defaultConfig);
      onChange(defaultConfig);
      setIsInitialized(true);
    }
  }, [isInitialized, config, technique, onChange]);

  if (!technique.config_schema || !localConfig) {
    return null;
  }

  // Gérer les templates personnalisés
  if (technique.config_schema.template) {
    return (
      <TemplateConfigEditor
        templateId={technique.config_schema.template as TemplateType}
        config={localConfig}
        onChange={(newConfig) => {
          setLocalConfig(newConfig);
          onChange(newConfig);
        }}
      />
    );
  }

  const schemaType = technique.config_schema.type;

  const handleApplyToChange = (value: 'all' | 'last' | 'specific') => {
    const updated = { ...localConfig, applyTo: value } as IntensityConfig;
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleSpecificSetsChange = (value: string) => {
    const sets = value
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    const updated = { ...localConfig, specificSets: sets } as IntensityConfig;
    setLocalConfig(updated);
    onChange(updated);
  };

  // Render Drop Set Configuration
  const renderDropSetConfig = (cfg: DropSetConfig) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Appliquer à
        </label>
        <Select
          value={cfg.applyTo}
          onChange={(e) => handleApplyToChange(e.target.value as 'all' | 'last' | 'specific')}
          disabled={disabled}
        >
          <option value="all">Toutes les séries</option>
          <option value="last">Dernière série uniquement</option>
          <option value="specific">Séries spécifiques</option>
        </Select>
      </div>

      {cfg.applyTo === 'specific' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Numéros de séries (ex: 3, 4)
          </label>
          <Input
            type="text"
            value={cfg.specificSets?.join(', ') || ''}
            onChange={(e) => handleSpecificSetsChange(e.target.value)}
            placeholder="Ex: 3, 4"
            disabled={disabled}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Paliers de dégressif
        </label>
        {cfg.dropLevels.map((level, index) => (
          <div key={index} className="space-y-2 mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <Select
                  value={level.type}
                  onChange={(e) => {
                    const updated = { ...cfg };
                    updated.dropLevels[index].type = e.target.value as 'percentage' | 'weight';
                    setLocalConfig(updated);
                    onChange(updated);
                  }}
                  disabled={disabled}
                >
                  <option value="percentage">Pourcentage</option>
                  <option value="weight">Charge précise</option>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {level.type === 'percentage' ? 'Réduction (%)' : 'Charge (kg)'}
                </label>
                <Input
                  type="number"
                  value={level.value}
                  onChange={(e) => {
                    const updated = { ...cfg };
                    updated.dropLevels[index].value = parseFloat(e.target.value);
                    setLocalConfig(updated);
                    onChange(updated);
                  }}
                  placeholder={level.type === 'percentage' ? 'Ex: 20' : 'Ex: 60'}
                  disabled={disabled}
                  min={1}
                />
              </div>
              {cfg.dropLevels.length > 1 && (
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      const updated = { ...cfg };
                      updated.dropLevels.splice(index, 1);
                      setLocalConfig(updated);
                      onChange(updated);
                    }}
                    variant="outline"
                    disabled={disabled}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Répétitions cibles (optionnel)</label>
              <Input
                type="text"
                value={level.targetReps || ''}
                onChange={(e) => {
                  const updated = { ...cfg };
                  updated.dropLevels[index].targetReps = e.target.value;
                  setLocalConfig(updated);
                  onChange(updated);
                }}
                placeholder="Ex: 8-10 ou jusqu'au maximum"
                disabled={disabled}
              />
            </div>
          </div>
        ))}
        {cfg.dropLevels.length < 5 && (
          <Button
            onClick={() => {
              const updated = { ...cfg };
              updated.dropLevels.push({ type: 'percentage', value: 20, targetReps: '8-10' });
              setLocalConfig(updated);
              onChange(updated);
            }}
            variant="outline"
            disabled={disabled}
            className="w-full mt-2"
          >
            + Ajouter un palier
          </Button>
        )}
      </div>
    </div>
  );

  // Render Rest-Pause Configuration
  const renderRestPauseConfig = (cfg: RestPauseConfig) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Appliquer à
        </label>
        <Select
          value={cfg.applyTo}
          onChange={(e) => handleApplyToChange(e.target.value as 'all' | 'last' | 'specific')}
          disabled={disabled}
        >
          <option value="all">Toutes les séries</option>
          <option value="last">Dernière série uniquement</option>
          <option value="specific">Séries spécifiques</option>
        </Select>
      </div>

      {cfg.applyTo === 'specific' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Numéros de séries
          </label>
          <Input
            type="text"
            value={cfg.specificSets?.join(', ') || ''}
            onChange={(e) => handleSpecificSetsChange(e.target.value)}
            placeholder="Ex: 3, 4"
            disabled={disabled}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Durée de la pause (secondes)
        </label>
        <Input
          type="number"
          value={cfg.pauseDuration}
          onChange={(e) => {
            const updated = { ...cfg, pauseDuration: parseInt(e.target.value) };
            setLocalConfig(updated);
            onChange(updated);
          }}
          disabled={disabled}
          min={5}
          max={30}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre de mini-séries
        </label>
        <Input
          type="number"
          value={cfg.miniSets}
          onChange={(e) => {
            const updated = { ...cfg, miniSets: parseInt(e.target.value) };
            setLocalConfig(updated);
            onChange(updated);
          }}
          disabled={disabled}
          min={1}
          max={5}
        />
      </div>
    </div>
  );

  // Render Myo-Reps Configuration
  const renderMyoRepsConfig = (cfg: MyoRepsConfig) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Appliquer à
        </label>
        <Select
          value={cfg.applyTo}
          onChange={(e) => handleApplyToChange(e.target.value as 'all' | 'last' | 'specific')}
          disabled={disabled}
        >
          <option value="all">Toutes les séries</option>
          <option value="last">Dernière série uniquement</option>
          <option value="specific">Séries spécifiques</option>
        </Select>
      </div>

      {cfg.applyTo === 'specific' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Numéros de séries
          </label>
          <Input
            type="text"
            value={cfg.specificSets?.join(', ') || ''}
            onChange={(e) => handleSpecificSetsChange(e.target.value)}
            placeholder="Ex: 3, 4"
            disabled={disabled}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Répétitions série d'activation
        </label>
        <Input
          type="text"
          value={cfg.activationSet.targetReps}
          onChange={(e) => {
            const updated = { ...cfg };
            updated.activationSet.targetReps = e.target.value;
            setLocalConfig(updated);
            onChange(updated);
          }}
          placeholder="Ex: 12-15"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre de mini-séries
        </label>
        <Input
          type="number"
          value={cfg.miniSets}
          onChange={(e) => {
            const updated = { ...cfg, miniSets: parseInt(e.target.value) };
            setLocalConfig(updated);
            onChange(updated);
          }}
          disabled={disabled}
          min={2}
          max={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Repos entre mini-séries (secondes)
        </label>
        <Input
          type="number"
          value={cfg.restBetween}
          onChange={(e) => {
            const updated = { ...cfg, restBetween: parseInt(e.target.value) };
            setLocalConfig(updated);
            onChange(updated);
          }}
          disabled={disabled}
          min={3}
          max={10}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Répétitions par mini-série
        </label>
        <Input
          type="text"
          value={cfg.targetRepsPerMini}
          onChange={(e) => {
            const updated = { ...cfg, targetRepsPerMini: e.target.value };
            setLocalConfig(updated);
            onChange(updated);
          }}
          placeholder="Ex: 3-5"
          disabled={disabled}
        />
      </div>
    </div>
  );

  // Render Cluster Sets Configuration
  const renderClusterSetConfig = (cfg: ClusterSetConfig) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Appliquer à
        </label>
        <Select
          value={cfg.applyTo}
          onChange={(e) => handleApplyToChange(e.target.value as 'all' | 'last' | 'specific')}
          disabled={disabled}
        >
          <option value="all">Toutes les séries</option>
          <option value="last">Dernière série uniquement</option>
          <option value="specific">Séries spécifiques</option>
        </Select>
      </div>

      {cfg.applyTo === 'specific' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Numéros de séries
          </label>
          <Input
            type="text"
            value={cfg.specificSets?.join(', ') || ''}
            onChange={(e) => handleSpecificSetsChange(e.target.value)}
            placeholder="Ex: 3, 4"
            disabled={disabled}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre de clusters par série
        </label>
        <Input
          type="number"
          value={cfg.clusters}
          onChange={(e) => {
            const updated = { ...cfg, clusters: parseInt(e.target.value) };
            setLocalConfig(updated);
            onChange(updated);
          }}
          disabled={disabled}
          min={2}
          max={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Répétitions par cluster
        </label>
        <Input
          type="text"
          value={cfg.repsPerCluster}
          onChange={(e) => {
            const updated = { ...cfg, repsPerCluster: e.target.value };
            setLocalConfig(updated);
            onChange(updated);
          }}
          placeholder="Ex: 2-3"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Repos entre clusters (secondes)
        </label>
        <Input
          type="number"
          value={cfg.restBetweenClusters}
          onChange={(e) => {
            const updated = { ...cfg, restBetweenClusters: parseInt(e.target.value) };
            setLocalConfig(updated);
            onChange(updated);
          }}
          disabled={disabled}
          min={5}
          max={30}
        />
      </div>
    </div>
  );

  // Render Tempo Configuration
  const renderTempoConfig = (cfg: TempoConfig) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Appliquer à
        </label>
        <Select
          value={cfg.applyTo}
          onChange={(e) => handleApplyToChange(e.target.value as 'all' | 'last' | 'specific')}
          disabled={disabled}
        >
          <option value="all">Toutes les séries</option>
          <option value="last">Dernière série uniquement</option>
          <option value="specific">Séries spécifiques</option>
        </Select>
      </div>

      {cfg.applyTo === 'specific' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Numéros de séries
          </label>
          <Input
            type="text"
            value={cfg.specificSets?.join(', ') || ''}
            onChange={(e) => handleSpecificSetsChange(e.target.value)}
            placeholder="Ex: 3, 4"
            disabled={disabled}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phase excentrique (s)
          </label>
          <Input
            type="number"
            value={cfg.eccentric}
            onChange={(e) => {
              const updated = { ...cfg, eccentric: parseInt(e.target.value) };
              setLocalConfig(updated);
              onChange(updated);
            }}
            disabled={disabled}
            min={1}
            max={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pause en bas (s)
          </label>
          <Input
            type="number"
            value={cfg.pause1}
            onChange={(e) => {
              const updated = { ...cfg, pause1: parseInt(e.target.value) };
              setLocalConfig(updated);
              onChange(updated);
            }}
            disabled={disabled}
            min={0}
            max={5}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phase concentrique (s)
          </label>
          <Input
            type="number"
            value={cfg.concentric}
            onChange={(e) => {
              const updated = { ...cfg, concentric: parseInt(e.target.value) };
              setLocalConfig(updated);
              onChange(updated);
            }}
            disabled={disabled}
            min={1}
            max={5}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pause en haut (s)
          </label>
          <Input
            type="number"
            value={cfg.pause2}
            onChange={(e) => {
              const updated = { ...cfg, pause2: parseInt(e.target.value) };
              setLocalConfig(updated);
              onChange(updated);
            }}
            disabled={disabled}
            min={0}
            max={5}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Configuration de la technique
      </h4>
      {schemaType === 'drop_set' && renderDropSetConfig(localConfig as DropSetConfig)}
      {schemaType === 'rest_pause' && renderRestPauseConfig(localConfig as RestPauseConfig)}
      {schemaType === 'myo_reps' && renderMyoRepsConfig(localConfig as MyoRepsConfig)}
      {schemaType === 'cluster_set' && renderClusterSetConfig(localConfig as ClusterSetConfig)}
      {schemaType === 'tempo' && renderTempoConfig(localConfig as TempoConfig)}
    </div>
  );
};

export default IntensityTechniqueConfigurator;
