import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import Button from './Button.tsx';
import ImpersonationModal from './ImpersonationModal.tsx';
import { useNavigate } from 'react-router-dom';

const BellIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
);

const ArrowLeftOnRectangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
);


const Header: React.FC = () => {
  const { user, logout, originalUser, notifications, setNotifications } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = useState(false);
  const [roleToImpersonate, setRoleToImpersonate] = useState<'coach' | 'client'>('client');
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return notifications.filter(n => n.userId === user.id && !n.isRead).length;
  }, [notifications, user]);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications
      .filter(n => n.userId === user.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, user]);

  const handleNotificationToggle = () => {
    setIsNotificationOpen(prev => !prev);
  };

  useEffect(() => {
    // This effect ensures that when the notification panel is opened,
    // we mark the visible notifications as read.
    // This declarative approach is more robust against potential timing issues with state updates.
    if (isNotificationOpen && unreadCount > 0) {
      const updatedNotifications = notifications.map(n => 
        (n.userId === user?.id && !n.isRead) ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);
    }
  }, [isNotificationOpen, unreadCount, user, notifications, setNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setIsNotificationOpen(false);
        }
    };
    if (isNotificationOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  if (!user) return null;

  const handleOpenImpersonateModal = (role: 'coach' | 'client') => {
    setRoleToImpersonate(role);
    setIsImpersonationModalOpen(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-20 relative">
        <div>
          {user.role === 'admin' && !originalUser && (
              <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleOpenImpersonateModal('coach')}>
                      Vue Coach
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleOpenImpersonateModal('client')}>
                      Vue Client
                  </Button>
              </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative" ref={notificationRef}>
            <button onClick={handleNotificationToggle} className="relative text-gray-500 hover:text-gray-700">
              <BellIcon className="w-6 h-6"/>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
              )}
            </button>
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                <div className="p-3 font-semibold border-b">Notifications</div>
                <ul className="max-h-96 overflow-y-auto">
                  {userNotifications.length > 0 ? (
                    userNotifications.map(n => (
                      <li key={n.id}>
                        <button onClick={() => { navigate(n.link); setIsNotificationOpen(false); }} className="w-full text-left p-3 text-sm hover:bg-gray-100">
                          <p><strong>{n.fromName}</strong> {n.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(n.timestamp).toLocaleString('fr-FR')}</p>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-sm text-gray-500 text-center">Aucune notification.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <div className="relative">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <img 
                    src={`https://i.pravatar.cc/40?u=${user.id}`} 
                    alt={user.firstName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
              </div>
              {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                      <button 
                          onClick={logout}
                          className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                         <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                         Déconnexion
                      </button>
                  </div>
              )}
          </div>
        </div>
      </header>
      <ImpersonationModal 
        isOpen={isImpersonationModalOpen}
        onClose={() => setIsImpersonationModalOpen(false)}
        roleToImpersonate={roleToImpersonate}
      />
    </>
  );
};

export default Header;