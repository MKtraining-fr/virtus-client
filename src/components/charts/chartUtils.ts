import React from 'react';

export const renderAxes = (width: number, height: number, margin: { top: number, right: number, bottom: number, left: number }, yMin: number, yMax: number, data: { date: string }[], yUnit: string, xUnit: string) => {
    const yTickCount = 5;
    const yTicks: number[] = [];
    if (yMax > yMin) {
        const tickStep = (yMax - yMin) / (yTickCount - 1);
        for (let i = 0; i < yTickCount; i++) {
            yTicks.push(yMin + i * tickStep);
        }
    } else {
        yTicks.push(yMin);
    }
    
    const yAxisElements = yTicks.map((tick, i) => {
        let yValue = height - margin.bottom;
        if (yMax > yMin) {
            yValue = margin.top + (height - margin.top - margin.bottom) * (1 - (tick - yMin) / (yMax - yMin));
        }
        return React.createElement('g', { key: `y-tick-${i}`, className: "text-gray-400 dark:text-gray-400" },
            React.createElement('line', { x1: margin.left, x2: width - margin.right, y1: yValue, y2: yValue, stroke: "currentColor", strokeWidth: "0.5", strokeDasharray: "2,2" }),
            React.createElement('text', { x: margin.left - 8, y: yValue, dy: "0.32em", textAnchor: "end", fontSize: "10", fill: "currentColor" }, Math.round(tick))
        );
    });

    const xAxisElements = data.map((d, i) => {
        const x = margin.left + (i / (data.length - 1)) * (width - margin.left - margin.right);
        if (i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) {
            return React.createElement('g', { key: `x-tick-${i}`, className: "text-gray-500 dark:text-gray-400" },
                React.createElement('text', { x: x, y: height - margin.bottom + 15, textAnchor: "middle", fontSize: "10" }, d.date)
            )
        }
        return null;
    }).filter(Boolean);

    const yAxisLabel = React.createElement('text', { transform: `translate(${margin.left / 3}, ${height / 2}) rotate(-90)`, textAnchor: "middle", fontSize: "10", fill: "currentColor", className: "font-semibold" }, yUnit);
    const xAxisLabel = React.createElement('text', { x: width / 2, y: height - margin.bottom + 28, textAnchor: "middle", fontSize: "10", fill: "currentColor", className: "font-semibold" }, xUnit);

    return React.createElement(React.Fragment, null, ...yAxisElements, yAxisLabel, ...xAxisElements, xAxisLabel);
};