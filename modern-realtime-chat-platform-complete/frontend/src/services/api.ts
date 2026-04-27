import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { LoginDto, RegisterDto, User, Room } from '../types'; // Import your types

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is crucial for sending cookies (if you're using httpOnly cookies)
});

// Request interceptor to add JWT token from localStorage/Cookies
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('accessToken') || localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling, e.g., token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors globally
    if (error.response?.status === 401) {
      console.error('Unauthorized: Token expired or invalid.');
      // Optionally, redirect to login page or trigger logout
      Cookies.remove('accessToken');
      localStorage.removeItem('accessToken');
      // window.location.href = '/'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export const AuthService = {
  login: async (username: string, password: string): Promise<{ access_token: string }> => {
    const response = await axiosInstance.post<LoginDto>('/auth/login', { username, password });
    return response.data;
  },
  register: async (username: string, email: string, password: string): Promise<User> => {
    const response = await axiosInstance.post<RegisterDto>('/auth/register', { username, email, password });
    return response.data;
  },
  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get<User>('/auth/profile');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = response.data; // Ensure password is never returned
    return userWithoutPassword;
  },
  // Add other auth related APIs like refresh token, forgot password, etc.
};

export const UserService = {
  getUsers: async (): Promise<User[]> => {
    const response = await axiosInstance.get<User[]>('/users');
    return response.data;
  },
  getUserById: async (id: string): Promise<User> => {
    const response = await axiosInstance.get<User>(`/users/${id}`);
    return response.data;
  },
  // Add other user management APIs
};

export const ChatService = {
  getUserRooms: async (): Promise<Room[]> => {
    const response = await axiosInstance.get<Room[]>('/chat/rooms'); // Assuming you'd add a REST endpoint for this
    return response.data;
  },
  // Note: Most chat actions (send message, create room, join room) will be via WebSockets.
  // This REST endpoint is for initial loading of user's joined rooms.
  // If you also need a REST API for rooms (e.g. for admin), you'd add ChatController for HTTP.
};