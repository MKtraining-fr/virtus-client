import React, { useMemo } from 'react';
import { Measurement } from '../../types';
import { renderAxes } from './chartUtils';

interface MeasurementsLineChartProps {
  data: ({ date: string } & Partial<Measurement>)[];
  selectedMeasurements: Array<keyof Measurement>;
}

const MeasurementsLineChart: React.FC<MeasurementsLineChartProps> = ({
  data,
  selectedMeasurements,
}) => {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const svgWidth = 400;
  const svgHeight = 200;
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  const colors: Record<keyof Measurement, string> = {
    neck: '#F87171',
    chest: '#60A5FA',
    l_bicep: '#34D399',
    r_bicep: '#A78BFA',
    waist: '#FBBF24',
    hips: '#EC4899',
    l_thigh: '#2DD4BF',
    r_thigh: '#818CF8',
  };
  const measurementLabels: Record<keyof Measurement, string> = {
    neck: 'Cou',
    chest: 'Poitrine',
    l_bicep: 'Biceps G.',
    r_bicep: 'Biceps D.',
    waist: 'Taille',
    hips: 'Hanches',
    l_thigh: 'Cuisse G.',
    r_thigh: 'Cuisse D.',
  };

  const chartData = useMemo(() => {
    return data.filter((d) =>
      selectedMeasurements.some((key) => d[key] !== undefined && d[key] !== null)
    );
  }, [data, selectedMeasurements]);

  if (!chartData || chartData.length < 2 || selectedMeasurements.length === 0) {
    return (
      <div
        style={{ height: svgHeight }}
        className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg"
      >
        Sélectionnez une mesure pour voir le graphique.
      </div>
    );
  }

  const allValues = chartData
    .flatMap((d) => selectedMeasurements.map((key) => d[key] as number))
    .filter((v) => v !== undefined && v !== null);
  const yMinRaw = Math.min(...allValues);
  const yMaxRaw = Math.max(...allValues);
  const yPadding = (yMaxRaw - yMinRaw) * 0.1 || 2;
  const yMin = Math.max(0, yMinRaw - yPadding);
  const yMax = yMaxRaw + yPadding;

  const getPointsForKey = (key: keyof Measurement) => {
    return chartData
      .map((d, i) => {
        const value = d[key];
        if (value === undefined || value === null) return null;
        const x = margin.left + (i / (chartData.length - 1)) * chartWidth;
        let yValue = chartHeight;
        if (yMax > yMin) {
          yValue = chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
        }
        const y = margin.top + yValue;
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(' ');
  };

  return (
    <div>
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {renderAxes(svgWidth, svgHeight, margin, yMin, yMax, chartData, 'cm', '')}
        {selectedMeasurements.map((key) => (
          <polyline
            key={String(key)}
            fill="none"
            stroke={colors[key]}
            strokeWidth="2.5"
            points={getPointsForKey(key)}
          />
        ))}
      </svg>
      <div className="flex justify-center flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
        {selectedMeasurements.map((key) => (
          <div key={String(key)} className="flex items-center gap-1">
            <span style={{ backgroundColor: colors[key] }} className="w-3 h-3 rounded-sm"></span>
            <span>{measurementLabels[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeasurementsLineChart;
