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
    const shouldApply =
      config.applyTo === 'all' ||
      (config.applyTo === 'last' && setIndex === 0) || // Assuming last set logic
      (config.applyTo === 'specific' && config.specificSets?.includes(setIndex + 1));

    if (!shouldApply) {
      // Render standard input
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
    }

    // Render Drop Set with expand/collapse
    return (
      <div className="space-y-2">
        {/* Série principale */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => onSetSelect(setIndex)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              S{setIndex + 1}
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={logData?.reps || ''}
              onChange={(e) => onLogChange(exerciseId, setIndex, 'reps', e.target.value)}
              placeholder={targetReps || '0'}
              className={`w-16 px-2 py-1.5 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getProgressionColor(logData?.reps || '', placeholder?.reps)
              }`}
            />
            <span className="text-xs text-gray-500">reps</span>
            <input
              type="number"
              inputMode="decimal"
              value={logData?.load || ''}
              onChange={(e) => onLogChange(exerciseId, setIndex, 'load', e.target.value)}
              placeholder={targetLoad || '0'}
              className={`w-20 px-2 py-1.5 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getProgressionColor(logData?.load || '', placeholder?.load)
              }`}
            />
            <span className="text-xs text-gray-500">{loadUnit || 'kg'}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCommentClick(exerciseId, setIndex);
            }}
            className={`p-2 rounded-lg transition-colors ${
              hasComment
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {hasComment ? <ChatBubbleLeftIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Bouton expand/collapse */}
        <div className="flex items-center gap-2 ml-10">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isExpanded ? '▲ Cacher' : '▼ Voir'} les paliers ({config.dropLevels.length})
          </button>
        </div>

        {/* Paliers Drop Set (affichés uniquement si expanded) */}
        {isExpanded && (
          <div className="ml-10 space-y-2 border-l-2 border-blue-200 pl-4">
            {config.dropLevels.map((level: any, idx: number) => {
              const subSeriesData = logData?.sub_series_performance || [];
              const subData = subSeriesData[idx] || {};
              const calculatedLoad = logData?.load 
                ? level.type === 'percentage'
                  ? (parseFloat(logData.load) * (1 - level.value / 100)).toFixed(1)
                  : (parseFloat(logData.load) - level.value).toFixed(1)
                : '';

              return (
                <div key={idx} className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-medium text-blue-700 w-16">
                      Palier {idx + 1}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={subData.reps || ''}
                      onChange={(e) => {
                        const newSubSeries = [...subSeriesData];
                        newSubSeries[idx] = { ...subData, reps: e.target.value };
                        onLogChange(exerciseId, setIndex, 'sub_series_performance', newSubSeries);
                      }}
                      placeholder={level.targetReps ? `${level.targetReps}` : '0'}
                      className="w-16 px-2 py-1.5 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-xs text-gray-500">reps</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={subData.load || ''}
                      onChange={(e) => {
                        const newSubSeries = [...subSeriesData];
                        newSubSeries[idx] = { ...subData, load: e.target.value };
                        onLogChange(exerciseId, setIndex, 'sub_series_performance', newSubSeries);
                      }}
                      placeholder={calculatedLoad}
                      className="w-20 px-2 py-1.5 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-xs text-gray-500">{loadUnit || 'kg'}</span>
                    <span className="text-xs text-gray-400">
                      ({level.type === 'percentage' ? `-${level.value}%` : `-${level.value}${loadUnit || 'kg'}`})
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
    const shouldApply =
      config.applyTo === 'all' ||
      (config.applyTo === 'last' && setIndex === 0) ||
      (config.applyTo === 'specific' && config.specificSets?.includes(setIndex + 1));

    if (!shouldApply) {
      // Render standard input (same as above)
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
    }

    // Render Rest-Pause with mini-sets
    return (
      <div className="space-y-2 mb-4">
        <div
          className={`p-3 rounded-lg border-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-client-dark'}`}
          onClick={() => onSetSelect(setIndex)}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-sm text-gray-700 dark:text-client-light">Série {setIndex + 1} - Rest-Pause</p>
            {isSelected ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick(exerciseId, setIndex);
                }}
                className="p-1 rounded-full text-primary hover:bg-primary/20"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            ) : (
              hasComment && <ChatBubbleLeftIcon className="w-4 h-4 text-gray-500 dark:text-client-subtle" />
            )}
          </div>

          {/* Main set */}
          <div className="mb-2">
            <p className="text-xs text-gray-600 dark:text-client-subtle mb-1">Série principale</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={targetReps}
                value={logData?.reps || ''}
                onChange={(e) => onLogChange(exerciseId, setIndex, 'reps', e.target.value)}
                className="flex-1 rounded-md text-center py-2 text-sm border-2 border-gray-300 dark:border-client-dark bg-white dark:bg-client-card dark:text-client-light"
                onClick={(e) => e.stopPropagation()}
              />
              <input
                type="number"
                placeholder={targetLoad}
                value={logData?.load || ''}
                onChange={(e) => onLogChange(exerciseId, setIndex, 'load', e.target.value)}
                className="flex-1 rounded-md text-center py-2 text-sm border-2 border-gray-300 dark:border-client-dark bg-white dark:bg-client-card dark:text-client-light"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Mini-sets */}
          {Array.from({ length: config.miniSets }).map((_, miniIndex) => (
            <div key={miniIndex} className="mb-2">
              <p className="text-xs text-gray-600 dark:text-client-subtle mb-1">
                Mini-série {miniIndex + 1} (après {config.pauseDuration}s)
              </p>
              <input
                type="number"
                placeholder="Reps"
                value={(logData as any)?.[`mini_${miniIndex}_reps`] || ''}
                onChange={(e) => onLogChange(exerciseId, setIndex, `mini_${miniIndex}_reps`, e.target.value)}
                className="w-full rounded-md text-center py-2 text-sm border-2 border-gray-300 dark:border-client-dark bg-white dark:bg-client-card dark:text-client-light"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For other techniques (Myo-Reps, Cluster Sets, Tempo), render standard input for now
  // These can be implemented similarly if needed
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
