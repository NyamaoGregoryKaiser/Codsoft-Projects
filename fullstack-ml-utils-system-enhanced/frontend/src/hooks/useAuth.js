```javascript
// This file is actually redundant if AuthContext.js exports useAuth directly.
// But as an example of a custom hook that might wrap useContext, I'll include it.
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```