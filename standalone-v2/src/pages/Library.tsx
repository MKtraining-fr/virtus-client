import { BookOpen, Video, FileText, Dumbbell } from 'lucide-react';

const Library = () => {
  const resources = [
    {
      id: 1,
      type: 'video',
      title: 'Technique du Squat',
      duration: '8:45',
      category: 'Exercices',
      thumbnail: '🎥',
    },
    {
      id: 2,
      type: 'article',
      title: 'Guide de la nutrition sportive',
      readTime: '12 min',
      category: 'Nutrition',
      thumbnail: '📄',
    },
    {
      id: 3,
      type: 'video',
      title: 'Échauffement complet',
      duration: '15:00',
      category: 'Entraînement',
      thumbnail: '🎥',
    },
    {
      id: 4,
      type: 'program',
      title: 'Programme Push/Pull/Legs',
      weeks: '12 semaines',
      category: 'Programmes',
      thumbnail: '📋',
    },
  ];

  const categories = [
    { name: 'Exercices', icon: Dumbbell, count: 45, color: 'violet' },
    { name: 'Nutrition', icon: BookOpen, count: 28, color: 'green' },
    { name: 'Vidéos', icon: Video, count: 67, color: 'orange' },
    { name: 'Articles', icon: FileText, count: 34, color: 'blue' },
  ];

  const colorClasses = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-600/30 text-violet-400',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-600/30 text-orange-400',
    green: 'from-green-600/20 to-green-600/5 border-green-600/30 text-green-400',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-600/30 text-blue-400',
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.name}
              className={`rounded-lg border bg-gradient-to-br p-3 transition-all active:scale-95 ${colorClasses[cat.color as keyof typeof colorClasses]}`}
            >
              <Icon size={20} strokeWidth={2.5} className="mb-2" />
              <p className="text-white text-sm font-bold leading-tight mb-0.5">{cat.name}</p>
              <p className="text-[9px] text-gray-400">{cat.count} ressources</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-white" strokeWidth={2.5} />
          <h3 className="text-white text-sm font-semibold">Ressources récentes</h3>
        </div>
        <div className="space-y-2">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-black/20 rounded-lg p-3 active:bg-black/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{resource.thumbnail}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold leading-tight mb-1">
                    {resource.title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-gray-400">{resource.category}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500">
                      {resource.duration || resource.readTime || resource.weeks}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-600/30 bg-gradient-to-br from-blue-600/10 to-blue-600/5 p-4 text-center">
        <p className="text-blue-400 text-xs font-medium">
          📚 Bibliothèque complète à venir
        </p>
        <p className="text-gray-500 text-[10px] mt-1">
          Vidéos, articles, programmes et guides d'exercices
        </p>
      </div>
    </div>
  );
};

export default Library;
