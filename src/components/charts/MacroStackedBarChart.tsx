import React from 'react';

interface MacroChartData {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroStackedBarChartProps {
  data: MacroChartData[];
}

const MacroStackedBarChart: React.FC<MacroStackedBarChartProps> = ({ data }) => {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const svgWidth = 400;
  const svgHeight = 200;
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height: svgHeight }}
        className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg"
      >
        Données insuffisantes.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    proteinKcal: (d.protein || 0) * 4,
    carbsKcal: (d.carbs || 0) * 4,
    fatKcal: (d.fat || 0) * 9,
    totalKcal: (d.protein || 0) * 4 + (d.carbs || 0) * 4 + (d.fat || 0) * 9,
  }));

  const yMax = Math.max(...chartData.map((d) => d.totalKcal), 1) * 1.1; // Add 1 to avoid yMax being 0
  const barWidth = (chartWidth / chartData.length) * 0.8;
  const barSpacing = (chartWidth / chartData.length) * 0.2;

  // Y-axis ticks calculation
  const yTickCount = 5;
  const yTicks = [];
  const yMin = 0;
  if (yMax > yMin) {
    const tickStep = (yMax - yMin) / (yTickCount - 1);
    for (let i = 0; i < yTickCount; i++) {
      yTicks.push(yMin + i * tickStep);
    }
  } else if (yMax > 0) {
    yTicks.push(yMin, yMax);
  }

  return (
    <div>
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Y-axis Grid and Labels */}
        {yTicks.map((tick, i) => {
          const yValue = margin.top + chartHeight * (1 - (tick - yMin) / (yMax - yMin));
          return (
            <g key={`y-tick-${i}`} className="text-gray-400">
              <line
                x1={margin.left}
                x2={svgWidth - margin.right}
                y1={yValue}
                y2={yValue}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <text
                x={margin.left - 8}
                y={yValue}
                dy="0.32em"
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}
        <text
          transform={`translate(${margin.left / 3}, ${svgHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          className="font-semibold"
        >
          kcal
        </text>

        {/* Bars, Data Labels, and X-axis labels */}
        {chartData.map((d, i) => {
          const x = margin.left + i * (barWidth + barSpacing);
          const proteinHeight = yMax > 0 ? chartHeight * (d.proteinKcal / yMax) : 0;
          const carbsHeight = yMax > 0 ? chartHeight * (d.carbsKcal / yMax) : 0;
          const fatHeight = yMax > 0 ? chartHeight * (d.fatKcal / yMax) : 0;

          const proteinY = chartHeight + margin.top - proteinHeight;
          const carbsY = proteinY - carbsHeight;
          const fatY = carbsY - fatHeight;

          const textX = barWidth / 2;
          const textColor = 'white';
          const textSize = '10px';

          return (
            <g key={d.date} transform={`translate(${x}, 0)`}>
              <title>{`${d.date}\nTotal: ${d.totalKcal.toFixed(0)} kcal\nP: ${d.protein}g, G: ${d.carbs}g, L: ${d.fat}g`}</title>
              {/* Bars */}
              <rect y={proteinY} width={barWidth} height={proteinHeight} fill="#ef4444" />
              <rect y={carbsY} width={barWidth} height={carbsHeight} fill="#10b981" />
              <rect y={fatY} width={barWidth} height={fatHeight} fill="#facc15" />

              {/* Calorie text inside bars */}
              {proteinHeight > 12 && (
                <text
                  x={textX}
                  y={proteinY + proteinHeight / 2}
                  dy="0.35em"
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={textSize}
                  fontWeight="bold"
                >
                  {Math.round(d.proteinKcal)}
                </text>
              )}
              {carbsHeight > 12 && (
                <text
                  x={textX}
                  y={carbsY + carbsHeight / 2}
                  dy="0.35em"
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={textSize}
                  fontWeight="bold"
                >
                  {Math.round(d.carbsKcal)}
                </text>
              )}
              {fatHeight > 12 && (
                <text
                  x={textX}
                  y={fatY + fatHeight / 2}
                  dy="0.35em"
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={textSize}
                  fontWeight="bold"
                >
                  {Math.round(d.fatKcal)}
                </text>
              )}

              {/* Date label below bar */}
              <text
                x={barWidth / 2}
                y={svgHeight - margin.bottom + 15}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="text-gray-600"
              >
                {d.date.substring(0, 5)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center items-center gap-4 text-xs mt-2">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-[#ef4444] rounded-sm"></span> Protéines
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-[#10b981] rounded-sm"></span> Glucides
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-[#facc15] rounded-sm"></span> Lipides
        </div>
      </div>
    </div>
  );
};

export default MacroStackedBarChart;
