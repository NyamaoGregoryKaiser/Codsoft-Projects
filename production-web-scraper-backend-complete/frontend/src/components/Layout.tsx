import React, { ReactNode } from 'react';
import { Nav } from './Nav';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Nav />
      <main className="flex-grow p-6 container mx-auto">
        {children}
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        &copy; {new Date().getFullYear()} Web Scraping System
      </footer>
    </div>
  );
};
```
---