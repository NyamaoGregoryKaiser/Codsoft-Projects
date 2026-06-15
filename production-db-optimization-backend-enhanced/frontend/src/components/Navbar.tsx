import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav>
      <Link to="/"><h1>DOMS</h1></Link>
      <div>
        {isAuthenticated ? (
          <>
            <Link to="/target-databases">Target Databases</Link>
            <Link to="/analysis-reports">Analysis Reports</Link>
            <Link to="/recommendations">Recommendations</Link>
            {user?.role === 'ADMIN' && <Link to="/users">Users</Link>}
            <span>Welcome, {user?.firstName || user?.email}!</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            {/* <Link to="/register">Register</Link> */} {/* Enable if self-registration is allowed */}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
```