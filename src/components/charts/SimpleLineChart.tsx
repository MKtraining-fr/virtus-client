import React from 'react';
import { DataPoint } from '../../types';
import { renderAxes } from './chartUtils';

interface SimpleLineChartProps {
    data: DataPoint[];
    color: string;
    unit: string;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, color, unit }) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const svgWidth = 400;
    const svgHeight = 200;
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;
    
    if (!data || data.length < 2) {
        return <div style={{ height: svgHeight }} className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">Données insuffisantes.</div>;
    }

    const allValues = data.map(d => d.value);
    const yMinRaw = Math.min(...allValues);
    const yMaxRaw = Math.max(...allValues);
    const yPadding = (yMaxRaw - yMinRaw) * 0.1 || 2;
    const yMin = Math.max(0, yMinRaw - yPadding);
    const yMax = yMaxRaw + yPadding;

    const points = data
        .map((d, i) => {
            const x = margin.left + (i / (data.length - 1)) * chartWidth;
            let yValue = chartHeight;
            if (yMax > yMin) {
               yValue = chartHeight - ((d.value - yMin) / (yMax - yMin)) * chartHeight;
            }
            const y = margin.top + yValue;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            {renderAxes(svgWidth, svgHeight, margin, yMin, yMax, data, unit, '')}
            <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
        </svg>
    );
};

export default SimpleLineChart;
