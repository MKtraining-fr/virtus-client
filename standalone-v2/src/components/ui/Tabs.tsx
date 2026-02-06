import React, { useState, ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
}) => {
  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (!disabled) {
      onChange(tabId);
    }
  };

  // Variant: Default (bordure en bas)
  if (variant === 'default') {
    return (
      <div className="border-b border-border dark:border-border">
        <div className={`flex ${fullWidth ? 'w-full' : 'gap-6'}`}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.disabled)}
                disabled={tab.disabled}
                className={`
                  ${fullWidth ? 'flex-1' : ''}
                  flex items-center justify-center gap-2
                  px-4 py-3
                  text-sm font-medium
                  border-b-2
                  transition-colors
                  ${isActive
                    ? 'border-brand-500 text-brand-500'
                    : 'border-transparent text-text-tertiary dark:text-text-tertiary hover:text-text-secondary dark:hover:text-text-secondary'
                  }
                  ${tab.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${isActive
                      ? 'bg-brand-500 text-white'
                      : 'bg-bg-secondary dark:bg-bg-secondary text-text-tertiary dark:text-text-tertiary'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant: Pills (boutons arrondis)
  if (variant === 'pills') {
    return (
      <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.disabled)}
              disabled={tab.disabled}
              className={`
                ${fullWidth ? 'flex-1' : ''}
                flex items-center justify-center gap-2
                px-4 py-2
                rounded-lg
                text-sm font-medium
                transition-all
                ${isActive
                  ? 'bg-brand-500 text-white shadow-lg'
                  : 'bg-bg-secondary dark:bg-bg-secondary text-text-tertiary dark:text-text-tertiary hover:bg-bg-hover dark:hover:bg-bg-hover'
                }
                ${tab.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-bg-primary dark:bg-bg-primary text-text-tertiary dark:text-text-tertiary'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: Underline (soulignement simple)
  if (variant === 'underline') {
    return (
      <div className={`flex gap-6 ${fullWidth ? 'w-full' : ''}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.disabled)}
              disabled={tab.disabled}
              className={`
                ${fullWidth ? 'flex-1' : ''}
                flex items-center justify-center gap-2
                pb-2
                text-sm font-medium
                border-b-2
                transition-colors
                ${isActive
                  ? 'border-brand-500 text-text-primary dark:text-text-primary'
                  : 'border-transparent text-text-tertiary dark:text-text-tertiary hover:text-text-secondary dark:hover:text-text-secondary'
                }
                ${tab.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${isActive
                    ? 'bg-brand-500/10 text-brand-500'
                    : 'bg-bg-secondary dark:bg-bg-secondary text-text-tertiary dark:text-text-tertiary'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
};

export default Tabs;
