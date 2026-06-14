```typescript
// frontend/src/components/layout/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { ChartSquareBarIcon, ViewColumnsIcon, DatabaseIcon, UsersIcon, XIcon } from '@heroicons/react/outline';
import { useAuthStore } from '@/stores/authStore';
import { Role } from '@/types/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN;

  const navItems = [
    { name: 'Dashboards', href: '/dashboards', icon: ViewColumnsIcon, roles: [Role.ADMIN, Role.USER, Role.VIEWER] },
    { name: 'Charts', href: '/charts', icon: ChartSquareBarIcon, roles: [Role.ADMIN, Role.USER] },
    { name: 'Data Sources', href: '/data-sources', icon: DatabaseIcon, roles: [Role.ADMIN, Role.USER] },
    ...(isAdmin ? [{ name: 'Users', href: '/users', icon: UsersIcon, roles: [Role.ADMIN] }] : []),
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:static md:shadow-none pt-16`}
      >
        <div className="p-4 md:hidden absolute top-4 right-4">
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-8">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                {user && item.roles.includes(user.role) && (
                  <Link href={item.href} className="flex items-center p-3 text-lg hover:bg-indigo-700 group">
                    <item.icon className="h-6 w-6 mr-3 text-gray-300 group-hover:text-white" />
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
```