import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ComputerDesktopIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={twMerge(
        'flex items-center px-4 py-2 rounded-lg transition-colors',
        'text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700 dark:hover:text-secondary',
        isActive && 'bg-primary text-white hover:bg-primary dark:bg-secondary dark:text-dark-text'
      )}
    >
      <Icon className={twMerge('h-5 w-5 mr-3', isActive && 'text-white dark:text-dark-text')} />
      <span className="font-medium">{children}</span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  return (
    <aside className="bg-card-bg dark:bg-dark-card-bg w-64 p-4 border-r border-gray-100 dark:border-gray-700 flex-shrink-0">
      <nav className="space-y-2">
        <NavLink to="/" icon={HomeIcon}>
          Dashboard
        </NavLink>
        <NavLink to="/projects" icon={ComputerDesktopIcon}>
          My Projects
        </NavLink>
        <NavLink to="/projects/new" icon={PlusCircleIcon}>
          New Project
        </NavLink>
        {/* Add more sidebar links */}
      </nav>
    </aside>
  );
};

export default Sidebar;
```

```