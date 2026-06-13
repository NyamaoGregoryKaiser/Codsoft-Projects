import React, { useState, useEffect } from 'react';
import AppRouter from './router';
import Navbar from './components/Navbar';
import AuthContext from './utils/AuthContext';
import { getUserProfile } from './api/api'; // Assuming you have a way to fetch current user

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data (e.g., after login/register)
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await getUserProfile(token); // Fetch user profile using the token
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div>Loading application...</div>; // Simple loading state
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      <div className="App">
        <Navbar />
        <main className="container mx-auto p-4">
          <AppRouter />
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;