import React, { useState, useRef, useEffect } from 'react';

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  unit?: string;
  onInteractionStart?: () => void;
}

/**
 * iOS-style number picker with cylindrical scroll effect
 * Enhanced for better fluidity and easier downward scrolling
 */
const NumberPicker: React.FC<NumberPickerProps> = ({
  value,
  onChange,
  min = 0,
  max = 200,
  step = 1,
  label,
  unit = '',
  onInteractionStart,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const lastMoveYRef = useRef<number>(0);

  const itemHeight = 28; // Further reduced for mobile
  const visibleItems = 15; // Increased massively for fast scroll - pre-render many items

  // Generate array of values
  const generateValues = () => {
    const values: number[] = [];
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
    return values;
  };

  const values = generateValues();
  const currentIndex = values.indexOf(value);

  // Handle touch/mouse start
  const handleStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setMomentum(0);
    lastMoveTimeRef.current = Date.now();
    lastMoveYRef.current = clientY;
    
    // Trigger interaction callback
    if (onInteractionStart) {
      onInteractionStart();
    }
  };

  // Handle touch/mouse move with increased sensitivity
  const handleMove = (clientY: number) => {
    if (!isDragging) return;

    const now = Date.now();
    const deltaY = clientY - startY;
    const velocity = (clientY - lastMoveYRef.current) / (now - lastMoveTimeRef.current || 1);
    
    // Apply 1.2x multiplier for balanced sensitivity
    setScrollOffset(deltaY * 1.2);
    setMomentum(velocity * 0.8); // Reduced momentum for better control
    
    lastMoveTimeRef.current = now;
    lastMoveYRef.current = clientY;
  };

  // Handle touch/mouse end with momentum
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Apply momentum for smoother feel
    const momentumOffset = momentum * 60; // Reduced momentum factor for better visibility
    const totalOffset = scrollOffset + momentumOffset;
    
    // Calculate new index based on scroll offset with sensitivity
    const itemsMoved = Math.round(-totalOffset / itemHeight);
    const newIndex = Math.max(0, Math.min(values.length - 1, currentIndex + itemsMoved));
    
    // Haptic feedback
    if ('vibrate' in navigator && itemsMoved !== 0) {
      navigator.vibrate(5);
    }

    onChange(values[newIndex]);
    setScrollOffset(0);
    setMomentum(0);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.clientY);
    }
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, scrollOffset, momentum, currentIndex]);

  // Render items with 3D effect
  const renderItems = () => {
    const items = [];
    const centerIndex = Math.floor(visibleItems / 2);

    for (let i = -centerIndex; i <= centerIndex; i++) {
      const index = currentIndex + i;
      if (index < 0 || index >= values.length) {
        items.push(
        <div
          key={`empty-${i}`}
          className="h-[40px] flex items-center justify-center"
        />
        );
        continue;
      }

      const itemValue = values[index];
      const offset = i * itemHeight + scrollOffset;
      const distance = Math.abs(offset) / itemHeight;
      
      // Simplified transform - no 3D rotation, minimal effects for maximum visibility
      const scale = Math.max(0.95, 1 - distance * 0.05); // Very minimal scaling
      const opacity = Math.max(0.4, 1 - distance * 0.3); // Simple opacity fade

      const isSelected = i === 0 && scrollOffset === 0;

      items.push(
        <div
          key={index}
          className="h-[40px] flex items-center justify-center absolute w-full"
          style={{
            transform: `translateY(${offset}px) scale(${scale})`,
            opacity,
            transition: 'none', // No transitions for instant rendering during scroll
          }}
        >
          <span
            className={`font-black font-mono tracking-tighter ${
              isSelected
                ? 'text-xl text-white'
                : 'text-base text-zinc-500'
            }`}
          >
            {itemValue}
          </span>
        </div>
      );
    }

    return items;
  };

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Picker Container with larger scroll area */}
      <div
        ref={containerRef}
        className="relative w-full h-[120px] overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Selection highlight */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[28px] border-y-2 border-violet-600/30 bg-violet-600/5 pointer-events-none z-10" />

        {/* Items container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {renderItems()}
        </div>

        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none z-20" />
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-20" />
      </div>

      {/* Label */}
      <div className="mt-0.5">
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
      </div>
    </div>
  );
};

export default NumberPicker;
