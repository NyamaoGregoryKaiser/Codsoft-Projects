import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ModelDetailsPage from './pages/ModelDetailsPage';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import './App.css';

function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="App">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/models/:id" element={<ModelDetailsPage />} />
          {/* Add more routes as needed */}
        </Routes>
      </main>
    </div>
  );
}

export default App;