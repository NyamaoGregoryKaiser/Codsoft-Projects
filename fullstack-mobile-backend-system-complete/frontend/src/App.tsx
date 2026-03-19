import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">Task Manager</h1>
      {!isAuthenticated ? (
        <div className="flex flex-col md:flex-row justify-center gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md w-full md:max-w-md">
            <Login />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md w-full md:max-w-md">
            <Register />
          </div>
        </div>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;