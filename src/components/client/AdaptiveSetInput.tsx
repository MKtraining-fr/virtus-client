import React from 'react';
import type { IntensityConfig } from '../../types/intensityConfig';
import type { PerformanceSet } from '../../types';
import {
  isDropSetConfig,
  isRestPauseConfig,
  isMyoRepsConfig,
  isClusterSetConfig,
  isTempoConfig,
} from '../../types/intensityConfig';

interface AdaptiveSetInputProps {
  setIndex: number;
  exerciseId: number;
  config: IntensityConfig;
  logData: PerformanceSet | undefined;
  targetReps: string;
  targetLoad: string;
  placeholder?: { reps?: string; load?: string };
  isSelected: boolean;
  onLogChange: (exerciseId: number, setIndex: number, field: string, value: string) => void;
  onSetSelect: (setIndex: number) => void;
  onCommentClick: (exerciseId: number, setIndex: number) => void;
  hasComment: boolean;
  loadUnit: string;
}

const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);

const ChatBubbleLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
    />
  </svg>
);

const AdaptiveSetInput: React.FC<AdaptiveSetInputProps> = ({
  setIndex,
  exerciseId,
  config,
  logData,
  targetReps,
  targetLoad,
  placeholder,
  isSelected,
  onLogChange,
  onSetSelect,
  onCommentClick,
  hasComment,
  loadUnit,
}) => {
  // État pour expand/collapse du Drop Set
  const [isExpanded, setIsExpanded] = React.useState(false);
  const getProgressionColor = (value: string, previousValue?: string) => {
    if (!value || !previousValue) return 'border-gray-300';
    const current = parseFloat(value);
    const previous = parseFloat(previousValue);
    if (current > previous) return 'border-green-500';
    if (current < previous) return 'border-red-500';
    return 'border-gray-300';
  };

  // Render Drop Set Input
  if (isDropSetConfig(config)) {
    // La logique shouldApply est déjà gérée par ClientCurrentProgram.tsx
    // Ce composant n'est appelé que pour les séries où la technique s'applique
    
    return (
      <div className="space-y-2">
        {/* Badge DROP SET */}
        <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-lg">
          <span className="text-xs font-bold text-white tracking-wider">⚡ DROP SET
          </span>
          <span className="text-xs text-white/90">
            Dernière série
          </span>
        </div>
        
        {/* Série principale - Style identique aux séries standards */}
        <div
          className={`flex items-center p-2 rounded-b-lg cursor-pointer ${
            isSelected ? 'bg-primary' : ''
          }`}
          onClick={() => onSetSelect(setIndex)}
        >
          <p className={`flex-none w-1/4 text-center font-bold text-lg ${
            isSelected ? 'text-white' : 'text-gray-500 dark:text-client-subtle'
          }`}>
            S{setIndex + 1}
          </p>
          <div className="flex-1 px-1">
            <input
              type="number"
              placeholder={targetReps !== '0' ? targetReps : placeholder?.reps || '0'}
              value={logData?.reps || ''}
              onChange={(e) => onLogChange(exerciseId, setIndex, 'reps', e.target.value)}
              onFocus={() => onSetSelect(setIndex)}
              className={`w-full rounded-md text-center py-2 font-bold text-lg border-2 ${
                isSelected
                  ? 'bg-white/20 border-white/50 text-white placeholder:text-white/70'
                  : `bg-white dark:bg-client-card dark:text-client-light ${getProgressionColor(logData?.reps || '', placeholder?.reps)}`
              }`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex-1 px-1">
            <input
              type="number"
              placeholder={targetLoad !== '0' ? targetLoad : placeholder?.load || '0'}
              value={logData?.load || ''}
              onChange={(e) => onLogChange(exerciseId, setIndex, 'load', e.target.value)}
              onFocus={() => onSetSelect(setIndex)}
              className={`w-full rounded-md text-center py-2 font-bold text-lg border-2 ${
                isSelected
                  ? 'bg-white/20 border-white/50 text-white placeholder:text-white/70'
                  : `bg-white dark:bg-client-card dark:text-client-light ${getProgressionColor(logData?.load || '', placeholder?.load)}`
              }`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex-none w-10 text-center pl-1">
            {isSelected ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick(exerciseId, setIndex);
                }}
                className="p-1 rounded-full text-white/80 hover:bg-white/20"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            ) : (
              hasComment && <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500 dark:text-client-subtle mx-auto" />
            )}
          </div>
        </div>

        {/* Bouton expand/collapse */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary hover:text-primary/80 font-medium px-4 py-1"
          >
            {isExpanded ? '▲ Cacher' : '▼ Voir'} les paliers ({config.dropLevels.length})
          </button>
        </div>

        {/* Paliers Drop Set (affichés uniquement si expanded) - Style identique aux séries standards */}
        {isExpanded && (
          <div className="space-y-2 pl-4">
            {config.dropLevels.map((level: any, idx: number) => {
              const subSeriesData = logData?.sub_series_performance || [];
              const subData = subSeriesData[idx] || {};
              const calculatedLoad = logData?.load 
                ? level.type === 'percentage'
                  ? (parseFloat(logData.load) * (1 - level.value / 100)).toFixed(1)
                  : (parseFloat(logData.load) - level.value).toFixed(1)
                : '';

              return (
                <div
                  key={idx}
                  className="flex items-center p-2 rounded-lg bg-gray-50 dark:bg-client-dark/30"
                >
                  <p className="flex-none w-1/4 text-center font-medium text-sm text-gray-600 dark:text-client-subtle">
                    P{idx + 1}
                  </p>
                  <div className="flex-1 px-1">
                    <input
                      type="number"
                      placeholder={level.targetReps ? `${level.targetReps}` : '0'}
                      value={subData.reps || ''}
                      onChange={(e) => {
                        const newSubSeries = [...subSeriesData];
                        newSubSeries[idx] = { ...subData, reps: e.target.value };
                        onLogChange(exerciseId, setIndex, 'sub_series_performance', newSubSeries);
                      }}
                      className="w-full rounded-md text-center py-2 font-bold text-lg border-2 border-gray-300 bg-white dark:bg-client-card dark:text-client-light"
                    />
                  </div>
                  <div className="flex-1 px-1">
                    <input
                      type="number"
                      placeholder={calculatedLoad}
                      value={subData.load || ''}
                      onChange={(e) => {
                        const newSubSeries = [...subSeriesData];
                        newSubSeries[idx] = { ...subData, load: e.target.value };
                        onLogChange(exerciseId, setIndex, 'sub_series_performance', newSubSeries);
                      }}
                      className="w-full rounded-md text-center py-2 font-bold text-lg border-2 border-gray-300 bg-white dark:bg-client-card dark:text-client-light"
                    />
                  </div>
                  <div className="flex-none w-10 text-center pl-1">
                    <span className="text-xs text-gray-400">
                      {level.type === 'percentage' ? `-${level.value}%` : `-${level.value}${loadUnit || 'kg'}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render Rest-Pause Input
  if (isRestPauseConfig(config)) {
    // La logique shouldApply est déjà gérée par ClientCurrentProgram.tsx
    const [isRestPauseExpanded, setIsRestPauseExpanded] = React.useState(false);
    
    return (
      <div className="space-y-2">
        {/* Badge REST-PAUSE */}
        <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-lg">
          <span className="text-xs font-bold text-white tracking-wider">⚡ REST-PAUSE</span>
          <span className="text-xs text-white/90">
            Dernière série • {config.pauseDuration}s pause
          </span>
        </div>

        {/* Série principale */}
        <div
          className={`p-3 rounded-b-lg border-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-client-dark'}`}
          onClick={() => onSetSelect(setIndex)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm font-bold text-gray-700 dark:text-client-light">S{setIndex + 1}</span>
              <div className="flex gap-2 flex-1">
                <input
                  type="number"
                  placeholder={targetReps}
                  value={logData?.reps || ''}
                  onChange={(e) => onLogChange(exerciseId, setIndex, 'reps', e.target.value)}
                  className={`flex-1 rounded-md text-center py-2 font-bold text-lg border-2 ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-gray-900 dark:text-client-light'
                      : 'bg-white dark:bg-client-card dark:text-client-light border-gray-300 dark:border-client-dark'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="number"
                  placeholder={targetLoad}
                  value={logData?.load || ''}
                  onChange={(e) => onLogChange(exerciseId, setIndex, 'load', e.target.value)}
                  className={`flex-1 rounded-md text-center py-2 font-bold text-lg border-2 ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-gray-900 dark:text-client-light'
                      : 'bg-white dark:bg-client-card dark:text-client-light border-gray-300 dark:border-client-dark'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="flex items-center text-sm text-gray-600 dark:text-client-subtle">{loadUnit}</span>
              </div>
            </div>
            {isSelected ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick(exerciseId, setIndex);
                }}
                className="p-1 rounded-full text-primary hover:bg-primary/20 ml-2"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            ) : (
              hasComment && <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500 dark:text-client-subtle ml-2" />
            )}
          </div>

          {/* Bouton expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRestPauseExpanded(!isRestPauseExpanded);
            }}
            className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1"
          >
            {isRestPauseExpanded ? '▲' : '▼'} {isRestPauseExpanded ? 'Cacher' : 'Voir'} les mini-séries ({config.miniSets})
          </button>

          {/* Mini-séries */}
          {isRestPauseExpanded && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-blue-300 dark:border-blue-700">
              {Array.from({ length: config.miniSets }).map((_, miniIndex) => (
                <div key={miniIndex} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-client-subtle w-16">M{miniIndex + 1}</span>
                  <input
                    type="number"
                    placeholder="Reps"
                    value={(logData as any)?.[`mini_${miniIndex}_reps`] || ''}
                    onChange={(e) => onLogChange(exerciseId, setIndex, `mini_${miniIndex}_reps`, e.target.value)}
                    className="flex-1 rounded-md text-center py-2 text-sm border-2 border-gray-300 dark:border-client-dark bg-gray-50 dark:bg-client-card/50 dark:text-client-light"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-gray-500 dark:text-client-subtle whitespace-nowrap">après {config.pauseDuration}s</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Myo-Reps Input
  if (isMyoRepsConfig(config)) {
    // La logique shouldApply est déjà gérée par ClientCurrentProgram.tsx
    const [isMyoRepsExpanded, setIsMyoRepsExpanded] = React.useState(false);
    
    return (
      <div className="space-y-2">
        {/* Badge MYO-REPS */}
        <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-t-lg">
          <span className="text-xs font-bold text-white tracking-wider">⚡ MYO-REPS (À L'ÉCHEC)</span>
          <span className="text-xs text-white/90">
            Dernière série • {config.restBetween}s entre mini-séries
          </span>
        </div>

        {/* Série d'activation */}
        <div
          className={`p-3 rounded-b-lg border-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-client-dark'}`}
          onClick={() => onSetSelect(setIndex)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm font-bold text-gray-700 dark:text-client-light">S{setIndex + 1} (Activation)</span>
              <div className="flex gap-2 flex-1">
                <input
                  type="number"
                  placeholder={config.activationSet.targetReps}
                  value={logData?.reps || ''}
                  onChange={(e) => onLogChange(exerciseId, setIndex, 'reps', e.target.value)}
                  className={`flex-1 rounded-md text-center py-2 font-bold text-lg border-2 ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-gray-900 dark:text-client-light'
                      : 'bg-white dark:bg-client-card dark:text-client-light border-gray-300 dark:border-client-dark'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="number"
                  placeholder={targetLoad}
                  value={logData?.load || ''}
                  onChange={(e) => onLogChange(exerciseId, setIndex, 'load', e.target.value)}
                  className={`flex-1 rounded-md text-center py-2 font-bold text-lg border-2 ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-gray-900 dark:text-client-light'
                      : 'bg-white dark:bg-client-card dark:text-client-light border-gray-300 dark:border-client-dark'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="flex items-center text-sm text-gray-600 dark:text-client-subtle">{loadUnit}</span>
              </div>
            </div>
            {isSelected ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick(exerciseId, setIndex);
                }}
                className="p-1 rounded-full text-primary hover:bg-primary/20 ml-2"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            ) : (
              hasComment && <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500 dark:text-client-subtle ml-2" />
            )}
          </div>

          {/* Bouton expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMyoRepsExpanded(!isMyoRepsExpanded);
            }}
            className="w-full text-center text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 py-1"
          >
            {isMyoRepsExpanded ? '▲' : '▼'} {isMyoRepsExpanded ? 'Cacher' : 'Voir'} les mini-séries ({config.miniSets})
          </button>

          {/* Mini-séries */}
          {isMyoRepsExpanded && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-purple-300 dark:border-purple-700">
              {Array.from({ length: config.miniSets }).map((_, miniIndex) => (
                <div key={miniIndex} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-client-subtle w-16">M{miniIndex + 1}</span>
                  <input
                    type="number"
                    placeholder={config.targetRepsPerMini}
                    value={(logData as any)?.[`mini_${miniIndex}_reps`] || ''}
                    onChange={(e) => onLogChange(exerciseId, setIndex, `mini_${miniIndex}_reps`, e.target.value)}
                    className="flex-1 rounded-md text-center py-2 text-sm border-2 border-gray-300 dark:border-client-dark bg-gray-50 dark:bg-client-card/50 dark:text-client-light"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-gray-500 dark:text-client-subtle whitespace-nowrap">{config.restBetween}s repos</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Cluster Set Input
  if (isClusterSetConfig(config)) {
    // La logique shouldApply est déjà gérée par ClientCurrentProgram.tsx
    const [isClusterExpanded, setIsClusterExpanded] = React.useState(false);
    
    return (
      <div className="space-y-2">
        {/* Badge CLUSTER SET */}
        <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-green-500 to-teal-600 rounded-t-lg">
          <span className="text-xs font-bold text-white tracking-wider">⚡ CLUSTER SET</span>
          <span className="text-xs text-white/90">
            {config.clusters} clusters • {config.restBetweenClusters}s entre clusters
          </span>
        </div>

        {/* Série principale */}
        <div
          className={`p-3 rounded-b-lg border-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-client-dark'}`}
          onClick={() => onSetSelect(setIndex)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm font-bold text-gray-700 dark:text-client-light">S{setIndex + 1}</span>
              <div className="flex gap-2 flex-1">
                <input
                  type="number"
                  placeholder={targetReps}
                  value={logData?.reps || ''}
                  onChange={(e) => onLogChange(exerciseId, setIndex, 'reps', e.target.value)}
                  className={`flex-1 rounded-md text-center py-2 font-bold text-lg border-2 ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-gray-900 dark:text-client-light'
                      : 'bg-white dark:bg-client-card dark:text-client-light border-gray-300 dark:border-client-dark'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="number"
                  placeholder={targetLoad}
                  value={logData?.load || ''}
                  onChange={(e) => onLogChange(exerciseId, setIndex, 'load', e.target.value)}
                  className={`flex-1 rounded-md text-center py-2 font-bold text-lg border-2 ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-gray-900 dark:text-client-light'
                      : 'bg-white dark:bg-client-card dark:text-client-light border-gray-300 dark:border-client-dark'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="flex items-center text-sm text-gray-600 dark:text-client-subtle">{loadUnit}</span>
              </div>
            </div>
            {isSelected ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick(exerciseId, setIndex);
                }}
                className="p-1 rounded-full text-primary hover:bg-primary/20 ml-2"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            ) : (
              hasComment && <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500 dark:text-client-subtle ml-2" />
            )}
          </div>

          {/* Bouton expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsClusterExpanded(!isClusterExpanded);
            }}
            className="w-full text-center text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 py-1"
          >
            {isClusterExpanded ? '▲' : '▼'} {isClusterExpanded ? 'Cacher' : 'Voir'} les clusters ({config.clusters})
          </button>

          {/* Clusters */}
          {isClusterExpanded && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-green-300 dark:border-green-700">
              {Array.from({ length: config.clusters }).map((_, clusterIndex) => (
                <div key={clusterIndex} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-client-subtle w-16">C{clusterIndex + 1}</span>
                  <input
                    type="number"
                    placeholder={config.repsPerCluster}
                    value={(logData as any)?.[`cluster_${clusterIndex}_reps`] || ''}
                    onChange={(e) => onLogChange(exerciseId, setIndex, `cluster_${clusterIndex}_reps`, e.target.value)}
                    className="flex-1 rounded-md text-center py-2 text-sm border-2 border-gray-300 dark:border-client-dark bg-gray-50 dark:bg-client-card/50 dark:text-client-light"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-gray-500 dark:text-client-subtle whitespace-nowrap">{config.restBetweenClusters}s repos</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For other techniques (Tempo), render standard input for now
  return (
    <div
      key={setIndex}
      className={`flex items-center p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-primary' : ''}`}
      onClick={() => onSetSelect(setIndex)}
    >
      <p className={`flex-none w-1/4 text-center font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-500 dark:text-client-subtle'}`}>
        S{setIndex + 1}
      </p>
      <div className="flex-1 px-1">
        <input
          type="number"
          placeholder={targetReps !== '0' ? targetReps : placeholder?.reps || '0'}
          value={logData?.reps || ''}
          onChange={(e) => onLogChange(exerciseId, setIndex, 'reps', e.target.value)}
          onFocus={() => onSetSelect(setIndex)}
          className={`w-full rounded-md text-center py-2 font-bold text-lg border-2 ${
            isSelected
              ? 'bg-white/20 border-white/50 text-white placeholder:text-white/70'
              : `bg-white dark:bg-client-card dark:text-client-light ${getProgressionColor(logData?.reps || '', placeholder?.reps)}`
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex-1 px-1">
        <input
          type="number"
          placeholder={targetLoad !== '0' ? targetLoad : placeholder?.load || '0'}
          value={logData?.load || ''}
          onChange={(e) => onLogChange(exerciseId, setIndex, 'load', e.target.value)}
          onFocus={() => onSetSelect(setIndex)}
          className={`w-full rounded-md text-center py-2 font-bold text-lg border-2 ${
            isSelected
              ? 'bg-white/20 border-white/50 text-white placeholder:text-white/70'
              : `bg-white dark:bg-client-card dark:text-client-light ${getProgressionColor(logData?.load || '', placeholder?.load)}`
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex-none w-10 text-center pl-1">
        {isSelected ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCommentClick(exerciseId, setIndex);
            }}
            className="p-1 rounded-full text-white/80 hover:bg-white/20"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        ) : (
          hasComment && <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500 dark:text-client-subtle mx-auto" />
        )}
      </div>
    </div>
  );
};

export default AdaptiveSetInput;
