import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Activity {
  id: string;
  type: 'workout' | 'nutrition' | 'message' | 'achievement';
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
}

interface ActivityCardProps {
  activities: Activity[];
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activities }) => {
  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'workout':
        return 'text-violet-400 bg-violet-600/20';
      case 'nutrition':
        return 'text-green-400 bg-green-600/20';
      case 'message':
        return 'text-blue-400 bg-blue-600/20';
      case 'achievement':
        return 'text-orange-400 bg-orange-600/20';
      default:
        return 'text-gray-400 bg-gray-600/20';
    }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Activité récente</h3>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          const colorClass = getActivityColor(activity.type);
          
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-xl bg-black/20 p-4 transition-all hover:bg-black/30"
            >
              <div className={`rounded-lg p-2 ${colorClass}`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-1">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-400 mb-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
