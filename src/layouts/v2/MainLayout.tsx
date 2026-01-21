import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Apple, BookOpen, MessageCircle, ShoppingBag, User } from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/client/v2/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/client/v2/training', icon: Dumbbell, label: 'Entraînement' },
    { path: '/client/v2/nutrition', icon: Apple, label: 'Nutrition' },
    { path: '/client/v2/library', icon: BookOpen, label: 'Bibliothèque' },
    { path: '/client/v2/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/client/v2/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/client/v2/profile', icon: User, label: 'Profil' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">VIRTUS</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Client Name</span>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-[#1a1a1a] border-r border-gray-800 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-[#1a1a1a] border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 ${
                  active ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
