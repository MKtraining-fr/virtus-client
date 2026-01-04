import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Search } from 'lucide-react';
import { MUSCLES, MUSCLE_GROUPS, getMuscleById, MuscleDefinition, MuscleGroup } from '../../data/muscleConfig';

export type ViewType = 'anterior' | 'posterior';

interface AnatomyViewerProps {
  onMuscleSelect?: (muscle: MuscleDefinition) => void;
  selectedMuscleIds?: string[];
  highlightColor?: string;
  isMobile?: boolean;
  highlightList?: boolean;
}

// Styles CSS pour la scrollbar visible
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`;

const AnatomyViewer: React.FC<AnatomyViewerProps> = ({
  onMuscleSelect,
  selectedMuscleIds = [],
  highlightColor = '#ef4444',
  isMobile = false,
  highlightList = false
}) => {
  const [view, setView] = useState<ViewType>('anterior');
  const [zoom, setZoom] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleView = () => {
    setView(prev => prev === 'anterior' ? 'posterior' : 'anterior');
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const handleMuscleClick = (muscle: MuscleDefinition) => {
    if (onMuscleSelect) {
      onMuscleSelect(muscle);
    }
  };

  // Changer automatiquement de vue au survol d'un muscle
  const handleMuscleHover = (muscleId: string | null) => {
    setHoveredMuscle(muscleId);
    if (muscleId) {
      const muscle = getMuscleById(muscleId);
      // Basculer vers la vue préférée du muscle (anterior ou posterior)
      // Si le muscle n'a pas de preferredView, on utilise 'anterior' par défaut
      const targetView = muscle?.preferredView || 'anterior';
      if (targetView !== view) {
        setView(targetView);
      }
    }
  };

  // Filtrer les muscles par recherche
  const filteredMuscles = MUSCLES.filter(muscle => {
    const matchesSearch = searchQuery === '' || 
      muscle.nameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      muscle.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === null || muscle.group === selectedGroup;
    return matchesSearch && matchesGroup && muscle.id !== 'full_body';
  });

  // Chemins directs pour le corps entier
  const fullBodySvgAnt = '/anatomy/muscles/full_body_ant.svg';
  const fullBodySvgPost = '/anatomy/muscles/full_body_post.svg';

  // Obtenir le SVG du muscle survolé ou sélectionné
  const getMuscleSvgPath = (muscleId: string): string | null => {
    const muscle = getMuscleById(muscleId);
    if (!muscle) return null;
    return view === 'anterior' ? muscle.svgAnt : muscle.svgPost;
  };

  // Muscles à afficher en surbrillance (survolé + sélectionnés)
  const musclesToHighlight = new Set<string>();
  if (hoveredMuscle) musclesToHighlight.add(hoveredMuscle);
  selectedMuscleIds.forEach(id => musclesToHighlight.add(id));

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="flex h-full w-full">
      {/* Panneau de sélection des muscles - à gauche (caché sur mobile) */}
      <div className={`${isMobile ? 'hidden md:flex' : 'flex'} w-56 bg-white border-r border-gray-200 flex-col flex-shrink-0`} style={{ maxHeight: '100%' }}>
        {/* Recherche */}
        <div className="p-2 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un muscle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filtres par groupe */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                selectedGroup === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            {MUSCLE_GROUPS.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  selectedGroup === group.id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedGroup === group.id ? { backgroundColor: group.color } : {}}
              >
                {group.nameFr}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des muscles avec scrollbar visible - hauteur limitée */}
        <div 
          className={`overflow-y-scroll p-2 custom-scrollbar transition-all duration-500 ${highlightList ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset' : ''}`}
          style={{ 
            scrollbarWidth: 'thin', 
            scrollbarColor: '#94a3b8 #e2e8f0',
            maxHeight: '350px',
            minHeight: '200px'
          }}
        >
          <div className="space-y-1">
            {filteredMuscles.map(muscle => {
              const group = MUSCLE_GROUPS.find(g => g.id === muscle.group);
              const isSelected = selectedMuscleIds.includes(muscle.id);
              const isHovered = hoveredMuscle === muscle.id;
              
              return (
                <button
                  key={muscle.id}
                  onClick={() => handleMuscleClick(muscle)}
                  onMouseEnter={() => handleMuscleHover(muscle.id)}
                  onMouseLeave={() => handleMuscleHover(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500'
                      : isHovered
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group?.color || '#gray' }}
                    />
                    <span className="font-medium">{muscle.nameFr}</span>
                  </div>
                  {muscle.subGroup && (
                    <span className="text-xs text-gray-500 ml-4">
                      {muscle.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zone de visualisation principale */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Barre d'outils supérieure - adaptée mobile */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-2 md:p-3 bg-white border-b border-gray-200 flex-shrink-0 gap-2">
          {/* Recherche sur mobile uniquement */}
          {isMobile && (
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un muscle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between w-full">
            <button
              onClick={toggleView}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {view === 'anterior' ? (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden sm:inline">Vue de </span>face
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Vue de </span>dos
                </>
              )}
            </button>
            
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={handleZoomOut}
                className="p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <span className="text-xs md:text-sm text-gray-500 min-w-[40px] md:min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={resetZoom}
                className="p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Réinitialiser le zoom"
              >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Liste des muscles filtrés sur mobile */}
        {isMobile && searchQuery && filteredMuscles.length > 0 && (
          <div className="md:hidden bg-white border-b border-gray-200 max-h-40 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredMuscles.slice(0, 5).map(muscle => {
                const group = MUSCLE_GROUPS.find(g => g.id === muscle.group);
                const isSelected = selectedMuscleIds.includes(muscle.id);
                return (
                  <button
                    key={muscle.id}
                    onClick={() => {
                      handleMuscleClick(muscle);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group?.color || '#gray' }}
                      />
                      <span className="font-medium">{muscle.nameFr}</span>
                    </div>
                  </button>
                );
              })}
              {filteredMuscles.length > 5 && (
                <p className="text-xs text-gray-500 text-center py-1">
                  +{filteredMuscles.length - 5} autres résultats
                </p>
              )}
            </div>
          </div>
        )}

        {/* Zone d'affichage du corps humain */}
        <div 
          className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-2"
        >
          <div
            ref={containerRef}
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
              width: isMobile ? '180px' : '220px',
              height: isMobile ? '360px' : '450px',
            }}
          >
            {/* Corps entier comme base */}
            <img
              src={view === 'anterior' ? fullBodySvgAnt : fullBodySvgPost}
              alt="Corps humain"
              className="absolute top-0 left-0 w-full h-full object-contain"
              style={{ opacity: 0.4 }}
              onError={(e) => {
                console.error('Erreur chargement SVG base:', e);
              }}
              onLoad={() => console.log('SVG base chargé avec succès')}
            />
            
            {/* Zones cliquables interactives sur le corps - viewBox adapté au SVG original 587x1137 */}
            <svg
              className="absolute top-0 left-0 w-full h-full"
              viewBox="0 0 587 1137"
              style={{ cursor: 'pointer' }}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Épaules - Deltoïdes gauche */}
              <ellipse
                cx="170" cy="235" rx="55" ry="50"
                fill="rgba(239, 68, 68, 0.15)"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="2"
                className="hover:fill-red-500 hover:fill-opacity-30 transition-all cursor-pointer"
                onClick={() => {
                  const muscle = getMuscleById('deltoid_anterior');
                  if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                }}
                onMouseEnter={() => setHoveredMuscle('deltoid_anterior')}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              {/* Épaules - Deltoïdes droit */}
              <ellipse
                cx="417" cy="235" rx="55" ry="50"
                fill="rgba(239, 68, 68, 0.15)"
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="2"
                className="hover:fill-red-500 hover:fill-opacity-30 transition-all cursor-pointer"
                onClick={() => {
                  const muscle = getMuscleById('deltoid_anterior');
                  if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                }}
                onMouseEnter={() => setHoveredMuscle('deltoid_anterior')}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              
              {/* Pectoraux */}
              {view === 'anterior' && (
                <>
                  <ellipse
                    cx="240" cy="290" rx="55" ry="45"
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="rgba(59, 130, 246, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-blue-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('pectoralis_major');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('pectoralis_major')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                  <ellipse
                    cx="347" cy="290" rx="55" ry="45"
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="rgba(59, 130, 246, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-blue-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('pectoralis_major');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('pectoralis_major')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                </>
              )}
              
              {/* Dos - Trapèze et Grand dorsal */}
              {view === 'posterior' && (
                <>
                  {/* Trapèze */}
                  <polygon
                    points="220,180 367,180 400,260 293,310 187,260"
                    fill="rgba(168, 85, 247, 0.15)"
                    stroke="rgba(168, 85, 247, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-purple-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('trapezius_upper');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('trapezius_upper')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                  {/* Grand dorsal */}
                  <polygon
                    points="187,310 220,450 293,480 367,450 400,310 350,370 293,380 237,370"
                    fill="rgba(34, 197, 94, 0.15)"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-green-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('latissimus_dorsi');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('latissimus_dorsi')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                </>
              )}
              
              {/* Biceps gauche */}
              <ellipse
                cx="125" cy="370" rx="30" ry="60"
                fill="rgba(249, 115, 22, 0.15)"
                stroke="rgba(249, 115, 22, 0.4)"
                strokeWidth="2"
                className="hover:fill-orange-500 hover:fill-opacity-30 transition-all cursor-pointer"
                onClick={() => {
                  const muscle = getMuscleById('biceps');
                  if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                }}
                onMouseEnter={() => setHoveredMuscle('biceps')}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              {/* Biceps droit */}
              <ellipse
                cx="462" cy="370" rx="30" ry="60"
                fill="rgba(249, 115, 22, 0.15)"
                stroke="rgba(249, 115, 22, 0.4)"
                strokeWidth="2"
                className="hover:fill-orange-500 hover:fill-opacity-30 transition-all cursor-pointer"
                onClick={() => {
                  const muscle = getMuscleById('biceps');
                  if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                }}
                onMouseEnter={() => setHoveredMuscle('biceps')}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              
              {/* Abdominaux */}
              {view === 'anterior' && (
                <rect
                  x="253" y="365" width="80" height="130"
                  rx="10"
                  fill="rgba(236, 72, 153, 0.15)"
                  stroke="rgba(236, 72, 153, 0.4)"
                  strokeWidth="2"
                  className="hover:fill-pink-500 hover:fill-opacity-30 transition-all cursor-pointer"
                  onClick={() => {
                    const muscle = getMuscleById('rectus_abdominis');
                    if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                  }}
                  onMouseEnter={() => setHoveredMuscle('rectus_abdominis')}
                  onMouseLeave={() => setHoveredMuscle(null)}
                />
              )}
              
              {/* Fessiers */}
              {view === 'posterior' && (
                <>
                  <ellipse
                    cx="240" cy="545" rx="55" ry="60"
                    fill="rgba(139, 92, 246, 0.15)"
                    stroke="rgba(139, 92, 246, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-violet-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('gluteus_maximus');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('gluteus_maximus')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                  <ellipse
                    cx="347" cy="545" rx="55" ry="60"
                    fill="rgba(139, 92, 246, 0.15)"
                    stroke="rgba(139, 92, 246, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-violet-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('gluteus_maximus');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('gluteus_maximus')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                </>
              )}
              
              {/* Quadriceps */}
              {view === 'anterior' && (
                <>
                  <ellipse
                    cx="225" cy="700" rx="45" ry="110"
                    fill="rgba(14, 165, 233, 0.15)"
                    stroke="rgba(14, 165, 233, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-sky-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('quadriceps');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('quadriceps')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                  <ellipse
                    cx="362" cy="700" rx="45" ry="110"
                    fill="rgba(14, 165, 233, 0.15)"
                    stroke="rgba(14, 165, 233, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-sky-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('quadriceps');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('quadriceps')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                </>
              )}
              
              {/* Ischio-jambiers */}
              {view === 'posterior' && (
                <>
                  <ellipse
                    cx="225" cy="720" rx="40" ry="100"
                    fill="rgba(20, 184, 166, 0.15)"
                    stroke="rgba(20, 184, 166, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-teal-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('hamstrings');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('hamstrings')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                  <ellipse
                    cx="362" cy="720" rx="40" ry="100"
                    fill="rgba(20, 184, 166, 0.15)"
                    stroke="rgba(20, 184, 166, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-teal-500 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('hamstrings');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('hamstrings')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                </>
              )}
              
              {/* Mollets */}
              <ellipse
                cx="215" cy="950" rx="30" ry="75"
                fill="rgba(244, 63, 94, 0.15)"
                stroke="rgba(244, 63, 94, 0.4)"
                strokeWidth="2"
                className="hover:fill-rose-500 hover:fill-opacity-30 transition-all cursor-pointer"
                onClick={() => {
                  const muscle = getMuscleById('gastrocnemius');
                  if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                }}
                onMouseEnter={() => setHoveredMuscle('gastrocnemius')}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              <ellipse
                cx="372" cy="950" rx="30" ry="75"
                fill="rgba(244, 63, 94, 0.15)"
                stroke="rgba(244, 63, 94, 0.4)"
                strokeWidth="2"
                className="hover:fill-rose-500 hover:fill-opacity-30 transition-all cursor-pointer"
                onClick={() => {
                  const muscle = getMuscleById('gastrocnemius');
                  if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                }}
                onMouseEnter={() => setHoveredMuscle('gastrocnemius')}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              
              {/* Avant-bras gauche */}
              <ellipse
                cx="95" cy="490" rx="25" ry="65"
                fill="rgba(251, 191, 36, 0.15)"
                stroke="rgba(251, 191, 36, 0.4)"
                strokeWidth="2"
                className="hover:fill-amber-500 hover:fill-opacity-30 transition-all cursor-pointer"
                onClick={() => {
                  const muscle = getMuscleById('forearm');
                  if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                }}
                onMouseEnter={() => setHoveredMuscle('forearm')}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              {/* Avant-bras droit */}
              <ellipse
                cx="492" cy="490" rx="25" ry="65"
                fill="rgba(251, 191, 36, 0.15)"
                stroke="rgba(251, 191, 36, 0.4)"
                strokeWidth="2"
                className="hover:fill-amber-500 hover:fill-opacity-30 transition-all cursor-pointer"
                onClick={() => {
                  const muscle = getMuscleById('forearm');
                  if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                }}
                onMouseEnter={() => setHoveredMuscle('forearm')}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              
              {/* Triceps (vue postérieure) */}
              {view === 'posterior' && (
                <>
                  <ellipse
                    cx="125" cy="370" rx="28" ry="55"
                    fill="rgba(234, 88, 12, 0.15)"
                    stroke="rgba(234, 88, 12, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-orange-600 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('triceps');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('triceps')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                  <ellipse
                    cx="462" cy="370" rx="28" ry="55"
                    fill="rgba(234, 88, 12, 0.15)"
                    stroke="rgba(234, 88, 12, 0.4)"
                    strokeWidth="2"
                    className="hover:fill-orange-600 hover:fill-opacity-30 transition-all cursor-pointer"
                    onClick={() => {
                      const muscle = getMuscleById('triceps');
                      if (muscle && onMuscleSelect) onMuscleSelect(muscle);
                    }}
                    onMouseEnter={() => setHoveredMuscle('triceps')}
                    onMouseLeave={() => setHoveredMuscle(null)}
                  />
                </>
              )}
            </svg>
            
            {/* Superposition des muscles survolés et sélectionnés */}
            {Array.from(musclesToHighlight).map(muscleId => {
              const svgPath = getMuscleSvgPath(muscleId);
              if (!svgPath) return null;
              
              const isHovered = hoveredMuscle === muscleId;
              const isSelected = selectedMuscleIds.includes(muscleId);
              
              return (
                <img
                  key={`highlight-${muscleId}-${view}`}
                  src={svgPath}
                  alt={getMuscleById(muscleId)?.nameFr || muscleId}
                  className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    opacity: isSelected ? 1 : isHovered ? 0.8 : 0.6,
                    filter: isSelected 
                      ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.8))' 
                      : isHovered 
                      ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))'
                      : 'none',
                    transition: 'opacity 0.2s ease-out, filter 0.2s ease-out',
                  }}
                  onError={(e) => {
                    console.error(`Erreur chargement SVG muscle ${muscleId}:`, svgPath);
                  }}
                  onLoad={() => console.log(`SVG muscle ${muscleId} chargé:`, svgPath)}
                />
              );
            })}
          </div>
        </div>

        {/* Info sur le muscle survolé */}
        {hoveredMuscle && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 z-50">
            <p className="text-sm font-medium text-gray-800">
              {getMuscleById(hoveredMuscle)?.nameFr}
            </p>
            <p className="text-xs text-gray-500">
              Cliquez pour sélectionner
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default AnatomyViewer;
