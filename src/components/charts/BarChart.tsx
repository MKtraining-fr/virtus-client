import React from 'react';

interface GroupedChartData {
  label: string;
  [key: string]: number | string;
}

interface BarChartProps {
  data: GroupedChartData[];
  title: string;
  keys: string[];
  colors: { [key: string]: string };
  labels: { [key: string]: string };
}

const BarChart: React.FC<BarChartProps> = ({ data, title, keys, colors, labels }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Données insuffisantes pour afficher le graphique.</p>
      </div>
    );
  }

  const maxValue = Math.max(0, ...data.flatMap(d => keys.map(key => Number(d[key]))));
  const topValue = maxValue > 0 ? Math.ceil(maxValue / 4) * 4 : 4;


  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="flex items-end space-x-2 md:space-x-4 h-64 bg-gray-50 p-4 rounded-lg">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div className="w-full flex justify-center items-end h-full gap-1">
                 {keys.map(key => (
                    <div
                        key={key}
                        className="w-full rounded-t-md transition-colors"
                        style={{ 
                            height: `${(Number(item[key]) / (topValue || 1)) * 100}%`,
                            backgroundColor: colors[key]
                        }}
                        title={`${labels[key]}: ${item[key]}`}
                    >
                         <div className="text-white text-xs font-bold text-center pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item[key]}
                        </div>
                    </div>
                 ))}
            </div>
            <p className="text-xs text-gray-600 mt-2 font-medium">{item.label}</p>
          </div>
        ))}
      </div>
       <div className="flex justify-center items-center gap-6 mt-4 text-xs">
            {keys.map(key => (
                <div key={key} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: colors[key] }}></span>
                    <span>{labels[key]}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default BarChart;
