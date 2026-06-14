```typescript
// frontend/src/stores/authStore.ts
import { create } from 'zustand';
import api from '@/lib/api';
import { UserProfile, LoginPayload, Role } from '@/types/auth'; // Define these types
import { setCookie, removeCookie } from '@/lib/cookies'; // Helper for cookie management
import { jwtDecode } from 'jwt-decode'; // For decoding JWT

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const payload: LoginPayload = { email, password };
      const response = await api.post('/auth/login', payload);
      const { accessToken } = response.data;

      const decodedUser: UserProfile = jwtDecode(accessToken); // Assuming JWT contains user info
      
      setCookie('accessToken', accessToken, 7); // Store token for 7 days

      set({ user: decodedUser, token: accessToken, isLoading: false });
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`; // Set default auth header

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false, user: null, token: null });
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    removeCookie('accessToken');
    set({ user: null, token: null, isLoading: false, error: null });
    delete api.defaults.headers.common['Authorization'];
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const storedToken = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];

      if (storedToken) {
        // Validate token if needed, or just decode and assume valid
        const decodedUser: UserProfile = jwtDecode(storedToken);
        // Optional: Check token expiry
        if (decodedUser.exp * 1000 < Date.now()) {
          get().logout();
          return;
        }

        set({ user: decodedUser, token: storedToken, isLoading: false });
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } else {
        set({ user: null, token: null, isLoading: false });
        delete api.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      get().logout(); // Invalidate on error (e.g., malformed token)
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Run checkAuth once when the store is initialized on the client side
// This needs to be handled in _app.tsx or a dedicated AuthProvider
// For Next.js, this is better in an effect within the AuthProvider component.
```