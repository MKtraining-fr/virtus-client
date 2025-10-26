import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { COACH_NAV_ITEMS as NAV_ITEMS } from '../constants/navigation';
import { ChevronDownIcon } from '../constants/icons';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(
    NAV_ITEMS.filter(
      (item) => location.pathname.startsWith(item.path) && item.subItems.length > 0
    ).map((item) => item.name)
  );

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const isSubItemActive = (path: string) => location.pathname === path;

  // Assuming SubItem is defined in constants/navigation.ts or similar
  // For now, let's use a generic array of objects
  const isParentActive = (parentPath: string, subItems: { path: string }[]) => {
    if (subItems.length === 0) {
      return location.pathname === parentPath;
    }
    return location.pathname.startsWith(parentPath) && parentPath !== '/app';
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 text-2xl font-bold text-center border-b border-gray-700">VIRTUS</div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <div key={item.name}>
            {item.subItems.length === 0 ? (
              <NavLink
                to={item.path}
                end // Important for exact match on parent links like Dashboard
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-white' : 'hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="w-6 h-6" />
                <span>{item.name}</span>
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
      <div className="p-4 border-t border-gray-700">{/* Footer or user info can go here */}</div>
    </>
  );

  return (
    <>
      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar-bg text-white rounded-lg shadow-lg"
        aria-label="Menu"
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <div className="hidden md:flex w-64 bg-sidebar-bg text-white flex-col">
        <SidebarContent />
      </div>

      {/* Sidebar Mobile (slide-in) */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-sidebar-bg text-white flex flex-col z-40 transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
