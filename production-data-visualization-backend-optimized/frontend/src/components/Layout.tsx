```typescript
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">DataVizPro</Link>
        </div>
        <div className="navbar-menu">
          <Link to="/dashboards" className="navbar-item">Dashboards</Link>
          <Link to="/visualizations/new" className="navbar-item">Create Viz</Link>
          <Link to="/data-sources" className="navbar-item">Data Sources</Link>
        </div>
        <div className="navbar-user">
          {user && (
            <>
              <span>Welcome, {user.username} ({user.role})</span>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </>
          )}
        </div>
      </nav>
      <main className="layout-main-content">
        <Outlet /> {/* Renders the child route components */}
      </main>
    </div>
  );
};

export default Layout;
```