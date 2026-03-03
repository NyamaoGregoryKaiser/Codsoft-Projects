import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Layout.css';

function Header() {
  const { user } = useAuth();
  return (
    <header className="header">
      <div className="user-info">
        <span>Logged in as: <strong>{user?.firstName} {user?.lastName}</strong> ({user?.role})</span>
      </div>
    </header>
  );
}

export default Header;