import React from 'react';

interface ToggleSwitchProps {
  label1: string;
  value1: string;
  label2: string;
  value2: string;
  value: string;
  onChange: (value: string) => void;
  theme?: 'light' | 'dark';
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label1,
  value1,
  label2,
  value2,
  value,
  onChange,
  theme = 'light',
}) => {
  const isValue1Active = value === value1;

  const containerClasses = theme === 'dark' ? 'bg-client-dark' : 'bg-gray-200';
  const inactiveLabelClasses = theme === 'dark' ? 'text-client-subtle' : 'text-gray-600';
  const switchBgClasses = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300/50';

  return (
    <div className={`flex items-center space-x-4 p-1 ${containerClasses} rounded-full`}>
      <span
        className={`font-semibold text-lg cursor-pointer transition-colors px-4 ${isValue1Active ? 'text-primary' : inactiveLabelClasses}`}
        onClick={() => onChange(value1)}
      >
        {label1}
      </span>
      <div
        onClick={() => onChange(isValue1Active ? value2 : value1)}
        className={`w-16 h-8 flex items-center ${switchBgClasses} rounded-full p-1 cursor-pointer transition-colors`}
      >
        <div
          className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${!isValue1Active ? 'translate-x-8' : ''}`}
        ></div>
      </div>
      <span
        className={`font-semibold text-lg cursor-pointer transition-colors px-4 ${!isValue1Active ? 'text-primary' : inactiveLabelClasses}`}
        onClick={() => onChange(value2)}
      >
        {label2}
      </span>
    </div>
  );
};

export default ToggleSwitch;
