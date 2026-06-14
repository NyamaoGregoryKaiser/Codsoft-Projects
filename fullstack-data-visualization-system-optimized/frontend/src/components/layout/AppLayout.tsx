```typescript
// frontend/src/components/layout/AppLayout.tsx
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/router';
import Spinner from '../ui/Spinner';
import { Role } from '@/types/auth';

interface AppLayoutProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, allowedRoles }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, logout } = useAuthStore();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    router.push('/unauthorized'); // Or redirect to home/dashboards
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} user={user} onLogout={logout} />
      <div className="flex flex-1 pt-16"> {/* Adjust padding top for fixed navbar height */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
```