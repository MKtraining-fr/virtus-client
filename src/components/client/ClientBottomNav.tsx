import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CLIENT_NAV_ITEMS } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';

const ClientBottomNav: React.FC = () => {
  const { user, messages } = useAuth();

  const hasNewMessage = useMemo(() => {
    if (!user || !user.coachId) return false;
    // Any message from the coach that the client hasn't seen
    return messages.some(
      (m) => m.clientId === user.id && m.senderId === user.coachId && !m.seenByClient
    );
  }, [user, messages]);

  const visibleNavItems = useMemo(() => {
    if (!user) return CLIENT_NAV_ITEMS;
    const canAccessShop =
      (user.shopAccess?.adminShop ?? true) || (user.shopAccess?.coachShop ?? true);
    if (!canAccessShop) {
      return CLIENT_NAV_ITEMS.filter((item) => item.name !== 'Boutique');
    }
    return CLIENT_NAV_ITEMS;
  }, [user]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-client-card border-t border-gray-200 dark:border-gray-700 h-16 flex justify-around items-center z-20">
      {visibleNavItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center space-y-1 w-full transition-colors duration-200 ${
              isActive
                ? 'text-primary'
                : 'text-gray-500 dark:text-client-subtle hover:text-gray-800 dark:hover:text-client-light'
            }`
          }
        >
          <div className="relative">
            <item.icon className="w-6 h-6" />
            {item.name === 'Messagerie' && hasNewMessage && (
              <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-client-card"></span>
            )}
          </div>
          <span className="text-xs font-medium">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default ClientBottomNav;
