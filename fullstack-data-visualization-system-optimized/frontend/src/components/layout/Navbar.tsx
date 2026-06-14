```typescript
// frontend/src/components/layout/Navbar.tsx
import React from 'react';
import Link from 'next/link';
import { UserProfile } from '@/types/auth';
import { Button } from '../ui/Button';
import { PowerIcon, MenuIcon } from '@heroicons/react/outline'; // Example icons

interface NavbarProps {
  user: UserProfile;
  onLogout: () => void;
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onMenuClick }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <button className="md:hidden mr-4 text-gray-600 hover:text-indigo-600" onClick={onMenuClick}>
          <MenuIcon className="h-6 w-6" />
        </button>
        <Link href="/dashboards" className="text-2xl font-bold text-indigo-600">
          DataViz Pro
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-gray-700 text-sm hidden sm:block">Welcome, <span className="font-semibold">{user.username}</span>!</span>
        <Button onClick={onLogout} variant="secondary" size="sm" className="flex items-center space-x-2">
          <PowerIcon className="h-4 w-4" />
          <span className="hidden sm:block">Logout</span>
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
```