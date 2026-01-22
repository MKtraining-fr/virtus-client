import React, { useRef, useState, useEffect } from 'react';
import { ExerciseSet, DropSet } from './irontrack-types';
import SetRow from './SetRow';
import DropSetCard from './DropSetCard';

// Type pour les items du cylindre (sets et drops apl atis)
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
}

const BASE_ITEM_HEIGHT = 96; // 80px item + 16px gap
const DROP_CARD_HEIGHT = 72; // Hauteur d'une carte drop (64px + 8px gap)

const SetWheel: React.FC<SetWheelProps> = ({ sets, selectedIndex, onSelect, onWeightClick, onRepsClick, onDropWeightClick, onDropRepsClick, isLocked = false, onLockToggle, isPredataModified = false, showDrops = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    let accumulatedHeight = 0;
    for (let i = 0; i < flatItems.length; i++) {
      const itemHeight = getItemHeight(i);
      if (scrollPos < accumulatedHeight + itemHeight / 2) {
        return i;
      }
      accumulatedHeight += itemHeight;
    }
    return flatItems.length - 1;
  };

  // Sync scroll position for 3D calculations
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setScrollTop(top);

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
      setScrollTop(scrollPos);
    }
  }, []);

  // External sync (e.g. logging a set)
  useEffect(() => {
    if (containerRef.current) {
      const target = getScrollPosition(selectedIndex);
      if (Math.abs(containerRef.current.scrollTop - target) > 5) {
        containerRef.current.scrollTo({ top: target, behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden min-h-[250px]" style={{ perspective: '1500px' }}>
      
      {/* 3D Cylinder Background Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[140px] bg-primary/5 blur-[90px] rounded-full pointer-events-none"></div>

      {/* Center Focus Line - Almost invisible */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] pointer-events-none z-30 bg-primary/10"></div>

      {/* Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={isLocked ? undefined : handleScroll}
        className={`h-full w-full overflow-y-auto no-scrollbar py-[calc(50%-63px)] relative z-20 transition-opacity duration-300 ${isLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          transformStyle: 'preserve-3d',
          scrollBehavior: 'auto',
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        } as React.CSSProperties}
      >
        {/* Label SÉRIE qui scroll */}
        <div 
          className="mb-4 flex justify-center transition-all duration-300 ease-out"
          style={{ 
            height: '30px',
            transformStyle: 'preserve-3d',
            transform: `translateZ(-80px)`,
            opacity: 0.4,
            pointerEvents: 'none'
          }}
        >
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            SÉRIE
          </span>
        </div>
        
        {flatItems.map((item, itemIdx) => {
          // Calculate 3D Offset for "Giant Wheel" effect
          const itemPosition = getScrollPosition(itemIdx);
          const distance = itemPosition - scrollTop;
          const normalizedDistance = distance / (BASE_ITEM_HEIGHT * 2); // -1 to 1 range for neighbors
          
          // Geometry for a larger diameter cylinder:
          // 1. Less rotation (flatter curve)
          const rotateX = Math.max(-35, Math.min(35, normalizedDistance * -35));
          
          // 2. Scale modéré : active 100%, adjacentes 95%, éloignées 90%
          const scale = Math.max(0.90, 1 - Math.abs(normalizedDistance) * 0.05);
          
          // 3. Less depth push (keep neighbors closer)
          const translateZ = Math.abs(normalizedDistance) * -60;
          
          // 4. Higher visibility for neighbors
          const opacity = 1 - Math.abs(normalizedDistance) * 0.5;
          const blur = Math.max(0, Math.abs(normalizedDistance) * 2 - 0.5); // Start blur only when further away

          const isActive = itemIdx === selectedIndex;

          return (
            <div 
              key={item.type === 'set' ? `set-${item.setIndex}` : `drop-${item.setIndex}-${item.dropIndex}`}
              className="mb-4 flex flex-col justify-start transition-all duration-300 ease-out"
              style={{ 
                minHeight: `${getItemHeight(itemIdx)}px`,
                transformStyle: 'preserve-3d',
                transform: `
                  translateY(${normalizedDistance * 5}px)
                  rotateX(${rotateX}deg) 
                  translateZ(${translateZ}px) 
                  scale(${scale})
                `,
                opacity: opacity,
                filter: `blur(${blur}px)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                zIndex: Math.round(100 - Math.abs(normalizedDistance) * 100)
              }}
            >
              <div className="w-[92%] max-w-md mx-auto">
                {item.type === 'set' ? (
                  <SetRow 
                    set={item.set} 
                    isActive={isActive}
                    onClick={() => {
                      onSelect(itemIdx);
                      containerRef.current?.scrollTo({ top: getScrollPosition(itemIdx), behavior: 'smooth' });
                    }}
                    onWeightClick={isActive ? onWeightClick : undefined}
                    onRepsClick={isActive ? onRepsClick : undefined}
                    onLockToggle={isActive ? onLockToggle : undefined}
                    isPredataModified={isActive ? isPredataModified : false}
                    isLocked={isActive ? isLocked : false}
                  />
                ) : (
                  <DropSetCard
                    drop={item.drop}
                    dropNumber={item.dropIndex + 1}
                    isActive={isActive}
                    onWeightClick={isActive && onDropWeightClick ? () => onDropWeightClick(item.setIndex, item.dropIndex) : undefined}
                    onRepsClick={isActive && onDropRepsClick ? () => onDropRepsClick(item.setIndex, item.dropIndex) : undefined}
                  />
                )}
              </div>
            </div>
          );
        })}
        
        {/* End of Cylinder visual padding */}
        <div className="h-[120px] flex items-center justify-center pointer-events-none opacity-20">
           <div className="w-12 h-1 bg-zinc-800 rounded-full"></div>
        </div>
      </div>

      {/* Cinematic Overlays - reduced to show more of top/bottom */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-zinc-950 to-transparent z-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent z-40 pointer-events-none"></div>
    </div>
  );
};

export default SetWheel;