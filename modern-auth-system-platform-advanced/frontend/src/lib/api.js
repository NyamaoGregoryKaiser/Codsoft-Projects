const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + '/api';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.response = data;
    throw error;
  }
  return data;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const api = {
  // Auth Endpoints
  register: async (username, password, role = 'USER') => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });
    return handleResponse(response);
  },

  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    if (data.accessToken && data.refreshToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await handleResponse(response);
    if (data.accessToken && data.refreshToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  },

  logout: async () => {
    // In a stateless JWT system, logout is mainly client-side token deletion.
    // The backend endpoint can be called for server-side cleanup/logging if implemented.
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      // Even if backend fails, client-side logout should proceed
      if (response.ok) {
        console.log('Backend logout acknowledged.');
      } else {
        const errorData = await response.json();
        console.error('Backend logout failed:', errorData);
      }
    } catch (error) {
      console.error('Error during backend logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    return { status: 'success', message: 'Logged out' };
  },

  // User Profile Endpoints
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  updateProfile: async (updates) => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  // Admin Endpoints (example)
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
  
  // ... other admin methods (getUserById, createUser, updateUser, deleteUser) could be added here
};

export default api;
```

### `frontend/src/app/layout.js`
```javascript