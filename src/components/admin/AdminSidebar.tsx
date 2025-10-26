import React from 'react';
import { NavLink } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '../../constants/navigation.ts';

const AdminSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-dark-gray text-white flex flex-col">
      <div className="p-6 text-2xl font-bold text-center border-b border-gray-700">
        VIRTUS
        <span className="text-sm font-normal text-primary block tracking-wider">ADMIN</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {ADMIN_NAV_ITEMS.map((item) => (
          <div key={item.name}>
            <NavLink
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-primary text-white' : 'hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              <span>{item.name}</span>
            </NavLink>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
