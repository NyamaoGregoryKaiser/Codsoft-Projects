```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
      <div className="card">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="btn">Go to Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
```