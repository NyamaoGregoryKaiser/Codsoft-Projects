// This hook is actually just an alias for useContext(AuthContext)
// and is already implicitly used via `export const useAuth = () => useContext(AuthContext);`
// in AuthContext.js. Creating a separate file would be for more complex logic
// related to auth, or if AuthContext wasn't doing exactly what was needed.
// For this project, AuthContext.js serves both purposes.
// If you wanted to extract helper methods or wrap it, it would look like this:

import { useAuth as useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useAuthContext();
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};