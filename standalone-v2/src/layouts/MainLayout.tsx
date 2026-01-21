import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Apple, BookOpen, User } from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/client/v2/dashboard', icon: Home, label: 'Accueil' },
    { path: '/client/v2/training', icon: Dumbbell, label: 'Entraînement' },
    { path: '/client/v2/nutrition', icon: Apple, label: 'Nutrition' },
    { path: '/client/v2/library', icon: BookOpen, label: 'Bibliothèque' },
    { path: '/client/v2/profile', icon: User, label: 'Profil' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Trouver le titre de la page actuelle
  const currentPage = navItems.find(item => item.path === location.pathname);
  const pageTitle = currentPage?.label || 'Virtus';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Mobile - Fixed */}
      <header className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border-b border-gray-800 px-4 py-3 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#6D5DD3] to-[#8B7DE8] bg-clip-text text-transparent">
            {pageTitle}
          </h1>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6D5DD3] to-[#8B7DE8] flex items-center justify-center shadow-lg">
            <User size={18} className="text-white" />
          </div>
        </div>
      </header>

      {/* Main Content - Avec padding pour header et bottom nav */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation - Fixed */}
      <nav className="bg-gradient-to-t from-[#1a1a1a] to-[#0f0f0f] border-t border-gray-800 fixed bottom-0 left-0 right-0 z-50 shadow-2xl">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${
                  active 
                    ? 'bg-gradient-to-br from-[#6D5DD3] to-[#8B7DE8] text-white shadow-lg scale-105' 
                    : 'text-gray-400 active:scale-95'
                }`}
              >
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
