import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'violet' | 'orange' | 'green' | 'blue';
  path: string;
}

interface QuickActionCardProps {
  actions: QuickAction[];
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ actions }) => {
  const navigate = useNavigate();

  const colorClasses = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-600/30 text-violet-400',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-600/30 text-orange-400',
    green: 'from-green-600/20 to-green-600/5 border-green-600/30 text-green-400',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-600/30 text-blue-400',
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Actions rapides</h3>
      
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          const colorClass = colorClasses[action.color];
          
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border bg-gradient-to-br p-4 transition-all active:scale-95 ${colorClass}`}
            >
              <Icon size={24} strokeWidth={2.5} />
              <div className="text-center">
                <p className="text-xs font-bold text-white leading-tight mb-0.5">
                  {action.title}
                </p>
                <p className="text-[9px] text-gray-400">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
