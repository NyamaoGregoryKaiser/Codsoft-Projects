import { renderHook, act, waitFor } from '@testing-library/react';
    import { AuthProvider, useAuth } from './AuthContext';
    import { ReactNode } from 'react';
    import * as authApi from '../api/auth.api';
    import { MemoryRouter } from 'react-router-dom';

    // Mock localStorage
    const localStorageMock = (() => {
      let store: { [key: string]: string } = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock API calls
    jest.mock('../api/auth.api', () => ({
      login: jest.fn(),
      register: jest.fn(),
      fetchProfile: jest.fn(),
    }));

    const mockLogin = authApi.login as jest.Mock;
    const mockRegister = authApi.register as jest.Mock;
    const mockFetchProfile = authApi.fetchProfile as jest.Mock;

    const wrapper = ({ children }: { children?: ReactNode }) => (
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    );

    describe('AuthContext', () => {
      beforeEach(() => {
        localStorageMock.clear();
        mockLogin.mockReset();
        mockRegister.mockReset();
        mockFetchProfile.mockReset();
      });

      it('should initialize with no user and loading state', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBeFalsy();
        expect(result.current.isLoading).toBeTruthy(); // Initially loading to check token
      });

      it('should load user from localStorage if token exists', async () => {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkLTEyMyIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJyb2xlIjoidXNlciIsImlhdCI6MTUxNjIzOTAyMn0.S_J2Q5k4Q0X8U0Q4X0X8U0Q4X0X8U0Q4X0X8U0Q4';
        const mockUser = { id: 'uuid-123', username: 'testuser', email: 'test@example.com', role: 'user' };
        localStorageMock.setItem('token', mockToken);
        mockFetchProfile.mockResolvedValue({ user: mockUser });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(mockFetchProfile).toHaveBeenCalled();
          expect(result.current.user).toEqual(mockUser);
          expect(result.current.isAuthenticated).toBeTruthy();
          expect(result.current.isLoading).toBeFalsy();
        });
      });

      it('should clear token if profile fetch fails', async () => {
        const mockToken = 'invalid.token.here';
        localStorageMock.setItem('token', mockToken);
        mockFetchProfile.mockRejectedValue(new Error('Invalid token'));

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(mockFetchProfile).toHaveBeenCalled();
          expect(result.current.user).toBeNull();
          expect(result.current.isAuthenticated).toBeFalsy();
          expect(result.current.isLoading).toBeFalsy();
          expect(localStorageMock.getItem('token')).toBeNull();
        });
      });

      it('should handle successful login', async () => {
        const mockToken = 'new.jwt.token';
        const mockUser = { id: 'uuid-abc', username: 'logged_in', email: 'logged@example.com', role: 'user' };
        mockLogin.mockResolvedValue({ accessToken: mockToken });
        mockFetchProfile.mockResolvedValue({ user: mockUser });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
          await result.current.login('logged_in', 'password123');
        });

        await waitFor(() => {
          expect(mockLogin).toHaveBeenCalledWith('logged_in', 'password123');
          expect(localStorageMock.getItem('token')).toEqual(mockToken);
          expect(mockFetchProfile).toHaveBeenCalled();
          expect(result.current.user).toEqual(mockUser);
          expect(result.current.isAuthenticated).toBeTruthy();
          expect(result.current.error).toBeNull();
        });
      });

      it('should handle login failure', async () => {
        const errorMessage = 'Invalid credentials';
        mockLogin.mockRejectedValue({ response: { data: { message: errorMessage } } });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
          await result.current.login('wrong', 'wrong');
        });

        await waitFor(() => {
          expect(mockLogin).toHaveBeenCalled();
          expect(localStorageMock.getItem('token')).toBeNull();
          expect(result.current.user).toBeNull();
          expect(result.current.isAuthenticated).toBeFalsy();
          expect(result.current.error).toEqual(errorMessage);
        });
      });

      it('should handle successful registration', async () => {
        mockRegister.mockResolvedValue({ message: 'User registered successfully' });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
          await result.current.register('newuser', 'new@example.com', 'password');
        });

        await waitFor(() => {
          expect(mockRegister).toHaveBeenCalledWith({
            username: 'newuser',
            email: 'new@example.com',
            password: 'password',
          });
          expect(result.current.error).toBeNull();
        });
      });

      it('should handle registration failure', async () => {
        const errorMessage = 'Username already exists';
        mockRegister.mockRejectedValue({ response: { data: { message: errorMessage } } });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
          await result.current.register('existing', 'existing@example.com', 'password');
        });

        await waitFor(() => {
          expect(mockRegister).toHaveBeenCalled();
          expect(result.current.error).toEqual(errorMessage);
        });
      });

      it('should handle logout', async () => {
        const mockToken = 'existing.jwt.token';
        localStorageMock.setItem('token', mockToken);
        mockFetchProfile.mockResolvedValue({ user: { id: 'some-id', username: 'some-user' } });

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Wait for initial load
        await waitFor(() => expect(result.current.isAuthenticated).toBeTruthy());

        act(() => {
          result.current.logout();
        });

        expect(localStorageMock.getItem('token')).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBeFalsy();
      });
    });