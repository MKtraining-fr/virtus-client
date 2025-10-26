import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { COACH_NAV_ITEMS } from '../../constants/navigation.ts';
import { useAuth } from '../../context/AuthContext';
import { ChevronDownIcon } from '../../constants/icons.ts';

const CoachSidebar: React.FC = () => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { user, messages } = useAuth();
  
  const hasUnreadMessages = useMemo(() => {
    if (!user) return false;
    // An unread message is one sent by a client (not the coach) that the coach hasn't seen.
    return messages.some(msg => msg.senderId !== user.id && !msg.seenByCoach);
  }, [messages, user]);

  useEffect(() => {
    const activeParent = COACH_NAV_ITEMS.find(item => item.subItems.length > 0 && location.pathname.startsWith(item.path));
    if (activeParent && !openMenus.includes(activeParent.name)) {
        setOpenMenus(prev => [...prev, activeParent.name]);
    }
  }, [location.pathname, openMenus]);


  const toggleMenu = (name: string) => {
    setOpenMenus(prev => prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]);
  };

  const isSubItemActive = (path: string) => location.pathname === path;
  
  // Assuming SubItem is defined in constants/navigation.ts or similar
  // For now, let's use a generic array of objects
  const isParentActive = (parentPath: string, subItems: { path: string }[]) => {
      if (subItems.length === 0) {
          return location.pathname === parentPath;
      }
      return location.pathname.startsWith(parentPath);
  }

  return (
    <div className="w-64 bg-sidebar-bg text-white flex flex-col">
      <div className="p-6 text-2xl font-bold text-center border-b border-gray-700">
        VIRTUS
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {COACH_NAV_ITEMS.map((item) => (
          <div key={item.name}>
            {item.subItems.length === 0 ? (
              <NavLink
                to={item.path}
                end={item.path === '/app'} // Important for exact match on parent links like Dashboard
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-white' : 'hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="w-6 h-6" />
                <span className="flex-grow">{item.name}</span>
                {item.name === 'Messagerie' && hasUnreadMessages && (
                    <span className="w-2.5 h-2.5 bg-primary rounded-full" title="Nouveaux messages non lus"></span>
                )}
              </NavLink>
            ) : (
              <div>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center justify-between space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    isParentActive(item.path, item.subItems) ? 'bg-gray-600' : ''
                  } hover:bg-gray-700`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-6 h-6" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform ${
                      openMenus.includes(item.name) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openMenus.includes(item.name) && (
                  <div className="pl-8 pt-2 space-y-2">
                    {item.subItems.map((subItem) => (
                      <NavLink
                        key={subItem.name}
                        to={subItem.path}
                        className={() =>
                          `block px-4 py-2 rounded-lg text-sm transition-colors ${
                            isSubItemActive(subItem.path)
                              ? 'text-primary font-semibold'
                              : 'hover:text-primary'
                          }`
                        }
                      >
                        {subItem.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        {/* Footer or user info can go here */}
      </div>
    </div>
  );
};

export default CoachSidebar;