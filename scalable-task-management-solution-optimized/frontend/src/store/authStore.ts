import { create } from 'zustand';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode'; // npm i jwt-decode

interface UserProfile {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  login: (token: string) => {
    Cookies.set('accessToken', token, { expires: 1, secure: process.env.NODE_ENV === 'production' }); // Expires in 1 day
    try {
      const decoded: any = jwtDecode(token);
      const userProfile: UserProfile = {
        id: decoded.sub,
        username: decoded.username,
        email: decoded.email, // Assuming email is in payload or fetched separately
        roles: decoded.roles,
      };
      set({ accessToken: token, user: userProfile, isAuthenticated: true });
    } catch (e) {
      console.error('Failed to decode token:', e);
      set({ accessToken: null, user: null, isAuthenticated: false });
    }
  },

  logout: () => {
    Cookies.remove('accessToken');
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const token = Cookies.get('accessToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          console.log('Token expired.');
          Cookies.remove('accessToken');
          set({ accessToken: null, user: null, isAuthenticated: false });
        } else {
          const userProfile: UserProfile = {
            id: decoded.sub,
            username: decoded.username,
            email: decoded.email,
            roles: decoded.roles,
          };
          set({ accessToken: token, user: userProfile, isAuthenticated: true });
        }
      } catch (e) {
        console.error('Failed to decode or validate token:', e);
        Cookies.remove('accessToken');
        set({ accessToken: null, user: null, isAuthenticated: false });
      }
    } else {
      set({ isAuthenticated: false });
    }
  },
}));
```
**(Note: `jwt-decode` library is used for client-side token decoding. This is useful for UI purposes but never trust client-side decoded data for authorization; always verify tokens on the backend.)**