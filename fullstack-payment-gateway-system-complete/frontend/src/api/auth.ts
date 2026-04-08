import api from './axios';
import { LoginDto, RegisterDto, AuthResponse, UserProfile } from '@/types/auth';

export const loginUser = async (credentials: LoginDto): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData: RegisterDto): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', userData);
  return response.data;
};

// This would typically be an endpoint to fetch the currently logged-in user's profile
// For this example, we're extracting from JWT directly, but this is a good pattern.
export const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('/users/me'); // Assuming a /users/me endpoint
  return response.data;
};