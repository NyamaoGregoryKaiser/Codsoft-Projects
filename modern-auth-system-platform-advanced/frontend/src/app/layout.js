import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Only available in client components
import api from '../lib/api'; // Import api client

export const metadata = {
  title: 'Authentication System',
  description: 'Full-stack C++ Backend & React Frontend Auth System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}

// Client component to handle auth state and navigation
import { useState, useEffect, createContext, useContext } from 'react';
import { SWRConfig } from 'swr';

const AuthContext = createContext(null);

function AuthWrapper({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // In a real app, you'd verify token validity with the backend on load
      // For this example, we'll assume a token means authenticated until it fails an API call
      setIsAuthenticated(true);
      // Fetch profile to get user details
      api.getProfile().then(data => {
        if (data.user) setUser(data.user);
      }).catch(err => {
        console.error("Failed to fetch profile on load:", err);
        handleLogout();
      });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    // Fetch user profile immediately after login
    try {
      const profile = await api.getProfile();
      setUser(profile.user);
      router.push('/profile');
    } catch (error) {
      console.error("Failed to fetch profile after login:", error);
      handleLogout(); // Log out if profile fetch fails
    }
  };

  const handleLogout = async () => {
    await api.logout(); // Clear tokens from localStorage
    setIsAuthenticated(false);
    setUser(null);
    router.push('/');
  };

  const authContextValue = {
    isAuthenticated,
    user,
    login: handleLoginSuccess, // This is just a trigger, actual login happens in AuthForm
    logout: handleLogout,
    setUserProfile: setUser,
  };

  const fetcher = async (url) => {
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) {
        // Attempt to refresh token or logout
        try {
          await api.refreshToken();
          // Retry original request (this simple fetcher doesn't re-execute, SWR might)
          // For a real app, SWR should be configured with a refresh mechanism
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
          handleLogout();
        }
      }
      const error = new Error('An error occurred while fetching the data.');
      error.info = await res.json();
      error.status = res.status;
      throw error;
    }
    return res.json();
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <SWRConfig value={{ fetcher }}>
        <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">Auth System</Link>
          <nav>
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="mr-4 hover:text-gray-300">Profile</Link>
                {user?.role === 'ADMIN' && (
                  <Link href="/admin/dashboard" className="mr-4 hover:text-gray-300">Admin</Link> // Placeholder
                )}
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="mr-4 hover:text-gray-300">Login/Register</Link>
              </>
            )}
          </nav>
        </header>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </SWRConfig>
    </AuthContext.Provider>
  );
}

// Utility hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Get auth headers helper (also used by lib/api.js)
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
```

### `frontend/src/app/page.js` (Login/Register)
```javascript