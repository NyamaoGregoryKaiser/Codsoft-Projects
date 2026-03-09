import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes globally, e.g., redirect to login on 401
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- API Functions (Examples) ---

// Auth
export const login = (email: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  return apiClient.post('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

export const register = (email: string, password: string) => {
  return apiClient.post('/auth/register', { email, password });
};

export const fetchCurrentUser = () => {
  return apiClient.get('/auth/me');
};

// Scrapers
export const fetchScrapers = () => {
  return apiClient.get('/scrapers/');
};

export const fetchScraperById = (id: number) => {
  return apiClient.get(`/scrapers/${id}`);
};

export const createScraper = (data: any) => {
  return apiClient.post('/scrapers/', data);
};

export const updateScraper = (id: number, data: any) => {
  return apiClient.put(`/scrapers/${id}`, data);
};

export const deleteScraper = (id: number) => {
  return apiClient.delete(`/scrapers/${id}`);
};

// Jobs
export const triggerScrapingJob = (scraperId: number) => {
  return apiClient.post(`/jobs/${scraperId}/trigger`);
};

export const fetchJobs = () => {
  return apiClient.get('/jobs/');
};

export const fetchJobById = (id: number) => {
  return apiClient.get(`/jobs/${id}`);
};

// Results
export const fetchResultsByJob = (jobId: number) => {
  return apiClient.get(`/results/jobs/${jobId}/`);
};

export const fetchResultsByScraper = (scraperId: number) => {
  return apiClient.get(`/results/scrapers/${scraperId}/`);
};

export const fetchResultById = (resultId: number) => {
  return apiClient.get(`/results/${resultId}`);
};
```
---