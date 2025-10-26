import React, { useState } from 'react';

const MUSCLE_AREAS: {
  group: string;
  x: number;
  y: number;
  width: number;
  height: number;
  side: 'front' | 'back';
}[] = [
  { group: 'Épaules', x: 60, y: 55, width: 20, height: 20, side: 'front' },
  { group: 'Épaules', x: 120, y: 55, width: 20, height: 20, side: 'front' },
  { group: 'Pectoraux', x: 80, y: 65, width: 40, height: 25, side: 'front' },
  { group: 'Biceps', x: 55, y: 80, width: 15, height: 30, side: 'front' },
  { group: 'Biceps', x: 130, y: 80, width: 15, height: 30, side: 'front' },
  { group: 'Abdominaux', x: 85, y: 95, width: 30, height: 40, side: 'front' },
  { group: 'Quadriceps', x: 75, y: 140, width: 25, height: 60, side: 'front' },
  { group: 'Quadriceps', x: 100, y: 140, width: 25, height: 60, side: 'front' },

  { group: 'Dos', x: 80, y: 65, width: 40, height: 60, side: 'back' },
  { group: 'Triceps', x: 55, y: 80, width: 15, height: 30, side: 'back' },
  { group: 'Triceps', x: 130, y: 80, width: 15, height: 30, side: 'back' },
  { group: 'Lombaires', x: 85, y: 125, width: 30, height: 15, side: 'back' },
  { group: 'Fessiers', x: 80, y: 140, width: 40, height: 25, side: 'back' },
  { group: 'Ischio-jambiers', x: 75, y: 170, width: 25, height: 60, side: 'back' },
  { group: 'Ischio-jambiers', x: 100, y: 170, width: 25, height: 60, side: 'back' },
  { group: 'Mollets', x: 80, y: 240, width: 15, height: 30, side: 'back' },
  { group: 'Mollets', x: 105, y: 240, width: 15, height: 30, side: 'back' },
];

interface InteractiveBodyDiagramProps {
  selectedGroups: string[];
  onToggleGroup: (group: string) => void;
}

const InteractiveBodyDiagram: React.FC<InteractiveBodyDiagramProps> = ({
  selectedGroups,
  onToggleGroup,
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  const isSelected = (group: string) => selectedGroups.includes(group);

  return (
    <div>
      <div className="relative mx-auto" style={{ width: 200, height: 300 }}>
        <svg viewBox="0 0 200 300" className="w-full h-full">
          {/* Basic Silhouette */}
          <path
            d="M100 10 C 110 10 110 20 100 20 C 90 20 90 10 100 10 Z"
            className="fill-gray-200 dark:fill-gray-700"
          />{' '}
          {/* Head */}
          <path
            d="M90 20 L110 20 L115 50 L85 50 Z"
            className="fill-gray-200 dark:fill-gray-700"
          />{' '}
          {/* Neck */}
          <path
            d="M80 50 L120 50 L140 100 L120 140 L80 140 L60 100 Z"
            className="fill-gray-200 dark:fill-gray-700"
          />{' '}
          {/* Torso */}
          <path
            d="M100 140 L110 220 L100 280 L90 220 Z"
            className="fill-gray-200 dark:fill-gray-700"
          />{' '}
          {/* Legs */}
        </svg>
        <div className="absolute inset-0">
          {MUSCLE_AREAS.filter((area) => area.side === view).map((area) => (
            <div
              key={`${area.group}-${area.x}-${area.y}`}
              className={`absolute cursor-pointer border-2 transition-colors ${isSelected(area.group) ? 'bg-primary/50 border-primary' : 'bg-primary/10 border-transparent hover:bg-primary/30'}`}
              style={{
                left: `${area.x / 2}%`,
                top: `${area.y / 3}%`,
                width: `${area.width / 2}%`,
                height: `${area.height / 3}%`,
                borderRadius: '10px',
              }}
              onClick={() => onToggleGroup(area.group)}
              title={area.group}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        <button
          onClick={() => setView('front')}
          className={`px-3 py-1 rounded-full text-sm ${view === 'front' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-client-card text-gray-800 dark:text-client-light'}`}
        >
          Avant
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-3 py-1 rounded-full text-sm ${view === 'back' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-client-card text-gray-800 dark:text-client-light'}`}
        >
          Arrière
        </button>
      </div>
    </div>
  );
};

export default InteractiveBodyDiagram;
