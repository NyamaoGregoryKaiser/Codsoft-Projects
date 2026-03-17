import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, UserRole } from '../types';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authRequest(state) {
      state.loading = true;
      state.error = null;
    },
    authSuccess(state, action: PayloadAction<{ user: Pick<User, 'id' | 'email' | 'role'>; token: string }>) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = { ...action.payload.user, isActive: true, createdAt: '', updatedAt: '' }; // Add dummy values for missing fields
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
    },
    authFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      localStorage.removeItem('token');
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('token');
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    }
  },
});

export const { authRequest, authSuccess, authFailure, logout, setUser } = authSlice.actions;
export default authSlice.reducer;