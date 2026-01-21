import React, { useRef, useEffect, useState } from 'react';
import { ExerciseSet } from './irontrack-types';
import SetRow from './SetRow';

interface SetWheelProps {
  sets: ExerciseSet[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onWeightClick?: () => void;
  onRepsClick?: () => void;
  isLocked?: boolean;
  onLockToggle?: () => void;
  isPredataModified?: boolean;
}

const ITEM_HEIGHT = 96; // 80px item + 16px gap

const SetWheel: React.FC<SetWheelProps> = ({ sets, selectedIndex, onSelect, onWeightClick, onRepsClick, isLocked = false, onLockToggle, isPredataModified = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync scroll position for 3D calculations
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setScrollTop(top);

    // Logic for selection
    const index = Math.round(top / ITEM_HEIGHT);
    if (index !== selectedIndex && index >= 0 && index < sets.length) {
      onSelect(index);
      if (navigator.vibrate) navigator.vibrate(8);
    }

    // Auto-snap after scroll ends
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const targetIndex = Math.round(top / ITEM_HEIGHT);
      const targetScroll = targetIndex * ITEM_HEIGHT;
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
      containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
      setScrollTop(selectedIndex * ITEM_HEIGHT);
    }
  }, []);

  // External sync (e.g. logging a set)
  useEffect(() => {
    if (containerRef.current) {
      const target = selectedIndex * ITEM_HEIGHT;
      if (Math.abs(containerRef.current.scrollTop - target) > 5) {
        containerRef.current.scrollTo({ top: target, behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden min-h-[250px]" style={{ perspective: '1500px' }}>
      
      {/* 3D Cylinder Background Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[140px] bg-primary/5 blur-[90px] rounded-full pointer-events-none"></div>

      {/* Center Focus Line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] pointer-events-none z-30 bg-primary/60"></div>

      {/* Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={isLocked ? undefined : handleScroll}
        className={`h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar py-[calc(50%-40px)] relative z-20 transition-opacity duration-300 ${isLocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          transformStyle: 'preserve-3d',
          scrollBehavior: 'smooth',
          scrollSnapType: 'y mandatory',
          scrollSnapStop: 'always'
        }}
      >
        {/* Label SÉRIE qui scroll */}
        <div 
          className="snap-center mb-4 flex justify-center transition-all duration-300 ease-out"
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
        
        {sets.map((set, idx) => {
          // Calculate 3D Offset for "Giant Wheel" effect
          const distance = (idx * ITEM_HEIGHT) - scrollTop;
          const normalizedDistance = distance / (ITEM_HEIGHT * 2); // -1 to 1 range for neighbors
          
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

          return (
            <div 
              key={set.id} 
              className="snap-center mb-4 flex justify-center transition-all duration-300 ease-out"
              style={{ 
                height: '80px',
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
              <div className="w-[92%] max-w-md">
                <SetRow 
                  set={set} 
                  isActive={idx === selectedIndex}
                  onClick={() => {
                    onSelect(idx);
                    containerRef.current?.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
                  }}
                  onWeightClick={idx === selectedIndex ? onWeightClick : undefined}
                  onRepsClick={idx === selectedIndex ? onRepsClick : undefined}
                  onLockToggle={idx === selectedIndex ? onLockToggle : undefined}
                  isPredataModified={idx === selectedIndex ? isPredataModified : false}
                />
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