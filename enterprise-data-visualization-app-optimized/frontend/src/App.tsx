```typescript
import React from 'react';
import AppRoutes from './routes/AppRoutes';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {isAuthenticated && <Sidebar />}
      <div className="flex flex-col flex-1 overflow-hidden">
        {isAuthenticated && <Header />}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800 p-4">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}

export default App;
```