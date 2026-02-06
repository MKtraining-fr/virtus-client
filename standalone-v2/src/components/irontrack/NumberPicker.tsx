import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface NumberPickerProps {
  value: number | 'échec';
  onChange: (value: number | 'échec') => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

const NumberPicker: React.FC<NumberPickerProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
}) => {
  const handleIncrement = () => {
    if (value === 'échec') {
      onChange(min);
    } else if (value < max) {
      onChange(Math.min(value + step, max));
    }
  };

  const handleDecrement = () => {
    if (value === 'échec') {
      return;
    } else if (value > min) {
      onChange(Math.max(value - step, min));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-3">
        {/* Bouton - */}
        <button
          onClick={handleDecrement}
          disabled={value === 'échec' || value <= min}
          className="w-14 h-14 rounded-xl bg-bg-secondary dark:bg-bg-secondary border border-border dark:border-border flex items-center justify-center text-text-primary dark:text-text-primary hover:bg-bg-hover dark:hover:bg-bg-hover active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus size={24} strokeWidth={3} />
        </button>

        {/* Affichage de la valeur */}
        <div className="flex-1 relative">
          <input
            type="number"
            value={value === 'échec' ? '' : value}
            onChange={handleInputChange}
            readOnly={value === 'échec'}
            step={step}
            min={min}
            max={max}
            className="w-full h-20 text-center text-5xl font-black text-text-primary dark:text-text-primary bg-bg-card dark:bg-bg-card border-2 border-brand-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Bouton + */}
        <button
          onClick={handleIncrement}
          disabled={value !== 'échec' && value >= max}
          className="w-14 h-14 rounded-xl bg-bg-secondary dark:bg-bg-secondary border border-border dark:border-border flex items-center justify-center text-text-primary dark:text-text-primary hover:bg-bg-hover dark:hover:bg-bg-hover active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Boutons rapides */}
      <div className="flex gap-2">
        {step === 2.5 && (
          <>
            <button
              onClick={() => onChange(typeof value === 'number' ? value - 10 : min)}
              disabled={value === 'échec' || (typeof value === 'number' && value <= min + 10)}
              className="flex-1 py-2 px-3 rounded-lg bg-bg-secondary dark:bg-bg-secondary border border-border dark:border-border text-text-secondary dark:text-text-secondary text-sm font-medium hover:bg-bg-hover dark:hover:bg-bg-hover active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              -10
            </button>
            <button
              onClick={() => onChange(typeof value === 'number' ? value + 10 : min)}
              disabled={value !== 'échec' && typeof value === 'number' && value >= max - 10}
              className="flex-1 py-2 px-3 rounded-lg bg-bg-secondary dark:bg-bg-secondary border border-border dark:border-border text-text-secondary dark:text-text-secondary text-sm font-medium hover:bg-bg-hover dark:hover:bg-bg-hover active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +10
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <button
              onClick={() => onChange(typeof value === 'number' ? value - 5 : min)}
              disabled={value === 'échec' || (typeof value === 'number' && value <= min + 5)}
              className="flex-1 py-2 px-3 rounded-lg bg-bg-secondary dark:bg-bg-secondary border border-border dark:border-border text-text-secondary dark:text-text-secondary text-sm font-medium hover:bg-bg-hover dark:hover:bg-bg-hover active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              -5
            </button>
            <button
              onClick={() => onChange(typeof value === 'number' ? value + 5 : min)}
              disabled={value !== 'échec' && typeof value === 'number' && value >= max - 5}
              className="flex-1 py-2 px-3 rounded-lg bg-bg-secondary dark:bg-bg-secondary border border-border dark:border-border text-text-secondary dark:text-text-secondary text-sm font-medium hover:bg-bg-hover dark:hover:bg-bg-hover active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +5
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NumberPicker;
