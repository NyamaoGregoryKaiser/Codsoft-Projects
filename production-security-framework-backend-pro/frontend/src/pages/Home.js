```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container">
      <h2>Welcome to Secure Task Management</h2>
      <p>Organize your projects and tasks securely.</p>
      <p>
        <Link to="/register">Join us</Link> or <Link to="/login">Login</Link> to get started.
      </p>
    </div>
  );
};

export default Home;
```