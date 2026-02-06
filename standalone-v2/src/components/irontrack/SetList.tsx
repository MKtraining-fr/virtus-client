import React, { useRef, useEffect } from 'react';
import { Lock, LockOpen, Check } from 'lucide-react';
import { Badge } from '../ui';
import { ExerciseSet, DropSet } from './irontrack-types';

type ListItem = 
  | { type: 'set'; setIndex: number; set: ExerciseSet }
  | { type: 'drop'; setIndex: number; dropIndex: number; drop: DropSet };

interface SetListProps {
  sets: ExerciseSet[];
  currentItemIndex: number;
  onItemSelect: (index: number) => void;
  onWeightClick: () => void;
  onRepsClick: () => void;
  onDropWeightClick: (setIndex: number, dropIndex: number) => void;
  onDropRepsClick: (setIndex: number, dropIndex: number) => void;
  isLocked: boolean;
  onLockToggle: () => void;
  isPredataModified: boolean;
  showDrops: boolean;
  scrollToIndex?: (fn: (index: number) => void) => void;
}

const SetList: React.FC<SetListProps> = ({
  sets,
  currentItemIndex,
  onItemSelect,
  onWeightClick,
  onRepsClick,
  onDropWeightClick,
  onDropRepsClick,
  isLocked,
  onLockToggle,
  isPredataModified,
  showDrops,
  scrollToIndex,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Construire la liste aplatie d'items
  const buildFlatItems = (sets: ExerciseSet[], showDrops: boolean): ListItem[] => {
    const items: ListItem[] = [];
    
    sets.forEach((set, setIndex) => {
      items.push({ type: 'set', setIndex, set });
      
      if (showDrops && set.drops && set.drops.length > 0) {
        set.drops.forEach((drop, dropIndex) => {
          items.push({ type: 'drop', setIndex, dropIndex, drop });
        });
      }
    });
    
    return items;
  };

  const flatItems = buildFlatItems(sets, showDrops);

  // Fonction de scroll
  const scrollToItem = (index: number) => {
    const item = itemRefs.current[index];
    if (item && listRef.current) {
      const container = listRef.current;
      const itemTop = item.offsetTop;
      const itemHeight = item.offsetHeight;
      const containerHeight = container.clientHeight;
      const scrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  };

  // Exposer la fonction de scroll au parent
  useEffect(() => {
    if (scrollToIndex) {
      scrollToIndex(scrollToItem);
    }
  }, [scrollToIndex]);

  // Auto-scroll quand l'item actif change
  useEffect(() => {
    scrollToItem(currentItemIndex);
  }, [currentItemIndex]);

  return (
    <div
      ref={listRef}
      className="list-area overflow-y-auto px-4 py-2 space-y-2"
    >
      {flatItems.map((item, index) => {
        const isActive = index === currentItemIndex;
        
        if (item.type === 'set') {
          const set = item.set;
          const setIndex = item.setIndex;
          
          return (
            <div
              key={`set-${setIndex}`}
              ref={(el) => { itemRefs.current[index] = el; }}
              onClick={() => !isActive && onItemSelect(index)}
              className={`rounded-xl p-4 transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600 border-2 border-brand-400 scale-105 shadow-lg'
                  : set.completed
                  ? 'bg-green-600/20 border border-green-600/30'
                  : 'bg-bg-card dark:bg-bg-card border border-border dark:border-border hover:border-brand-500'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black uppercase tracking-wider ${
                    isActive ? 'text-white' : 'text-text-secondary dark:text-text-secondary'
                  }`}>
                    Série {setIndex + 1}
                  </span>
                  {set.completed && (
                    <Badge variant="success" size="sm" icon={<Check size={12} />}>
                      Complété
                    </Badge>
                  )}
                  {isActive && isPredataModified && (
                    <Badge variant="warning" size="sm">Modifié</Badge>
                  )}
                </div>
                
                {isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLockToggle();
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {isLocked ? (
                      <Lock size={16} className="text-white" />
                    ) : (
                      <LockOpen size={16} className="text-white" />
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Poids */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive && !isLocked) onWeightClick();
                  }}
                  disabled={!isActive || isLocked}
                  className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                    isActive && !isLocked
                      ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                      : 'bg-bg-secondary dark:bg-bg-secondary cursor-default'
                  }`}
                >
                  <div className={`text-xs uppercase tracking-wider mb-1 ${
                    isActive ? 'text-brand-200' : 'text-text-tertiary dark:text-text-tertiary'
                  }`}>
                    Poids
                  </div>
                  <div className={`text-2xl font-black ${
                    isActive ? 'text-white' : 'text-text-primary dark:text-text-primary'
                  }`}>
                    {set.weight}
                    <span className="text-sm ml-1">kg</span>
                  </div>
                </button>

                {/* Reps */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive && !isLocked) onRepsClick();
                  }}
                  disabled={!isActive || isLocked}
                  className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                    isActive && !isLocked
                      ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                      : 'bg-bg-secondary dark:bg-bg-secondary cursor-default'
                  }`}
                >
                  <div className={`text-xs uppercase tracking-wider mb-1 ${
                    isActive ? 'text-brand-200' : 'text-text-tertiary dark:text-text-tertiary'
                  }`}>
                    Reps
                  </div>
                  <div className={`text-2xl font-black ${
                    isActive ? 'text-white' : 'text-text-primary dark:text-text-primary'
                  }`}>
                    {set.reps}
                  </div>
                </button>
              </div>

              {set.previousBest && (
                <div className={`mt-2 text-xs ${
                  isActive ? 'text-brand-200' : 'text-text-tertiary dark:text-text-tertiary'
                }`}>
                  Record précédent : {set.previousBest}
                </div>
              )}
            </div>
          );
        } else {
          // Drop set
          const drop = item.drop;
          const setIndex = item.setIndex;
          const dropIndex = item.dropIndex;
          
          return (
            <div
              key={`drop-${setIndex}-${dropIndex}`}
              ref={(el) => { itemRefs.current[index] = el; }}
              onClick={() => !isActive && onItemSelect(index)}
              className={`rounded-xl p-3 ml-8 transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-600 border-2 border-orange-400 scale-105 shadow-lg'
                  : drop.completed
                  ? 'bg-green-600/20 border border-green-600/30'
                  : 'bg-bg-card dark:bg-bg-card border border-orange-600/30 hover:border-orange-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black uppercase tracking-wider ${
                  isActive ? 'text-white' : 'text-orange-400'
                }`}>
                  Drop {dropIndex + 1}
                </span>
                {drop.completed && (
                  <Badge variant="success" size="sm" icon={<Check size={10} />} />
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Poids Drop */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive && !isLocked) onDropWeightClick(setIndex, dropIndex);
                  }}
                  disabled={!isActive || isLocked}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                    isActive && !isLocked
                      ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                      : 'bg-bg-secondary dark:bg-bg-secondary cursor-default'
                  }`}
                >
                  <div className={`text-[10px] uppercase tracking-wider mb-0.5 ${
                    isActive ? 'text-orange-200' : 'text-text-tertiary dark:text-text-tertiary'
                  }`}>
                    Poids
                  </div>
                  <div className={`text-lg font-black ${
                    isActive ? 'text-white' : 'text-text-primary dark:text-text-primary'
                  }`}>
                    {drop.weight}
                    <span className="text-xs ml-0.5">kg</span>
                  </div>
                </button>

                {/* Reps Drop */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive && !isLocked) onDropRepsClick(setIndex, dropIndex);
                  }}
                  disabled={!isActive || isLocked}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                    isActive && !isLocked
                      ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                      : 'bg-bg-secondary dark:bg-bg-secondary cursor-default'
                  }`}
                >
                  <div className={`text-[10px] uppercase tracking-wider mb-0.5 ${
                    isActive ? 'text-orange-200' : 'text-text-tertiary dark:text-text-tertiary'
                  }`}>
                    Reps
                  </div>
                  <div className={`text-lg font-black ${
                    isActive ? 'text-white' : 'text-text-primary dark:text-text-primary'
                  }`}>
                    {drop.reps === 'échec' ? '∞' : drop.reps}
                  </div>
                </button>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
};

export default SetList;
