import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AuthActions, User } from '../types';

// Zustand store for authentication state
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true, // Initial loading state
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (loading) => set({ loading }),
      login: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'appinsight-auth', // name of the item in localStorage
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }), // Only persist these
      onRehydrateStorage: (state) => {
        // Set loading to false once rehydration is complete
        (state as AuthState & AuthActions).setLoading(false);
      },
    }
  )
);

// Context for React components to use the store
const AuthContext = createContext<AuthState & AuthActions | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuthStore();

  // Handle initial loading state after rehydration
  useEffect(() => {
    // If authState.loading is true, it means persist middleware is still rehydrating.
    // Zustand's persist middleware automatically sets loading to false via onRehydrateStorage
    // once data is loaded from localStorage.
    // If we're here and loading is still true, it means it's the very first render before rehydration.
    // The onRehydrateStorage callback ensures it eventually becomes false.
  }, [authState.loading]);

  const memoizedState = useMemo(() => authState, [authState]);

  return (
    <AuthContext.Provider value={memoizedState}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

```