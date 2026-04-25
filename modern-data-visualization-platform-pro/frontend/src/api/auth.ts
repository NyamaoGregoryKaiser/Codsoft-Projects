import axiosInstance from './axiosInstance';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../config/env';
import { User } from '../types/user';

interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

/**
 * API service for authentication-related operations.
 */
const AuthService = {
  /**
   * Registers a new user.
   * @param username - The username.
   * @param email - The email.
   * @param password - The password.
   * @returns The authentication response.
   */
  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(`${API_BASE_URL}/auth/register`, { username, email, password });
    AuthService.setAuthToken(response.data.token);
    return response.data;
  },

  /**
   * Logs in an existing user.
   * @param email - The email.
   * @param password - The password.
   * @returns The authentication response.
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password });
    AuthService.setAuthToken(response.data.token);
    return response.data;
  },

  /**
   * Retrieves the profile of the current authenticated user.
   * @returns The user object.
   */
  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get<User>(`${API_BASE_URL}/auth/me`);
    return response.data;
  },

  /**
   * Sets the authentication token in cookies and default Axios headers.
   * @param token - The JWT token.
   */
  setAuthToken: (token: string): void => {
    Cookies.set('token', token, { expires: 7, secure: window.location.protocol === 'https:', sameSite: 'Lax' });
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Gets the authentication token from cookies.
   * @returns The JWT token or null if not found.
   */
  getAuthToken: (): string | null => {
    return Cookies.get('token') || null;
  },

  /**
   * Removes the authentication token from cookies and Axios headers.
   */
  removeAuthToken: (): void => {
    Cookies.remove('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
  },
};

export default AuthService;