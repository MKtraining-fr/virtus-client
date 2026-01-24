import React, { useRef, useState, useEffect } from 'react';
import { ExerciseSet, DropSet } from './irontrack-types';
import SetRow from './SetRow';
import DropSetCard from './DropSetCard';

// Type pour les items du cylindre (sets et drops aplatis)
type WheelItem = 
  | { type: 'set'; setIndex: number; set: ExerciseSet }
  | { type: 'drop'; setIndex: number; dropIndex: number; drop: DropSet };

// Fonction pour construire la liste aplatie d'items
const buildFlatItems = (sets: ExerciseSet[], showDrops: boolean): WheelItem[] => {
  const items: WheelItem[] = [];
  
  sets.forEach((set, setIndex) => {
    // Ajouter la série
    items.push({ type: 'set', setIndex, set });
    
    // Ajouter les drops si présents
    if (showDrops && set.drops && set.drops.length > 0) {
      set.drops.forEach((drop, dropIndex) => {
        items.push({ type: 'drop', setIndex, dropIndex, drop });
      });
    }
  });
  
  return items;
};

interface SetWheelProps {
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
  scrollToIndex?: (index: number) => void;  // Callback pour exposer la fonction de scroll
}

const BASE_ITEM_HEIGHT = 96; // 80px item + 16px gap
const DROP_CARD_HEIGHT = 72; // Hauteur d'une carte drop (64px + 8px gap)

const SetWheel: React.FC<SetWheelProps> = ({ 
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
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInternalScrollRef = useRef(false);  // Flag pour ignorer handleScroll pendant scroll programmatique
  
  // Construire la liste aplatie d'items
  const flatItems = buildFlatItems(sets, showDrops);
  
  // Calculer la hauteur d'un item (set ou drop)
  const getItemHeight = (itemIndex: number): number => {
    const item = flatItems[itemIndex];
    return item.type === 'set' ? BASE_ITEM_HEIGHT : DROP_CARD_HEIGHT;
  };
  
  // Calculer la position de scroll pour un itemIndex donné
  const getScrollPosition = (itemIndex: number): number => {
    let position = 0;
    for (let i = 0; i < itemIndex; i++) {
      position += getItemHeight(i);
    }
    return position;
  };
  
  // Trouver l'itemIndex à partir de la position de scroll
  const getIndexFromScroll = (scrollPos: number): number => {
    const containerHeight = containerRef.current?.clientHeight || 800;
    const viewportCenter = scrollPos + (containerHeight / 2);
    
    let accumulatedHeight = 0;
    for (let i = 0; i < flatItems.length; i++) {
      const itemHeight = getItemHeight(i);
      const itemCenter = accumulatedHeight + (itemHeight / 2);
      
      if (viewportCenter < itemCenter + (itemHeight / 2)) {
        return i;
      }
      accumulatedHeight += itemHeight;
    }
    return flatItems.length - 1;
  };

  // Fonction pour scroller vers un index (exposée via callback)
  const scrollToIndexInternal = useCallback((index: number) => {
    if (containerRef.current) {
      isInternalScrollRef.current = true;  // Marquer comme scroll programmatique
      const target = getScrollPosition(index);
      containerRef.current.scrollTo({ top: target, behavior: 'smooth' });
      
      // Réinitialiser le flag après le scroll
      setTimeout(() => {
        isInternalScrollRef.current = false;
      }, 500);
    }
  }, [flatItems]);

  // Exposer la fonction de scroll au parent
  useEffect(() => {
    if (scrollToIndex) {
      scrollToIndex(scrollToIndexInternal as any);
    }
  }, [scrollToIndex, scrollToIndexInternal]);

  // Sync scroll position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Ignorer si c'est un scroll programmatique
    if (isInternalScrollRef.current) return;
    
    setIsUserScrolling(true);
    
    const top = e.currentTarget.scrollTop;

    // Logic for selection
    const itemIndex = getIndexFromScroll(top);
    if (itemIndex !== selectedIndex && itemIndex >= 0 && itemIndex < flatItems.length) {
      onSelect(itemIndex);
      if (navigator.vibrate) navigator.vibrate(8);
    }

    // Auto-snap after scroll ends
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
      const targetItemIndex = getIndexFromScroll(top);
      const targetScroll = getScrollPosition(targetItemIndex);
      if (Math.abs(top - targetScroll) > 2 && containerRef.current) {
        containerRef.current.scrollTo({ 
          top: targetScroll, 
          behavior: 'smooth' 
        });
      }
    }, 150);
  };

  // Initial scroll to current set
  useEffect(() => {
    if (containerRef.current) {
      const scrollPos = getScrollPosition(selectedIndex);
      containerRef.current.scrollTop = scrollPos;
    }
  }, []);

  // Pas de useEffect externe - le scroll est maintenant contrôlé explicitement par le parent

  return (
    <div className="relative w-full h-full">
      
      {/* Zone de sélection fixe au centre */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md h-[96px] pointer-events-none z-30">
        <div className="w-full h-full rounded-xl border-2 border-primary/20 bg-primary/5"></div>
      </div>

      {/* Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={isLocked ? undefined : handleScroll}
        className={`absolute inset-0 overflow-y-auto no-scrollbar transition-opacity duration-300 ${isLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          paddingTop: `calc(50% - ${BASE_ITEM_HEIGHT / 2}px)`,
          paddingBottom: `calc(50% - ${BASE_ITEM_HEIGHT / 2}px)`,
          scrollBehavior: 'auto',
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        } as React.CSSProperties}
      >
        {/* Items */}
        {flatItems.map((item, itemIdx) => {
          const isActive = itemIdx === selectedIndex;
          
          return (
            <div 
              key={`item-${itemIdx}`}
              style={{ 
                height: `${getItemHeight(itemIdx)}px`,
              }}
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
                    onClick={() => onSelect(itemIdx)}
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

export default SetWheel;
