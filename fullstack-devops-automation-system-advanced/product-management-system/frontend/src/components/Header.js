import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../App.css'; // For header styles

function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="App-header">
      <h1><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Product Manager</Link></h1>
      <nav>
        <ul>
          {user ? (
            <>
              <li><Link to="/products">My Products</Link></li>
              <li><Link to="/products/new">Add Product</Link></li>
              <li><button onClick={handleLogout} className="btn-secondary btn">Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
```

```