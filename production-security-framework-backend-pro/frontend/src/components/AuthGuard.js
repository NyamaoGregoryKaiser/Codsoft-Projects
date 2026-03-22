```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthGuard = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default AuthGuard;
```