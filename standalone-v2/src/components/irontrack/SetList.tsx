import React, { useRef, useEffect, useCallback } from 'react';
import { ExerciseSet, DropSet } from './irontrack-types';
import SetRow from './SetRow';
import DropSetCard from './DropSetCard';

// Type pour les items de la liste (sets et drops)
type ListItem = 
  | { type: 'set'; setIndex: number; set: ExerciseSet }
  | { type: 'drop'; setIndex: number; dropIndex: number; drop: DropSet };

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

interface SetListProps {
  sets: ExerciseSet[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onWeightClick?: () => void;
  onRepsClick?: () => void;
  onDropWeightClick?: (setIndex: number, dropIndex: number) => void;
  onDropRepsClick?: (setIndex: number, dropIndex: number) => void;
  isLocked?: boolean;
  onLockToggle?: () => void;
  isPredataModified?: boolean;
  showDrops?: boolean;
  scrollToIndex?: (fn: (index: number) => void) => void;
}

const SET_HEIGHT = 96;  // Hauteur d'une carte série (80px + 16px gap)
const DROP_HEIGHT = 72; // Hauteur d'une carte drop (64px + 8px gap)

const SetList: React.FC<SetListProps> = ({ 
  sets, 
  selectedIndex, 
  onSelect, 
  onWeightClick, 
  onRepsClick, 
  onDropWeightClick, 
  onDropRepsClick, 
  isLocked = false, 
  onLockToggle, 
  isPredataModified = false, 
  showDrops = true,
  scrollToIndex
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);
  const snapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const flatItems = buildFlatItems(sets, showDrops);
  
  // Hauteur d'un item
  const getItemHeight = (index: number): number => {
    return flatItems[index]?.type === 'set' ? SET_HEIGHT : DROP_HEIGHT;
  };
  
  // Position de scroll pour centrer un item
  // Le centrage est déjà géré par le padding du container (calc(50% - 48px))
  // On retourne juste la position du haut de l'item
  const getScrollPositionForItem = (index: number): number => {
    let totalHeight = 0;
    for (let i = 0; i < index; i++) {
      totalHeight += getItemHeight(i);
    }
    return totalHeight;
  };
  
  // Trouver l'item le plus proche du centre
  const getItemAtCenter = (scrollTop: number): number => {
    if (!containerRef.current) return 0;
    
    const containerHeight = containerRef.current.clientHeight;
    const centerPosition = scrollTop + (containerHeight / 2);
    
    let accumulatedHeight = 0;
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < flatItems.length; i++) {
      const itemHeight = getItemHeight(i);
      const itemCenter = accumulatedHeight + (itemHeight / 2);
      const distance = Math.abs(centerPosition - itemCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
      
      accumulatedHeight += itemHeight;
    }
    
    return closestIndex;
  };
  
  // Scroller vers un item (exposé au parent)
  const scrollToItem = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    isScrollingProgrammatically.current = true;
    const scrollPos = getScrollPositionForItem(index);
    containerRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
    
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 500);
  }, [flatItems]);
  
  // Exposer la fonction au parent
  useEffect(() => {
    if (scrollToIndex) {
      scrollToIndex(scrollToItem);
    }
  }, [scrollToIndex, scrollToItem]);
  
  // Gérer le scroll manuel avec snap automatique
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrollingProgrammatically.current) return;
    
    const scrollTop = e.currentTarget.scrollTop;
    const centerIndex = getItemAtCenter(scrollTop);
    
    // Mettre à jour la sélection si l'item au centre change
    if (centerIndex !== selectedIndex) {
      onSelect(centerIndex);
      if (navigator.vibrate) navigator.vibrate(8);
    }
    
    // Snap automatique après 150ms sans scroll
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }
    
    snapTimeoutRef.current = setTimeout(() => {
      if (containerRef.current && !isScrollingProgrammatically.current) {
        const finalIndex = getItemAtCenter(containerRef.current.scrollTop);
        const targetScrollPos = getScrollPositionForItem(finalIndex);
        
        // Snap smooth vers le centre
        isScrollingProgrammatically.current = true;
        containerRef.current.scrollTo({ 
          top: targetScrollPos, 
          behavior: 'smooth' 
        });
        
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 300);
      }
    }, 150);
  };
  
  // Scroll initial vers l'item sélectionné
  useEffect(() => {
    // Attendre que le DOM soit complètement rendu
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const scrollPos = getScrollPositionForItem(selectedIndex);
        containerRef.current.scrollTop = scrollPos;
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="relative w-full h-full">
      
      {/* Zone de sélection fixe au centre */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md h-[96px] pointer-events-none z-30">
        <div className="w-full h-full rounded-xl border-2 border-violet-500/30 bg-violet-500/5 shadow-lg shadow-violet-500/20"></div>
      </div>

      {/* Container de scroll */}
      <div 
        ref={containerRef}
        onScroll={isLocked ? undefined : handleScroll}
        className={`absolute inset-0 overflow-y-auto no-scrollbar transition-opacity duration-300 ${
          isLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}
        style={{ 
          paddingTop: `calc(50% - ${SET_HEIGHT / 2}px)`,
          paddingBottom: `calc(50% - ${SET_HEIGHT / 2}px)`,
          scrollBehavior: 'auto',
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        } as React.CSSProperties}
      >
        {flatItems.map((item, index) => {
          const isActive = index === selectedIndex;
          
          return (
            <div 
              key={`item-${index}`}
              style={{ height: `${getItemHeight(index)}px` }}
              className="flex items-center justify-center"
            >
              <div 
                className={`w-[92%] max-w-md mx-auto transition-all duration-300 ease-out ${
                  isActive ? 'scale-105 opacity-100' : 'scale-100 opacity-60'
                }`}
              >
                {item.type === 'set' ? (
                  <SetRow
                    set={item.set}
                    setNumber={item.setIndex + 1}
                    isActive={isActive}
                    {/* Pas de clic pour activer - scroll uniquement */}
                    onClick={undefined}
                    onWeightClick={isActive ? onWeightClick : undefined}
                    onRepsClick={isActive ? onRepsClick : undefined}
                    onLockToggle={isActive ? onLockToggle : undefined}
                    isLocked={isLocked}
                    isPredataModified={isPredataModified}
                  />
                ) : (
                  <DropSetCard
                    drop={item.drop}
                    dropNumber={item.dropIndex + 1}
                    isActive={isActive}
                    onWeightClick={isActive ? () => onDropWeightClick?.(item.setIndex, item.dropIndex) : undefined}
                    onRepsClick={isActive ? () => onDropRepsClick?.(item.setIndex, item.dropIndex) : undefined}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SetList;
