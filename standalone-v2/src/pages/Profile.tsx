import { User, Mail, Phone, Calendar, Settings, LogOut, ChevronRight } from 'lucide-react';

const Profile = () => {
  const profileData = {
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33 6 12 34 56 78',
    memberSince: 'Janvier 2024',
    coach: 'Marc Martin',
  };

  const stats = [
    { label: 'Entraînements', value: '47', color: 'violet' },
    { label: 'Jours actifs', value: '32', color: 'orange' },
    { label: 'Records', value: '12', color: 'green' },
  ];

  const menuItems = [
    { icon: Settings, label: 'Paramètres', action: 'settings' },
    { icon: User, label: 'Mon coach', action: 'coach' },
    { icon: Calendar, label: 'Abonnement', action: 'subscription' },
    { icon: LogOut, label: 'Déconnexion', action: 'logout', danger: true },
  ];

  const colorClasses = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-600/30',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-600/30',
    green: 'from-green-600/20 to-green-600/5 border-green-600/30',
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Carte profil */}
      <div className="bg-gradient-to-br from-[#6D5DD3] to-[#8B7DE8] rounded-xl p-5 shadow-xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <User size={32} className="text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-white text-xl font-bold mb-1">{profileData.name}</h2>
            <p className="text-white/80 text-xs">Membre depuis {profileData.memberSince}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <Mail size={14} />
            <span>{profileData.email}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <Phone size={14} />
            <span>{profileData.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <User size={14} />
            <span>Coach: {profileData.coach}</span>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={\`rounded-lg border bg-gradient-to-br p-3 \${colorClasses[stat.color as keyof typeof colorClasses]}\`}
          >
            <p className="text-2xl font-bold text-white mb-0.5">{stat.value}</p>
            <p className="text-[9px] text-gray-400 uppercase font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/20 overflow-hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.action}
              className={\`w-full flex items-center justify-between p-4 transition-all active:bg-black/30 \${
                index !== menuItems.length - 1 ? 'border-b border-gray-800' : ''
              } \${item.danger ? 'text-red-400' : 'text-white'}\`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={2.5} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </button>
          );
        })}
      </div>

      {/* Version */}
      <div className="text-center">
        <p className="text-gray-500 text-[10px]">Virtus Client v2.0.0</p>
        <p className="text-gray-600 text-[9px] mt-0.5">© 2024 MK Training</p>
      </div>
    </div>
  );
};

export default Profile;
