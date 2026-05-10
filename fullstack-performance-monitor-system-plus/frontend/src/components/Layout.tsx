import React from 'react';
import Navbar from './layout/Navbar';
import Sidebar from './layout/Sidebar';
import { useAuth } from '../hooks/useAuth';
import ToastContainer from './common/ToastContainer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Layout;
```

```